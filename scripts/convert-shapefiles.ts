// Offline shapefile → GeoJSON conversion pipeline (Prompt 3A).
//
// Fetches each Shapefile dataset's source zip from its GCS `downloadUrl`,
// converts it to browser-renderable GeoJSON (WGS84, cleaned, simplified,
// size-bounded), writes the result to public/data/<category>/<id>.geojson,
// regenerates data/geojsonManifest.ts, and patches public/data/datasets.json
// (geojsonUrl + viewerType) for records that actually converted.
//
// This runs OFFLINE / on demand (NOT in the deterministic prebuild) because it
// hits the network. Converted files + manifest + datasets.json edits are the
// committed artifacts. Re-running is idempotent and honest: a record whose
// source is missing, unreachable, empty, unconvertible, or over-budget is left
// `viewerType: 'none'` with no geojsonUrl — we never fabricate geometry.
//
// Run: npm run convert:shapefiles
//      npm run convert:shapefiles -- <id> [<id> ...]   (subset, for iteration)

import fs from 'fs';
import path from 'path';
import os from 'os';
import { execFileSync } from 'child_process';
import mapshaper from 'mapshaper';
import { PREVIEW_GEOJSON_MAX_BYTES } from '../utils/datasetValidation.js';
import { rebuildGeojsonManifest } from './lib/geojsonManifest.js';

const ROOT = process.cwd();
const DATA_PATH = path.resolve(ROOT, 'public/data/datasets.json');
const PUBLIC_DATA_DIR = path.resolve(ROOT, 'public/data');

// Per-file raw (uncompressed on-disk) size budget for a browser-renderable
// preview. Shared with validation (single source of truth) so the pipeline and
// the build check agree.
const BUDGET_BYTES = PREVIEW_GEOJSON_MAX_BYTES;

// Progressive simplification ladder. We keep as much detail as fits the budget,
// stepping down only when a file is too large. `keep-shapes` stops small
// polygons from vanishing; `clean` repairs invalid geometry.
const SIMPLIFY_STEPS: Array<{ pct: string; precision: string }> = [
  // Keep full ~1m precision while we still fit the budget…
  { pct: '20%', precision: '0.00001' },
  { pct: '12%', precision: '0.00001' },
  { pct: '7%', precision: '0.00001' },
  // …then trade coordinate precision (~100m) before dropping more vertices,
  // since coarser precision shrinks bytes while preserving feature topology.
  { pct: '12%', precision: '0.001' },
  { pct: '7%', precision: '0.001' },
  { pct: '4%', precision: '0.001' },
  { pct: '2%', precision: '0.001' },
];

interface DatasetRecord {
  id: string;
  category?: string;
  format?: string;
  downloadUrl?: string;
  geojsonUrl?: string;
  viewerType?: string;
  [key: string]: unknown;
}

type Outcome =
  | { id: string; status: 'converted'; url: string; bytes: number; features: number; simplify: string }
  | { id: string; status: 'skipped'; reason: string };

const slugForCategory = (category: string | undefined): string =>
  (category || 'uncategorized')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const isWgs84Coord = (lng: number, lat: number): boolean =>
  Number.isFinite(lng) && Number.isFinite(lat) && Math.abs(lng) <= 180 && Math.abs(lat) <= 90;

// Walk a GeoJSON geometry to find the first coordinate pair, for a sanity check
// that reprojection actually produced lon/lat (not projected metres).
const firstCoord = (geometry: GeoJSON.Geometry | null): [number, number] | null => {
  if (!geometry || !('coordinates' in geometry)) return null;
  let node: unknown = geometry.coordinates;
  while (Array.isArray(node) && Array.isArray(node[0])) node = node[0];
  if (Array.isArray(node) && typeof node[0] === 'number' && typeof node[1] === 'number') {
    return [node[0], node[1]];
  }
  return null;
};

const downloadZip = async (url: string, dest: string): Promise<void> => {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength === 0) throw new Error('empty response body');
  fs.writeFileSync(dest, buf);
};

