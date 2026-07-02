// Offline table-preview extractor (Prompt 3B, item 2).
//
// For each CSV / Spreadsheet dataset, fetches the source file from its GCS
// `downloadUrl` server-side (browsers can't: GCS sends no CORS headers), parses
// it with SheetJS, and writes a BOUNDED preview to
// public/data/tables/<id>.preview.json (headers + first N rows + total count).
// Regenerates data/tablePreviewManifest.ts and patches public/data/datasets.json
// (viewerType: 'table' + tablePreviewUrl) for records that actually produced a
// preview. Same offline-artifact discipline as the shapefile pipeline — the
// heavy parser never ships to the client, and CORS is a non-issue.
//
// Run: npm run extract:tables
//      npm run extract:tables -- <id> [<id> ...]   (subset)

import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const ROOT = process.cwd();
const DATA_PATH = path.resolve(ROOT, 'public/data/datasets.json');
const TABLES_DIR = path.resolve(ROOT, 'public/data/tables');
const MANIFEST_PATH = path.resolve(ROOT, 'data/tablePreviewManifest.ts');

// How many data rows to include in a preview (honest "showing N of M").
const PREVIEW_ROW_LIMIT = 100;

interface DatasetRecord {
  id: string;
  format?: string;
  downloadUrl?: string;
  viewerType?: string;
  tablePreviewUrl?: string;
  [key: string]: unknown;
}

interface ManifestEntry {
  columns: number;
  previewRows: number;
  totalRows: number;
  sourceFormat: string;
}

type Cell = string | number | null;

type Outcome =
  | { id: string; status: 'extracted'; url: string; entry: ManifestEntry }
  | { id: string; status: 'skipped'; reason: string };

const normalizeCell = (v: unknown): Cell => {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number' || typeof v === 'string') return v;
  return String(v);
};

// Parse a fetched CSV/XLSX buffer into { columns, rows, totalRows }. Drops
// columns whose header is blank (these source files carry noise/spacer columns),
// unless every header is blank (headerless — then synthesize col1..colN).
const parseTable = (buf: Buffer): { columns: string[]; rows: Cell[][]; totalRows: number } => {
  const wb = XLSX.read(buf, { type: 'buffer', codepage: 1252 });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error('workbook has no sheets');
  const sheet = wb.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false, defval: null });
  if (matrix.length === 0) throw new Error('sheet is empty');

  // Skip leading title/blank rows (a merged title cell reads as a single
  // non-blank value). The header is the first row with >= 2 non-blank cells.
  const nonBlank = (row: unknown[]) =>
    row.filter((c) => c !== null && c !== undefined && String(c).trim() !== '').length;
  let headerIdx = matrix.findIndex((row) => nonBlank(row) >= 2);
  if (headerIdx < 0) headerIdx = 0; // genuinely single-column table

  const headerRow = matrix[headerIdx].map((c) => (c === null || c === undefined ? '' : String(c).trim()));
  const dataRows = matrix.slice(headerIdx + 1);

  let keepIdx = headerRow.map((h, i) => (h !== '' ? i : -1)).filter((i) => i >= 0);
  let columns: string[];
  if (keepIdx.length === 0) {
    // Headerless: keep all columns, synthesize names.
    const width = matrix.reduce((w, r) => Math.max(w, r.length), 0);
    keepIdx = Array.from({ length: width }, (_, i) => i);
    columns = keepIdx.map((i) => `col${i + 1}`);
  } else {
    columns = keepIdx.map((i) => headerRow[i]);
  }

  const rows: Cell[][] = dataRows.map((r) => keepIdx.map((i) => normalizeCell(r[i])));
  return { columns, rows, totalRows: dataRows.length };
};

const extractRecord = async (record: DatasetRecord): Promise<Outcome> => {
  const { id, downloadUrl } = record;
  if (!downloadUrl) return { id, status: 'skipped', reason: 'no downloadUrl' };

  try {
    const res = await fetch(downloadUrl, { redirect: 'follow' });
    if (!res.ok) return { id, status: 'skipped', reason: `HTTP ${res.status}` };
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength === 0) return { id, status: 'skipped', reason: 'empty file' };

    const { columns, rows, totalRows } = parseTable(buf);
    if (columns.length === 0 || totalRows === 0) {
      return { id, status: 'skipped', reason: 'no tabular rows/columns found' };
    }

    const previewRows = Math.min(rows.length, PREVIEW_ROW_LIMIT);
    const sourceFormat = record.format || 'Spreadsheet';
    const preview = {
      columns,
      rows: rows.slice(0, PREVIEW_ROW_LIMIT),
      totalRows,
      previewRows,
      truncated: totalRows > previewRows,
      sourceFormat,
    };

    fs.mkdirSync(TABLES_DIR, { recursive: true });
    fs.writeFileSync(path.join(TABLES_DIR, `${id}.preview.json`), JSON.stringify(preview) + '\n', 'utf8');

    return {
      id,
      status: 'extracted',
      url: `/data/tables/${id}.preview.json`,
      entry: { columns: columns.length, previewRows, totalRows, sourceFormat },
    };
  } catch (err) {
    return { id, status: 'skipped', reason: err instanceof Error ? err.message : String(err) };
  }
};

