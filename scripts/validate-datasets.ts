// Dataset metadata validation runner (Prompt 1).
//
// - Loads public/data/datasets.json
// - Runs the shared validation logic (utils/datasetValidation.ts)
// - Prints a grouped, human-actionable report (errors / warnings / info)
// - Writes docs/DATASET_METADATA_AUDIT.md
// - Exits non-zero ONLY when there are errors (warnings/info never break the build)
//
// Run: npm run validate:datasets

import fs from 'fs';
import path from 'path';
import {
  validateDatasets,
  ValidationIssue,
  DatasetRecord,
  classifyRule,
  getSensitiveDatasets,
  WarningPriority,
  ResolutionTrack,
} from '../utils/datasetValidation.js';

const DATA_PATH = path.resolve(process.cwd(), 'public/data/datasets.json');
const AUDIT_PATH = path.resolve(process.cwd(), 'docs/DATASET_METADATA_AUDIT.md');
const PLACEHOLDER_IMAGE = '/images/dataset-placeholder.jpg';

const records: DatasetRecord[] = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
const summary = validateDatasets(records);

const byRule = (rule: string): ValidationIssue[] =>
  summary.issues.filter((i) => i.rule === rule);

const idsWithRule = (rule: string): string[] =>
  [...new Set(byRule(rule).map((i) => i.datasetId))];

// ---- Console output ----
console.log(`\nDataset metadata validation — ${summary.recordCount} records`);
console.log(`  errors:   ${summary.errorCount}`);
console.log(`  warnings: ${summary.warningCount}`);
console.log(`  info:     ${summary.infoCount}\n`);

const printGroup = (level: 'error' | 'warning' | 'info', label: string) => {
  const group = summary.issues.filter((i) => i.level === level);
  if (group.length === 0) return;
  console.log(`${label}:`);
  for (const i of group) {
    console.log(`  [${i.rule}] ${i.datasetId}: ${i.message}`);
  }
  console.log('');
};

printGroup('error', 'ERRORS');
printGroup('warning', 'WARNINGS');
printGroup('info', 'INFO');

// ---- Audit report ----
const now = new Date().toISOString();
const mdList = (ids: string[]): string =>
  ids.length === 0 ? '_none_' : ids.map((id) => `\`${id}\``).join(', ');

const formatMismatch = idsWithRule('format-mismatch');
const missingCaveats = [...new Set([...idsWithRule('missing-caveats'), ...idsWithRule('sensitive-missing-caveats')])];
const placeholderThumbs = idsWithRule('placeholder-thumbnail');
const missingLicense = [...new Set([...idsWithRule('missing-license'), ...idsWithRule('missing-citation')])];
const missingChecksum = idsWithRule('missing-checksum');
const errorRecords = [...new Set(summary.issues.filter((i) => i.level === 'error').map((i) => i.datasetId))];
const previewUnclear = [...new Set([...idsWithRule('preview-url-missing'), ...idsWithRule('download-url-missing')])];

// --- Triage aggregation -----------------------------------------------------
// Only triage warnings (errors are blocking and listed separately).
const warnings = summary.issues.filter((i) => i.level === 'warning');

// Count warnings per rule.
const ruleCounts = new Map<string, number>();
for (const w of warnings) ruleCounts.set(w.rule, (ruleCounts.get(w.rule) ?? 0) + 1);

// Group warning rules by priority and by resolution track.
const priorityBuckets: Record<WarningPriority, string[]> = {
  High: [],
  Medium: [],
  Low: [],
  Technical: [],
};
const trackBuckets: Record<ResolutionTrack, string[]> = {
  Automatable: [],
  'Semi-automatable': [],
  'Manual / evidence-required': [],
};
const priorityWarningTotals: Record<WarningPriority, number> = { High: 0, Medium: 0, Low: 0, Technical: 0 };
const trackWarningTotals: Record<ResolutionTrack, number> = {
  Automatable: 0,
  'Semi-automatable': 0,
  'Manual / evidence-required': 0,
};

for (const [rule, count] of ruleCounts) {
  const c = classifyRule(rule);
  const line = `\`${rule}\` (${count}) — ${c.summary}${c.scriptTargets ? ` → script target: \`${c.scriptTargets.join('`, `')}\`` : ''}`;
  priorityBuckets[c.priority].push(line);
  trackBuckets[c.track].push(line);
  priorityWarningTotals[c.priority] += count;
  trackWarningTotals[c.track] += count;
}

// "Manual review required" == warnings whose track is Manual / evidence-required.
const manualReviewTotal = trackWarningTotals['Manual / evidence-required'];

const renderBucket = (lines: string[]): string =>
  lines.length === 0 ? '_none_' : lines.map((l) => `- ${l}`).join('\n');

// Script-resolvable vs human-review field worklists (goal 3 & 4).
const scriptResolvableFields = [
  '`lastVerified` — set when a live URL check succeeds',
  '`distributions[].checksum` — compute from the fetched file (sha256)',
  '`distributions[].status` / URL health — HEAD/GET each `downloadUrl`',
  '`distributions[].contentType` — read from response headers',
  '`distributions[].size` / `fileSize` — read from `Content-Length`',
  '`format` vs extension — detect mismatches automatically',
];
const humanReviewFields = [
  '`license` — requires confirming the actual licence of each source',
  '`citationText` / `attribution` — requires the canonical citation',
  '`caveats` — requires source/old-site evidence; do not invent',
  '`authorityLevel` — requires judgement about how authoritative the data is',
  '`sourceType` — official / digitized / derived / external / historical',
  '`lineage` — provenance narrative from the source',
  '`legalUseWarning` — legal language for sensitive boundaries',
];

// Sensitive datasets needing priority enrichment (goal 5).
const sensitive = getSensitiveDatasets(records);

const md = `# Dataset Metadata Audit — Admin Worklist

