// Offline CSV → point GeoJSON extractor (Prompt 3C, map-table).
//
// For gazetteer-style tables (a row per place, with coordinates), fetches the
// source server-side, DETECTS the lat/lon columns BY VALUE (works on headerless
// files like the GeoNames export), validates each coordinate against Guyana's
// bounding box, and writes a Point FeatureCollection to
// public/data/points/<id>.geojson. Records that gain points are set to
// viewerType 'map-table' (points on the map + the existing inline table).
//
// Honest by construction: rows with missing / non-numeric / out-of-range / (0,0)
// coordinates are DROPPED from the map layer (they remain in the table preview)
// and reported per dataset. Coordinates are never invented or "snapped".
//
// Run: npm run extract:points
//      npm run extract:points -- <id> [<id> ...]

import fs from 'fs';
import path from 'path';
import { parseTable, Cell } from './lib/tableParse.js';
import { rebuildGeojsonManifest } from './lib/geojsonManifest.js';
import { PREVIEW_GEOJSON_MAX_BYTES } from '../utils/datasetValidation.js';

const ROOT = process.cwd();
const DATA_PATH = path.resolve(ROOT, 'public/data/datasets.json');
const POINTS_DIR = path.resolve(ROOT, 'public/data/points');

// Guyana bounding box (small margin). Coordinates outside this are treated as
// errors, not plotted — see the "Aan de Adventure" (-56.27) typo and "Belle
// View" (0,0) null-island rows in the gazetteer.
const LAT_MIN = 1;
const LAT_MAX = 9;
const LNG_MIN = -61.5;
const LNG_MAX = -56.3;

// Only tables that are actually place gazetteers. (Other CSV/XLSX records —
// admin lists, census totals — have no per-row coordinates.)
const POINT_CANDIDATE_IDS = new Set(['gazetteer-places', 'geoname-places']);

// Keep point popups (and the file) lean: cap how many attribute columns and how
// long a single value we carry per feature. Wide exports (e.g. GeoNames, 19
// columns) otherwise blow the size budget; narrow gazetteers are unaffected.
const MAX_POINT_PROPS = 10;
const MAX_PROP_CHARS = 120;

interface DatasetRecord {
  id: string;
  format?: string;
  downloadUrl?: string;
  viewerType?: string;
  geojsonUrl?: string;
  category?: string;
  [key: string]: unknown;
}

type Outcome =
  | { id: string; status: 'mapped'; url: string; mapped: number; dropped: number; total: number; reasons: Record<string, number> }
  | { id: string; status: 'skipped'; reason: string };

const num = (c: Cell): number | null => {
  if (c === null) return null;
  const n = Number(String(c).trim());
  return Number.isFinite(n) ? n : null;
};

const inLat = (n: number) => n >= LAT_MIN && n <= LAT_MAX;
const inLng = (n: number) => n >= LNG_MIN && n <= LNG_MAX;

/**
 * Detect which columns hold latitude and longitude by VALUE, not name: pick the
 * column pair whose numeric values most often fall in Guyana's lat / lng ranges.
 * Returns null if no column reads convincingly as coordinates.
 */
const detectLatLngColumns = (
  columns: string[],
  rows: Cell[][]
): { latIdx: number; lngIdx: number } | null => {
  const sample = rows.slice(0, 200);
  const score = (idx: number, test: (n: number) => boolean): number => {
    let hits = 0;
    let numeric = 0;
    for (const r of sample) {
      const n = num(r[idx]);
      if (n === null) continue;
      numeric++;
      if (test(n)) hits++;
    }
    // Require the column to be mostly numeric and mostly in-range.
    return numeric >= sample.length * 0.5 && hits >= numeric * 0.7 ? hits : -1;
  };

  let latIdx = -1;
  let lngIdx = -1;
  let bestLat = 0;
  let bestLng = 0;
  for (let i = 0; i < columns.length; i++) {
    const latScore = score(i, inLat);
    if (latScore > bestLat) {
      bestLat = latScore;
      latIdx = i;
    }
    const lngScore = score(i, inLng);
    if (lngScore > bestLng) {
      bestLng = lngScore;
      lngIdx = i;
    }
  }
  if (latIdx < 0 || lngIdx < 0 || latIdx === lngIdx) return null;
  return { latIdx, lngIdx };
};

const buildPoints = (
  columns: string[],
  rows: Cell[][],
  latIdx: number,
  lngIdx: number
): { fc: GeoJSON.FeatureCollection; mapped: number; dropped: number; reasons: Record<string, number> } => {
  const reasons: Record<string, number> = {};
  const bump = (k: string) => (reasons[k] = (reasons[k] ?? 0) + 1);
  const propCols = columns
    .map((_, i) => i)
    .filter((i) => i !== latIdx && i !== lngIdx)
    .slice(0, MAX_POINT_PROPS);

  const features: GeoJSON.Feature[] = [];
  for (const r of rows) {
    const lat = num(r[latIdx]);
    const lng = num(r[lngIdx]);
    if (lat === null || lng === null) {
      bump('missing/non-numeric coordinates');
      continue;
    }
    if (lat === 0 && lng === 0) {
      bump('null island (0,0)');
      continue;
    }
    if (!inLat(lat) || !inLng(lng)) {
      bump('out of Guyana bounds');
      continue;
    }
    const properties: Record<string, Cell> = {};
    for (const i of propCols) {
      const v = r[i];
      if (v === null) continue; // omit empty cells to keep features small
      properties[columns[i]] = typeof v === 'string' && v.length > MAX_PROP_CHARS ? v.slice(0, MAX_PROP_CHARS) + '…' : v;
    }
    // Round to ~1m to keep the file small; not a precision claim.
    features.push({
      type: 'Feature',
      properties,
      geometry: { type: 'Point', coordinates: [Math.round(lng * 1e5) / 1e5, Math.round(lat * 1e5) / 1e5] },
    });
  }
  const dropped = rows.length - features.length;
  return { fc: { type: 'FeatureCollection', features }, mapped: features.length, dropped, reasons };
};