// Recursively find the first real .shp in an extracted archive, ignoring the
// macOS resource-fork entries (__MACOSX / ._name) some zips carry.
const findShapefile = (dir: string): string | null => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '__MACOSX' || entry.name.startsWith('._')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = findShapefile(full);
      if (nested) return nested;
    } else if (entry.name.toLowerCase().endsWith('.shp')) {
      return full;
    }
  }
  return null;
};

// Run mapshaper for one simplify step, returning the GeoJSON string or throwing.
// Points at an extracted .shp so shapefiles nested in a subfolder inside the zip
// convert as reliably as those at the archive root.
const convertOnce = async (shpPath: string, pct: string, precision: string): Promise<string> => {
  const outName = 'out.geojson';
  const cmd = [
    `-i "${shpPath}"`,
    '-quiet',
    '-proj wgs84',
    `-simplify visvalingam ${pct} keep-shapes`,
    '-clean',
    `-o "${outName}" format=geojson precision=${precision}`,
  ].join(' ');
  const output = await mapshaper.applyCommands(cmd, {});
  const geojson = output[outName];
  if (!geojson) throw new Error('mapshaper produced no GeoJSON output (no shapefile in archive?)');
  return typeof geojson === 'string' ? geojson : Buffer.from(geojson).toString('utf8');
};

const validateGeojson = (raw: string): { features: number } => {
  const gj = JSON.parse(raw) as GeoJSON.FeatureCollection;
  if (gj.type !== 'FeatureCollection' || !Array.isArray(gj.features) || gj.features.length === 0) {
    throw new Error('output is not a non-empty FeatureCollection');
  }
  const coord = gj.features.map((f) => firstCoord(f.geometry)).find((c) => c !== null);
  if (!coord) throw new Error('no coordinates found in output');
  if (!isWgs84Coord(coord[0], coord[1])) {
    throw new Error(`coordinates not in WGS84 range (got ${coord[0]}, ${coord[1]})`);
  }
  return { features: gj.features.length };
};

const convertRecord = async (record: DatasetRecord): Promise<Outcome> => {
  const { id, downloadUrl, category } = record;
  if (!downloadUrl) return { id, status: 'skipped', reason: 'no downloadUrl' };

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `shp-${id}-`));
  const zipPath = path.join(tmpDir, 'source.zip');
  const extractDir = path.join(tmpDir, 'extract');
  try {
    await downloadZip(downloadUrl, zipPath);

    fs.mkdirSync(extractDir, { recursive: true });
    try {
      execFileSync('unzip', ['-o', '-qq', zipPath, '-d', extractDir], { stdio: 'ignore' });
    } catch {
      return { id, status: 'skipped', reason: 'could not unzip archive' };
    }
    const shpPath = findShapefile(extractDir);
    if (!shpPath) return { id, status: 'skipped', reason: 'no .shp inside archive (not a shapefile)' };

    let best: { raw: string; bytes: number; features: number; simplify: string } | null = null;
    let lastError = 'unknown';
    for (const step of SIMPLIFY_STEPS) {
      try {
        const raw = await convertOnce(shpPath, step.pct, step.precision);
        const { features } = validateGeojson(raw);
        const bytes = Buffer.byteLength(raw, 'utf8');
        if (bytes <= BUDGET_BYTES) {
          best = { raw, bytes, features, simplify: step.pct };
          break;
        }
        // Remember the smallest attempt in case none fit (for the report).
        lastError = `over budget at ${step.pct} (${bytes} bytes)`;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        // A hard conversion error won't improve at a lower %, so stop early.
        if (!/over budget/.test(lastError)) break;
      }
    }

    if (!best) return { id, status: 'skipped', reason: lastError };

    const slug = slugForCategory(category);
    const outDir = path.join(PUBLIC_DATA_DIR, slug);
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, `${id}.geojson`);
    fs.writeFileSync(outFile, best.raw, 'utf8');

    return {
      id,
      status: 'converted',
      url: `/data/${slug}/${id}.geojson`,
      bytes: best.bytes,
      features: best.features,
      simplify: best.simplify,
    };
  } catch (err) {
    return { id, status: 'skipped', reason: err instanceof Error ? err.message : String(err) };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
};