> Generated by \`scripts/validate-datasets.ts\` (\`npm run validate:datasets\`).
> Do not invent missing values. Items are flagged \`needs-review\` for a human
> administrator. See \`docs/GUYNODE_PORTAL_IMPLEMENTATION_SEQUENCE.md\`.

- **Generated:** ${now}
- **Records inspected:** ${summary.recordCount}
- **Errors:** ${summary.errorCount}
- **Warnings:** ${summary.warningCount}
- **Info:** ${summary.infoCount}

> **Reading the warning count:** the ${summary.warningCount} warnings are the
> _expected enrichment backlog_ created by introducing the new metadata contract
> in Prompt 1 — they flag fields that are not populated yet, **not** regressions
> or corrupted data. \`${summary.errorCount}\` errors means no blocking schema
> failures were found.

## How to use this document

Work top-down: clear **errors** first (blocking), then **High** priority
warnings (legal/sensitive), then run the **Automatable** track via a future
script, then schedule **Manual / evidence-required** enrichment. Sensitive
datasets (below) should be enriched first within each bucket.

## Validation errors (blocking)

${summary.errorCount === 0 ? '_No errors._' : summary.issues
    .filter((i) => i.level === 'error')
    .map((i) => `- \`${i.datasetId}\` — [${i.rule}] ${i.message}`)
    .join('\n')}

## Warning triage by priority

Counts are total warning occurrences for each rule.

### High (${priorityWarningTotals.High})
${renderBucket(priorityBuckets.High)}

### Medium (${priorityWarningTotals.Medium})
${renderBucket(priorityBuckets.Medium)}

### Low (${priorityWarningTotals.Low})
${renderBucket(priorityBuckets.Low)}

### Technical (${priorityWarningTotals.Technical})
${renderBucket(priorityBuckets.Technical)}

## Warning triage by resolution track

### Automatable (${trackWarningTotals.Automatable})
Can be cleared by a future script with no human judgement.
${renderBucket(trackBuckets.Automatable)}

### Semi-automatable (${trackWarningTotals['Semi-automatable']})
A script can detect/prepare these, but a human confirms the fix.
${renderBucket(trackBuckets['Semi-automatable'])}

### Manual / evidence-required (${manualReviewTotal})
Require human or source review — **do not invent values**.
${renderBucket(trackBuckets['Manual / evidence-required'])}

## Script-resolvable fields (target for a future enrichment script)

${scriptResolvableFields.map((f) => `- ${f}`).join('\n')}

## Human / source-review fields (manual enrichment, evidence required)

${humanReviewFields.map((f) => `- ${f}`).join('\n')}

## Sensitive datasets — priority metadata enrichment (${sensitive.length})

These match caveat-sensitive categories (boundaries, Amerindian/Indigenous
areas, historical maps, petroleum, coordinate systems, legal/planning
boundaries) and should receive caveats, \`authorityLevel\`, \`sourceType\`, and
\`legalUseWarning\` **first**.

${sensitive.length === 0 ? '_none_' : sensitive
    .map((s) => `- \`${s.id}\` — ${s.category ?? 'Uncategorized'} — matched: ${s.matched.join(', ')}`)
    .join('\n')}

## Record-level worklists

### Records with errors (\`needs-review\`)
${mdList(errorRecords)}

### Records with possible format mismatch
${mdList(formatMismatch)}

### Records with missing caveats
${mdList(missingCaveats)}

### Records with placeholder thumbnails
${mdList(placeholderThumbs)}

### Records with missing license / citation
${mdList(missingLicense)}

### Records with missing or placeholder checksum
${mdList(missingChecksum)}

### Records with unclear preview / download status
${previewUnclear.length === 0
    ? '_No records claim preview/download without a backing URL._'
    : mdList(previewUnclear)}

## Notes

- A "placeholder thumbnail" means the record still uses \`${PLACEHOLDER_IMAGE}\`.
- A missing/placeholder checksum is **not** a real trust signal and must not be
  displayed as one. Real checksums belong on \`Distribution.checksum\`.
- **Live URL health/CORS is not yet verified.** \`utils/linkChecker.ts\` is a
  client-side mock (\`no-cors\`, assumes local paths OK); no script performs real
  HEAD/GET checks against the remote GCS URLs, and no checksum generation exists
  yet. Both are needed before download UX can be trusted.
- All values above are derived from current repo content only. Fields that could
  not be confirmed are intentionally left unset and surfaced here as warnings.
`;

fs.writeFileSync(AUDIT_PATH, md, 'utf8');
console.log(`Audit report written to ${path.relative(process.cwd(), AUDIT_PATH)}`);

if (summary.errorCount > 0) {
  console.error(`\n❌ Dataset validation failed with ${summary.errorCount} error(s).`);
  process.exit(1);
}
console.log('\n✅ Dataset validation passed (no errors).');