const extractRecord = async (record: DatasetRecord): Promise<Outcome> => {
  const { id, downloadUrl } = record;
  if (!downloadUrl) return { id, status: 'skipped', reason: 'no downloadUrl' };
  try {
    const res = await fetch(downloadUrl, { redirect: 'follow' });
    if (!res.ok) return { id, status: 'skipped', reason: `HTTP ${res.status}` };
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength === 0) return { id, status: 'skipped', reason: 'empty file' };

    const { columns, rows } = parseTable(buf);
    const cols = detectLatLngColumns(columns, rows);
    if (!cols) return { id, status: 'skipped', reason: 'no latitude/longitude columns detected' };

    const { fc, mapped, dropped, reasons } = buildPoints(columns, rows, cols.latIdx, cols.lngIdx);
    if (mapped === 0) return { id, status: 'skipped', reason: 'no rows with valid coordinates' };

    fs.mkdirSync(POINTS_DIR, { recursive: true });
    const outFile = path.join(POINTS_DIR, `${id}.geojson`);
    fs.writeFileSync(outFile, JSON.stringify(fc), 'utf8');

    const bytes = fs.statSync(outFile).size;
    if (bytes > PREVIEW_GEOJSON_MAX_BYTES) {
      fs.rmSync(outFile, { force: true });
      return { id, status: 'skipped', reason: `points file ${bytes} bytes exceeds budget ${PREVIEW_GEOJSON_MAX_BYTES}` };
    }

    return { id, status: 'mapped', url: `/data/points/${id}.geojson`, mapped, dropped, total: rows.length, reasons };
  } catch (err) {
    return { id, status: 'skipped', reason: err instanceof Error ? err.message : String(err) };
  }
};

// Idempotently patch datasets.json: mapped → 'map-table' + geojsonUrl; a
// processed candidate that failed reverts to 'table' (keeping its table preview)
// or 'none' and drops a stale points geojsonUrl.
const patchDatasets = (records: DatasetRecord[], mapped: Map<string, string>, processedIds: Set<string>): number => {
  let changed = 0;
  for (const rec of records) {
    if (!processedIds.has(rec.id)) continue;
    const url = mapped.get(rec.id);
    if (url) {
      if (rec.geojsonUrl !== url || rec.viewerType !== 'map-table') {
        rec.geojsonUrl = url;
        rec.viewerType = 'map-table';
        changed++;
      }
    } else {
      const hadPoints = typeof rec.geojsonUrl === 'string' && rec.geojsonUrl.startsWith('/data/points/');
      if (hadPoints || rec.viewerType === 'map-table') {
        if (hadPoints) delete rec.geojsonUrl;
        // Fall back to a table preview if one exists, else non-previewable.
        rec.viewerType = rec.tablePreviewUrl ? 'table' : 'none';
        changed++;
      }
    }
  }
  return changed;
};

const main = async () => {
  const records: DatasetRecord[] = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const argIds = process.argv.slice(2).filter((a) => !a.startsWith('-'));

  let candidates = records.filter((r) => POINT_CANDIDATE_IDS.has(r.id) && r.downloadUrl);
  if (argIds.length) candidates = candidates.filter((r) => argIds.includes(r.id));

  console.log(`\nCSV → point GeoJSON — ${candidates.length} candidate(s)\n`);

  const outcomes: Outcome[] = [];
  for (const rec of candidates) {
    process.stdout.write(`  ${rec.id} … `);
    const outcome = await extractRecord(rec);
    outcomes.push(outcome);
    if (outcome.status === 'mapped') {
      const reasons = Object.entries(outcome.reasons).map(([k, v]) => `${v} ${k}`).join(', ');
      console.log(`ok (${outcome.mapped} mapped of ${outcome.total}; ${outcome.dropped} dropped${reasons ? ` — ${reasons}` : ''})`);
    } else {
      console.log(`SKIP — ${outcome.reason}`);
    }
  }

  const mappedUrls = new Map<string, string>();
  for (const rec of candidates) {
    const o = outcomes.find((x) => x.id === rec.id && x.status === 'mapped');
    if (o && o.status === 'mapped') {
      mappedUrls.set(rec.id, o.url);
    } else {
      const file = path.join(POINTS_DIR, `${rec.id}.geojson`);
      if (fs.existsSync(file) && !outcomes.some((x) => x.id === rec.id && x.status === 'skipped')) {
        mappedUrls.set(rec.id, `/data/points/${rec.id}.geojson`);
      }
    }
  }

  const manifestCount = rebuildGeojsonManifest(ROOT);

  const processedIds = new Set(candidates.map((c) => c.id));
  const changed = patchDatasets(records, mappedUrls, processedIds);
  if (changed > 0) fs.writeFileSync(DATA_PATH, JSON.stringify(records, null, 2) + '\n', 'utf8');

  const ok = outcomes.filter((o) => o.status === 'mapped').length;
  const skipped = outcomes.filter((o) => o.status === 'skipped').length;
  console.log(`\nSummary: ${ok} mapped, ${skipped} skipped, ${candidates.length} processed.`);
  console.log(`GeoJSON manifest entries (all on disk): ${manifestCount}`);
  console.log(`datasets.json records changed: ${changed}\n`);
};

main().catch((err) => {
  console.error('Point extraction failed:', err);
  process.exit(1);
});
