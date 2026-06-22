// Real (server-side) dataset link health + checksum runner (Prompt 1.5A).
//
// Usage:
//   npm run check:links                 # HEAD/GET health checks, writes report
//   npm run check:links -- --checksum   # also generate SHA-256 for reachable files
//   npm run check:links -- --limit 5    # only the first N datasets (debugging)
//   npm run check:links -- --write      # ALSO patch datasets.json (opt-in, off by default)
//
// By default this does NOT modify public/data/datasets.json. It writes a
// machine-readable sidecar (docs/dataset-technical-validation.json) that the
// audit generator (scripts/validate-datasets.ts) folds into
// docs/DATASET_METADATA_AUDIT.md. This keeps the catalog data stable and the
// prebuild offline; see docs/GUYNODE_PORTAL_IMPLEMENTATION_SEQUENCE.md.

import fs from 'fs';
import path from 'path';
import {
  checkUrlHealth,
  formatVerificationDate,
  UrlHealthResult,
  UrlHealthStatus,
  DEFAULT_MAX_CHECKSUM_BYTES,
} from '../utils/urlHealth.js';
import { DatasetRecord } from '../utils/datasetValidation.js';

const DATA_PATH = path.resolve(process.cwd(), 'public/data/datasets.json');
const SIDECAR_PATH = path.resolve(process.cwd(), 'docs/dataset-technical-validation.json');

const args = process.argv.slice(2);
const withChecksum = args.includes('--checksum');
const doWrite = args.includes('--write');
const limitArg = args.find((a) => a.startsWith('--limit'));
const limit = limitArg ? Number(limitArg.split('=')[1] ?? args[args.indexOf(limitArg) + 1]) : undefined;
const maxArg = args.find((a) => a.startsWith('--max-checksum-bytes'));
const maxChecksumBytes = maxArg
  ? Number(maxArg.split('=')[1] ?? args[args.indexOf(maxArg) + 1])
  : DEFAULT_MAX_CHECKSUM_BYTES;

type Role = 'download' | 'geojson' | 'image' | 'distribution';
interface RoleResult extends UrlHealthResult {
  datasetId: string;
  role: Role;
}

const records: DatasetRecord[] = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
const targets = (typeof limit === 'number' && !Number.isNaN(limit) ? records.slice(0, limit) : records);