// Idempotently patch datasets.json: converted → leaflet + geojsonUrl; every
// other Shapefile record is reset to an honest non-previewable state (clearing
// any stale geojsonUrl from a previous run whose source no longer converts).
const patchDatasets = (
  records: DatasetRecord[],
  converted: Map<string, string>,
  processedIds: Set<string>
): number => {
  let changed = 0;
  for (const rec of records) {
    if (rec.format !== 'Shapefile' || !processedIds.has(rec.id)) continue;
    const url = converted.get(rec.id);
    if (url) {
      if (rec.geojsonUrl !== url || rec.viewerType !== 'leaflet') {
        rec.geojsonUrl = url;
        rec.viewerType = 'leaflet';
        changed++;
      }
    } else {
      const hadLocalPreview = typeof rec.geojsonUrl === 'string' && rec.geojsonUrl.startsWith('/data/');
      if (hadLocalPreview || rec.viewerType === 'leaflet') {
        if (hadLocalPreview) delete rec.geojsonUrl;
        if (rec.viewerType === 'leaflet') rec.viewerType = 'none';
        changed++;
      }
    }
  }
  return changed;
};

const main = async () => {
  const records: DatasetRecord[] = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const argIds = process.argv.slice(2).filter((a) => !a.startsWith('-'));

  let candidates = records.filter((r) => r.format === 'Shapefile' && r.downloadUrl);
  if (argIds.length) candidates = candidates.filter((r) => argIds.includes(r.id));

  console.log(`\nShapefile → GeoJSON conversion — ${candidates.length} candidate(s)\n`);

  const outcomes: Outcome[] = [];
  for (const rec of candidates) {
    process.stdout.write(`  ${rec.id} … `);
    const outcome = await convertRecord(rec);
    outcomes.push(outcome);
    if (outcome.status === 'converted') {
      console.log(`ok (${outcome.features} features, ${(outcome.bytes / 1024).toFixed(0)} KB, simplify ${outcome.simplify})`);
    } else {
      console.log(`SKIP — ${outcome.reason}`);
    }
  }

  // Resolve which shapefile records have a file on disk (this run or a prior
  // one), so a subset run doesn't reset previously-converted records.
  const convertedUrls = new Map<string, string>();
  for (const rec of records.filter((r) => r.format === 'Shapefile')) {
    const fromThisRun = outcomes.find((o) => o.id === rec.id && o.status === 'converted');
    if (fromThisRun && fromThisRun.status === 'converted') {
      convertedUrls.set(rec.id, fromThisRun.url);
      continue;
    }
    const slug = slugForCategory(rec.category);
    const file = path.join(PUBLIC_DATA_DIR, slug, `${rec.id}.geojson`);
    if (fs.existsSync(file)) convertedUrls.set(rec.id, `/data/${slug}/${rec.id}.geojson`);
  }

  // Manifest reflects everything on disk (shapefiles + points).
  const manifestCount = rebuildGeojsonManifest(ROOT);

  const processedIds = new Set(candidates.map((c) => c.id));
  const changed = patchDatasets(records, convertedUrls, processedIds);
  if (changed > 0) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(records, null, 2) + '\n', 'utf8');
  }

  const ok = outcomes.filter((o) => o.status === 'converted').length;
  const skipped = outcomes.filter((o) => o.status === 'skipped').length;
  console.log(`\nSummary: ${ok} converted, ${skipped} skipped, ${candidates.length} processed.`);
  console.log(`GeoJSON manifest entries (all on disk): ${manifestCount}`);
  console.log(`datasets.json records changed: ${changed}\n`);
};

main().catch((err) => {
  console.error('Conversion failed:', err);
  process.exit(1);
});