const writeManifest = (entries: Record<string, ManifestEntry>): void => {
  const keys = Object.keys(entries).sort();
  const body = keys
    .map((k) => `  ${JSON.stringify(k)}: { columns: ${entries[k].columns}, previewRows: ${entries[k].previewRows}, totalRows: ${entries[k].totalRows}, sourceFormat: ${JSON.stringify(entries[k].sourceFormat)} },`)
    .join('\n');
  const ts = `// AUTO-GENERATED by scripts/extract-table-previews.ts — do not edit by hand.
// Lists bounded tabular previews extracted from CSV/XLSX sources. The capability
// check (utils/previewCapability.ts) treats a tablePreviewUrl present here as
// previewable; TableViewer fetches the JSON at runtime.

export interface TablePreviewManifestEntry {
  columns: number;
  previewRows: number;
  totalRows: number;
  sourceFormat: string;
}

export const TABLE_PREVIEW_MANIFEST: Record<string, TablePreviewManifestEntry> = {
${body}
};
`;
  fs.writeFileSync(MANIFEST_PATH, ts, 'utf8');
};

// Idempotently patch datasets.json: extracted → table + tablePreviewUrl; other
// CSV/Spreadsheet records reset to an honest non-previewable state.
const patchDatasets = (
  records: DatasetRecord[],
  extracted: Map<string, string>,
  processedIds: Set<string>
): number => {
  let changed = 0;
  for (const rec of records) {
    if (!processedIds.has(rec.id)) continue;
    const url = extracted.get(rec.id);
    if (url) {
      if (rec.tablePreviewUrl !== url || rec.viewerType !== 'table') {
        rec.tablePreviewUrl = url;
        rec.viewerType = 'table';
        changed++;
      }
    } else {
      const hadPreview = typeof rec.tablePreviewUrl === 'string';
      if (hadPreview || rec.viewerType === 'table') {
        if (hadPreview) delete rec.tablePreviewUrl;
        if (rec.viewerType === 'table') rec.viewerType = 'none';
        changed++;
      }
    }
  }
  return changed;
};

const main = async () => {
  const records: DatasetRecord[] = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const argIds = process.argv.slice(2).filter((a) => !a.startsWith('-'));

  let candidates = records.filter(
    (r) => (r.format === 'CSV' || r.format === 'Spreadsheet') && r.downloadUrl
  );
  if (argIds.length) candidates = candidates.filter((r) => argIds.includes(r.id));

  console.log(`\nTable preview extraction — ${candidates.length} candidate(s)\n`);

  const outcomes: Outcome[] = [];
  for (const rec of candidates) {
    process.stdout.write(`  ${rec.id} … `);
    const outcome = await extractRecord(rec);
    outcomes.push(outcome);
    if (outcome.status === 'extracted') {
      console.log(`ok (${outcome.entry.columns} cols, ${outcome.entry.previewRows}/${outcome.entry.totalRows} rows)`);
    } else {
      console.log(`SKIP — ${outcome.reason}`);
    }
  }

  // Rebuild manifest across ALL table records so a subset run keeps prior entries.
  const manifest: Record<string, ManifestEntry> = {};
  const extractedUrls = new Map<string, string>();
  for (const rec of records.filter((r) => r.format === 'CSV' || r.format === 'Spreadsheet')) {
    const fromRun = outcomes.find((o) => o.id === rec.id && o.status === 'extracted');
    if (fromRun && fromRun.status === 'extracted') {
      manifest[fromRun.url] = fromRun.entry;
      extractedUrls.set(rec.id, fromRun.url);
      continue;
    }
    const url = `/data/tables/${rec.id}.preview.json`;
    const file = path.join(TABLES_DIR, `${rec.id}.preview.json`);
    if (fs.existsSync(file)) {
      const p = JSON.parse(fs.readFileSync(file, 'utf8'));
      manifest[url] = { columns: p.columns.length, previewRows: p.previewRows, totalRows: p.totalRows, sourceFormat: p.sourceFormat };
      extractedUrls.set(rec.id, url);
    }
  }

  writeManifest(manifest);

  const processedIds = new Set(candidates.map((c) => c.id));
  const changed = patchDatasets(records, extractedUrls, processedIds);
  if (changed > 0) fs.writeFileSync(DATA_PATH, JSON.stringify(records, null, 2) + '\n', 'utf8');

  const ok = outcomes.filter((o) => o.status === 'extracted').length;
  const skipped = outcomes.filter((o) => o.status === 'skipped').length;
  console.log(`\nSummary: ${ok} extracted, ${skipped} skipped, ${candidates.length} processed.`);
  console.log(`Manifest entries (total on disk): ${Object.keys(manifest).length}`);
  console.log(`datasets.json records changed: ${changed}`);
  console.log(`Manifest: ${path.relative(ROOT, MANIFEST_PATH)}\n`);
};

main().catch((err) => {
  console.error('Extraction failed:', err);
  process.exit(1);
});