// Local files ('/images/...') are validated against the public/ directory.
const checkLocal = (url: string): UrlHealthResult => {
  const rel = url.replace(/^\//, '');
  const abs = path.resolve(process.cwd(), 'public', rel);
  const exists = fs.existsSync(abs);
  return {
    url,
    status: (exists ? 'available' : 'not-found') as UrlHealthStatus,
    httpStatus: null,
    method: 'none',
    contentLength: exists ? fs.statSync(abs).size : null,
    checkedAt: formatVerificationDate(),
  };
};

const checkOne = async (url: string): Promise<UrlHealthResult> => {
  if (url.startsWith('/')) return checkLocal(url);
  return checkUrlHealth(url, { generateChecksum: withChecksum, maxChecksumBytes });
};

const collect = (record: DatasetRecord): Array<{ role: Role; url: string }> => {
  const out: Array<{ role: Role; url: string }> = [];
  if (record.downloadUrl) out.push({ role: 'download', url: record.downloadUrl });
  if (record.geojsonUrl) out.push({ role: 'geojson', url: record.geojsonUrl });
  (record.distributions ?? []).forEach((d) => d.url && out.push({ role: 'distribution', url: d.url }));
  if (record.imageUrl) out.push({ role: 'image', url: record.imageUrl });
  return out;
};

const run = async () => {
  const results: RoleResult[] = [];
  for (const record of targets) {
    const id = record.id || 'UNKNOWN';
    for (const { role, url } of collect(record)) {
      process.stdout.write(`  checking ${id} (${role}) ... `);
      const res = await checkOne(url);
      console.log(`${res.status}${res.httpStatus ? ` [${res.httpStatus}]` : ''}${res.checksumStatus ? ` checksum:${res.checksumStatus}` : ''}`);
      results.push({ datasetId: id, role, ...res });
    }
  }

  // Only file-bearing URLs count toward user-facing health (exclude local images
  // from the broken/forbidden tallies since they're internal assets, but keep them).
  const fileResults = results.filter((r) => r.role !== 'image');
  const tally = (status: UrlHealthStatus) => fileResults.filter((r) => r.status === status).length;

  const totals = {
    urlsChecked: results.length,
    fileUrlsChecked: fileResults.length,
    available: tally('available'),
    broken: tally('broken'),
    forbidden: tally('forbidden'),
    notFound: tally('not-found'),
    corsLimited: tally('cors-limited'),
    unknown: tally('unknown'),
    skipped: tally('skipped'),
    checksumsGenerated: results.filter((r) => r.checksumStatus === 'generated').length,
    checksumsViaOrigin: results.filter((r) => r.checksumStatus === 'verified-via-origin-hash').length,
    checksumsSkippedLarge: results.filter((r) => r.checksumStatus === 'skipped-large-file').length,
    checksumsUnavailable: results.filter((r) => r.checksumStatus === 'unavailable').length,
  };

  const sidecar = {
    generatedAt: new Date().toISOString(),
    checkedDate: formatVerificationDate(),
    checksumEnabled: withChecksum,
    maxChecksumBytes: DEFAULT_MAX_CHECKSUM_BYTES,
    partial: typeof limit === 'number',
    totals,
    results,
  };
  fs.writeFileSync(SIDECAR_PATH, JSON.stringify(sidecar, null, 2), 'utf8');

  console.log('\nTechnical validation summary');
  console.log(`  URLs checked:        ${totals.urlsChecked} (${totals.fileUrlsChecked} file URLs)`);
  console.log(`  available:           ${totals.available}`);
  console.log(`  broken:              ${totals.broken}`);
  console.log(`  forbidden:           ${totals.forbidden}`);
  console.log(`  not-found:           ${totals.notFound}`);
  console.log(`  cors-limited:        ${totals.corsLimited}`);
  console.log(`  unknown:             ${totals.unknown}`);
  console.log(`  checksums (self sha256): ${totals.checksumsGenerated}`);
  console.log(`  checksums (origin hash): ${totals.checksumsViaOrigin}`);
  console.log(`  checksums skipped:       ${totals.checksumsSkippedLarge} (large) + ${totals.checksumsUnavailable} (unavailable)`);
  console.log(`\nReport written to ${path.relative(process.cwd(), SIDECAR_PATH)}`);
  console.log('Re-run `npm run validate:datasets` to refresh the audit markdown.');

  if (doWrite) {
    applyToDatasets(results);
  } else {
    console.log('\n(datasets.json not modified — pass --write to apply lastVerified/checksum.)');
  }
};

// Opt-in: write technical fields back into datasets.json (additive, non-destructive).
const applyToDatasets = (results: RoleResult[]) => {
  const byId = new Map<string, RoleResult[]>();
  for (const r of results) {
    if (!byId.has(r.datasetId)) byId.set(r.datasetId, []);
    byId.get(r.datasetId)!.push(r);
  }
  let updated = 0;
  for (const record of records) {
    const id = record.id || 'UNKNOWN';
    const rs = byId.get(id) ?? [];
    const download = rs.find((r) => r.role === 'download');
    if (download && download.status === 'available') {
      record.lastVerified = download.checkedAt;
      record.distributions = record.distributions ?? [];
      const existing = record.distributions.find((d) => d.url === download.url);
      const patch = {
        label: 'Download',
        format: record.format,
        url: download.url,
        downloadable: true,
        status: download.status,
        // Either a real checksum (sha256/origin md5) or an honest status marker.
        ...(download.checksum ? { checksum: download.checksum } : {}),
        ...(download.checksumStatus ? { checksumStatus: download.checksumStatus } : {}),
        ...(download.checksumSource ? { checksumSource: download.checksumSource } : {}),
      };
      if (existing) {
        Object.assign(existing, patch);
      } else {
        record.distributions.push(patch);
      }
      updated += 1;
    }
  }
  fs.writeFileSync(DATA_PATH, JSON.stringify(records, null, 2) + '\n', 'utf8');
  console.log(`\n✍️  Applied technical fields to ${updated} record(s) in datasets.json.`);
};

run().catch((err) => {
  console.error('check-dataset-links failed:', err);
  process.exit(1);
});
