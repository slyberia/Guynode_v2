// Dataset metadata validation (Prompt 1: Dataset Metadata Contract and Validation).
// Pure, dependency-free logic so it can be reused by the validation script
// (scripts/validate-datasets.ts) and by tests (tests/datasetValidation.test.ts).
//
// Levels:
//   error   — must be fixed; the build script treats these as failures.
//   warning — should be reviewed by a human administrator; non-blocking.
//   info    — advisory only (e.g. placeholder thumbnail in use).
//
// See docs/GUYNODE_PORTAL_IMPLEMENTATION_SEQUENCE.md for terminology.

export type IssueLevel = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  datasetId: string;
  level: IssueLevel;
  rule: string;
  message: string;
}

// Per-file raw size budget for a browser-renderable GeoJSON preview. Shared
// single source of truth: the conversion pipeline (scripts/convert-shapefiles.ts)
// keeps generated files under this, and validation enforces it here.
export const PREVIEW_GEOJSON_MAX_BYTES = 1_500_000;

/**
 * Resolves a local geojsonUrl to proof-of-existence (+ byte size). Injected by
 * the validation runner from the generated manifest / inline DB so this module
 * stays dependency-free. `null` => the URL resolves to nothing (error).
 */
export interface GeojsonResolver {
  maxBytes: number;
  resolve: (url: string) => { bytes?: number } | null;
}

/** Injected resolvers so this module stays dependency-free (see the runner). */
export interface ValidationOptions {
  geojsonResolver?: GeojsonResolver;
  /** Returns true when a table preview URL is present in the generated manifest. */
  tablePreviewResolver?: (url: string) => boolean;
}

// Permissive shape: the JSON may carry legacy + new fields, so validate loosely
// rather than assuming the full Dataset interface is present.
export interface DatasetRecord {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  format?: string;
  size?: string;
  fileSize?: string;
  source?: string;
  sourceUrl?: string;
  authorityLevel?: string;
  caveats?: string[];
  license?: string;
  attribution?: string;
  citationText?: string;
  downloadUrl?: string;
  geojsonUrl?: string;
  viewerType?: string;
  imageUrl?: string;
  lastVerified?: string;
  metadataHash?: string;
  distributions?: Array<{
    label?: string;
    format?: string;
    url?: string;
    previewable?: boolean;
    downloadable?: boolean;
    checksum?: string;
    checksumStatus?: string;
    checksumSource?: string;
    status?: string;
  }>;
  [key: string]: unknown;
}

const PLACEHOLDER_IMAGE = '/images/dataset-placeholder.jpg';
const REQUIRED_FIELDS: Array<keyof DatasetRecord> = [
  'id',
  'title',
  'description',
  'format',
  'source',
];

// Categories / keywords where caveats + authority level matter for safe use.
const CAVEAT_SENSITIVE_KEYWORDS = [
  'boundary',
  'boundaries',
  'amerindian',
  'indigenous',
  'historical',
  'petroleum',
  'oil',
  'coordinate',
  'projection',
  'datum',
];

// Map a file extension to the format label we'd expect.
const EXT_TO_FORMAT: Record<string, string> = {
  pdf: 'PDF',
  zip: 'Shapefile',
  shp: 'Shapefile',
  xlsx: 'Spreadsheet',
  xls: 'Spreadsheet',
  csv: 'CSV',
  tif: 'GeoTIFF',
  tiff: 'GeoTIFF',
  geojson: 'GeoJSON',
  json: 'GeoJSON',
  png: 'Image',
  jpg: 'Image',
  jpeg: 'Image',
  gif: 'Image',
};

const getExtension = (url: string | undefined): string | null => {
  if (!url) return null;
  try {
    const clean = url.split('?')[0].split('#')[0];
    const last = clean.substring(clean.lastIndexOf('/') + 1);
    const dot = last.lastIndexOf('.');
    if (dot < 0) return null;
    return last.substring(dot + 1).toLowerCase();
  } catch {
    return null;
  }
};

const looksLikePlaceholderChecksum = (checksum: string): boolean => {
  const v = checksum.trim().toLowerCase();
  if (!v) return true;
  if (v.includes('placeholder') || v.includes('todo') || v.includes('xxxx')) return true;
  // All-zero or all-same-char hashes are placeholders.
  const hex = v.replace(/^sha256:|^md5:|^sha1:/, '');
  if (/^(.)\1+$/.test(hex)) return true;
  return false;
};

const matchedSensitiveKeywords = (record: DatasetRecord): string[] => {
  const haystack = [
    record.category ?? '',
    record.title ?? '',
    ...(record.tags ?? []),
  ]
    .join(' ')
    .toLowerCase();
  return CAVEAT_SENSITIVE_KEYWORDS.filter((k) => haystack.includes(k));
};

const isCaveatSensitive = (record: DatasetRecord): boolean =>
  matchedSensitiveKeywords(record).length > 0;

const claimsDownloadable = (record: DatasetRecord): boolean => {
  if (record.downloadUrl !== undefined) return true;
  return (record.distributions ?? []).some((d) => d.downloadable === true);
};

const claimsMapPreview = (record: DatasetRecord): boolean => {
  if (record.viewerType === 'leaflet') return true;
  if ((record.format ?? '').toLowerCase() === 'geojson') return true;
  return (record.distributions ?? []).some((d) => d.previewable === true);
};

/**
 * Validate a single dataset record. ID-uniqueness is handled at the collection
 * level (see validateDatasets) because it requires the full set.
 */
export const validateDatasetRecord = (
  record: DatasetRecord,
  options: ValidationOptions = {}
): ValidationIssue[] => {
  const { geojsonResolver, tablePreviewResolver } = options;
  const issues: ValidationIssue[] = [];
  const id = record.id || 'UNKNOWN';
  const add = (level: IssueLevel, rule: string, message: string) =>
    issues.push({ datasetId: id, level, rule, message });

  // Required fields.
  for (const field of REQUIRED_FIELDS) {
    const value = record[field];
    if (value === undefined || value === null || value === '') {
      add('error', 'required-field', `Missing required field: ${String(field)}`);
    }
  }

  // Download claim must be backed by a URL.
  if (claimsDownloadable(record)) {
    const hasTopUrl = typeof record.downloadUrl === 'string' && record.downloadUrl.trim() !== '';
    const hasDistUrl = (record.distributions ?? []).some(
      (d) => d.downloadable === true && typeof d.url === 'string' && d.url.trim() !== ''
    );
    if (!hasTopUrl && !hasDistUrl) {
      add('error', 'download-url-missing', 'Record claims to be downloadable but has no download URL');
    }
  }

  // Map-preview claim must be backed by a geojson/previewable URL.
  if (claimsMapPreview(record)) {
    const hasGeojson = typeof record.geojsonUrl === 'string' && record.geojsonUrl.trim() !== '';
    const hasPreviewDist = (record.distributions ?? []).some(
      (d) => d.previewable === true && typeof d.url === 'string' && d.url.trim() !== ''
    );
    if (!hasGeojson && !hasPreviewDist) {
      add('error', 'preview-url-missing', 'Record claims to be map-previewable but has no geojsonUrl/previewable distribution URL');
    }
  }

  // A leaflet record pointing at a LOCAL geojson file must resolve to a real,
  // budget-compliant file (manifest or inline DB). Guards against a "previewable"
  // record whose file is missing (would fail to load) or too large (would jank).
  if (
    geojsonResolver &&
    record.viewerType === 'leaflet' &&
    typeof record.geojsonUrl === 'string' &&
    record.geojsonUrl.startsWith('/')
  ) {
    const resolved = geojsonResolver.resolve(record.geojsonUrl);
    if (!resolved) {
      add('error', 'preview-url-unresolvable', `leaflet geojsonUrl not found in manifest/inline DB: ${record.geojsonUrl}`);
    } else if (typeof resolved.bytes === 'number' && resolved.bytes > geojsonResolver.maxBytes) {
      add('error', 'preview-oversize', `preview GeoJSON is ${resolved.bytes} bytes, exceeds budget ${geojsonResolver.maxBytes}`);
    }
  }

  // A table record must carry a tablePreviewUrl that resolves to a generated
  // preview (otherwise the "Preview" toggle would render an empty/broken table).
  if (record.viewerType === 'table') {
    const url = typeof record.tablePreviewUrl === 'string' ? record.tablePreviewUrl.trim() : '';
    if (!url) {
      add('error', 'table-preview-missing', 'Record is viewerType "table" but has no tablePreviewUrl');
    } else if (tablePreviewResolver && !tablePreviewResolver(url)) {
      add('error', 'table-preview-unresolvable', `table preview not found in manifest: ${url}`);
    }
  }

  // Format vs file-extension consistency.
  const ext = getExtension(record.downloadUrl) ?? getExtension(record.geojsonUrl);
  const declaredFormat = (record.format ?? '').toLowerCase();
  if (ext && EXT_TO_FORMAT[ext]) {
    const expected = EXT_TO_FORMAT[ext];
    if (declaredFormat && expected.toLowerCase() !== declaredFormat) {
      // Mislabeling a PDF as a shapefile (or vice-versa) is an error, not a warning.
      const pdfShapefileMix =
        (ext === 'pdf' && declaredFormat === 'shapefile') ||
        ((ext === 'zip' || ext === 'shp') && declaredFormat === 'pdf');
      if (pdfShapefileMix) {
        add('error', 'format-mismatch', `Format "${record.format}" contradicts file extension ".${ext}"`);
      } else {
        add('warning', 'format-mismatch', `Format "${record.format}" may not match file extension ".${ext}" (expected "${expected}")`);
      }
    }
  }

  // Placeholder thumbnail (info only).
  if (!record.imageUrl || record.imageUrl === PLACEHOLDER_IMAGE) {
    add('info', 'placeholder-thumbnail', 'Uses placeholder thumbnail image');
  }

  // Provenance / trust warnings.
  if (!record.source) add('warning', 'missing-source', 'Missing source');
  if (!record.license) add('warning', 'missing-license', 'Missing license');
  if (!record.citationText && !record.attribution) {
    add('warning', 'missing-citation', 'Missing citation/attribution');
  }
  if (!record.caveats || record.caveats.length === 0) {
    add('warning', 'missing-caveats', 'No caveats recorded');
  }

  // Verification + checksum warnings.
  if (!record.lastVerified) add('warning', 'missing-last-verified', 'Missing lastVerified');

  // Surface recorded distribution availability (populated by the link checker).
  for (const d of record.distributions ?? []) {
    const s = (d.status ?? '').toLowerCase();
    if (s === 'broken' || s === 'not-found') {
      add('error', 'distribution-broken', `Distribution recorded as ${s}: ${d.url ?? d.label ?? ''}`);
    } else if (s === 'forbidden') {
      add('error', 'distribution-forbidden', `Distribution recorded as forbidden: ${d.url ?? d.label ?? ''}`);
    } else if (s === 'cors-limited') {
      add('warning', 'distribution-cors-limited', `Distribution may be CORS-limited for browser preview: ${d.url ?? d.label ?? ''}`);
    } else if (s === 'unknown') {
      add('warning', 'distribution-unverified', `Distribution availability unverified: ${d.url ?? d.label ?? ''}`);
    }
  }

  // Missing checksum is a warning ONLY when no real checksum AND no checksum
  // status has been recorded (a recorded status means an admin/script already
  // assessed it, e.g. skipped-large-file).
  const checksums: string[] = [];
  if (record.metadataHash) checksums.push(record.metadataHash);
  (record.distributions ?? []).forEach((d) => d.checksum && checksums.push(d.checksum));
  const realChecksum = checksums.find((c) => !looksLikePlaceholderChecksum(c));
  const hasChecksumStatus = (record.distributions ?? []).some(
    (d) => typeof d.checksumStatus === 'string' && d.checksumStatus.trim() !== ''
  );
  if (!realChecksum && !hasChecksumStatus) {
    add('warning', 'missing-checksum', 'Missing or placeholder checksum (not a real trust signal)');
  }

  // Caveat-sensitive categories require caveats + authority level.
  if (isCaveatSensitive(record)) {
    if (!record.caveats || record.caveats.length === 0) {
      add('warning', 'sensitive-missing-caveats', 'Caveat-sensitive dataset has no caveats');
    }
    if (!record.authorityLevel) {
      add('warning', 'sensitive-missing-authority', 'Caveat-sensitive dataset has no authorityLevel');
    }
  }

  return issues;
};

export interface ValidationSummary {
  recordCount: number;
  issues: ValidationIssue[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
}

/**
 * Validate a collection of dataset records, including cross-record checks
 * (currently: unique IDs).
 */
export const validateDatasets = (
  records: DatasetRecord[],
  options: ValidationOptions = {}
): ValidationSummary => {
  const issues: ValidationIssue[] = [];

  // Duplicate ID detection (error).
  const seen = new Map<string, number>();
  for (const record of records) {
    if (!record.id) continue;
    seen.set(record.id, (seen.get(record.id) ?? 0) + 1);
  }
  for (const [id, count] of seen) {
    if (count > 1) {
      issues.push({ datasetId: id, level: 'error', rule: 'duplicate-id', message: `Duplicate id appears ${count} times` });
    }
  }

  for (const record of records) {
    issues.push(...validateDatasetRecord(record, options));
  }

  return {
    recordCount: records.length,
    issues,
    errorCount: issues.filter((i) => i.level === 'error').length,
    warningCount: issues.filter((i) => i.level === 'warning').length,
    infoCount: issues.filter((i) => i.level === 'info').length,
  };
};

// --- Triage classification (Prompt 1 triage pass) ---------------------------
// Two orthogonal dimensions per rule:
//   priority — urgency/impact: High | Medium | Low | Technical
//   track    — how it gets resolved: Automatable | Semi-automatable
//              | Manual / evidence-required
// The "Manual review required" bucket requested in triage == every rule whose
// track is 'Manual / evidence-required'. See
// docs/GUYNODE_PORTAL_IMPLEMENTATION_SEQUENCE.md.

export type WarningPriority = 'High' | 'Medium' | 'Low' | 'Technical';
export type ResolutionTrack =
  | 'Automatable'
  | 'Semi-automatable'
  | 'Manual / evidence-required';

export interface RuleClassification {
  priority: WarningPriority;
  track: ResolutionTrack;
  // Fields a script could populate to clear the rule (when automatable).
  scriptTargets?: string[];
  summary: string;
}

export const RULE_CLASSIFICATION: Record<string, RuleClassification> = {
  // Errors (blocking) — listed for completeness.
  'required-field': { priority: 'High', track: 'Manual / evidence-required', summary: 'Required schema field missing' },
  'duplicate-id': { priority: 'High', track: 'Manual / evidence-required', summary: 'Duplicate dataset id' },
  'download-url-missing': { priority: 'High', track: 'Semi-automatable', summary: 'Claims downloadable but no URL' },
  'preview-url-missing': { priority: 'High', track: 'Semi-automatable', summary: 'Claims previewable but no URL' },
  'preview-url-unresolvable': { priority: 'High', track: 'Automatable', scriptTargets: ['geojsonUrl'], summary: 'leaflet geojsonUrl not in manifest/inline DB (run convert:shapefiles)' },
  'preview-oversize': { priority: 'High', track: 'Automatable', scriptTargets: ['geojsonUrl'], summary: 'Preview GeoJSON exceeds size budget' },
  'table-preview-missing': { priority: 'High', track: 'Automatable', scriptTargets: ['tablePreviewUrl'], summary: 'viewerType table without tablePreviewUrl (run extract:tables)' },
  'table-preview-unresolvable': { priority: 'High', track: 'Automatable', scriptTargets: ['tablePreviewUrl'], summary: 'table preview not in manifest (run extract:tables)' },
  'distribution-broken': { priority: 'High', track: 'Semi-automatable', summary: 'Distribution recorded as broken/not-found' },
  'distribution-forbidden': { priority: 'High', track: 'Semi-automatable', summary: 'Distribution recorded as forbidden' },

  // URL-health-derived warnings (populated by the link checker).
  'distribution-cors-limited': { priority: 'Technical', track: 'Semi-automatable', summary: 'Distribution may be CORS-limited for browser preview' },
  'distribution-unverified': { priority: 'Technical', track: 'Automatable', scriptTargets: ['distributions[].status'], summary: 'Distribution availability unverified' },

  // Warnings / info.
  'format-mismatch': { priority: 'Technical', track: 'Semi-automatable', scriptTargets: ['format'], summary: 'Declared format vs file extension' },
  'placeholder-thumbnail': { priority: 'Low', track: 'Semi-automatable', scriptTargets: ['imageUrl'], summary: 'Uses placeholder thumbnail' },
  'missing-source': { priority: 'High', track: 'Manual / evidence-required', summary: 'No source recorded' },
  'missing-license': { priority: 'High', track: 'Manual / evidence-required', summary: 'No license recorded (legal exposure)' },
  'missing-citation': { priority: 'Medium', track: 'Manual / evidence-required', summary: 'No citation/attribution' },
  'missing-caveats': { priority: 'Medium', track: 'Manual / evidence-required', summary: 'No caveats recorded' },
  'missing-last-verified': { priority: 'Technical', track: 'Automatable', scriptTargets: ['lastVerified'], summary: 'No lastVerified timestamp' },
  'missing-checksum': { priority: 'Technical', track: 'Automatable', scriptTargets: ['distributions[].checksum'], summary: 'No real checksum' },
  'sensitive-missing-caveats': { priority: 'High', track: 'Manual / evidence-required', summary: 'Sensitive dataset lacks caveats' },
  'sensitive-missing-authority': { priority: 'High', track: 'Manual / evidence-required', summary: 'Sensitive dataset lacks authorityLevel' },
};

export const classifyRule = (rule: string): RuleClassification =>
  RULE_CLASSIFICATION[rule] ?? {
    priority: 'Medium',
    track: 'Manual / evidence-required',
    summary: rule,
  };

export interface SensitiveDataset {
  id: string;
  title?: string;
  category?: string;
  matched: string[];
}

/** Datasets matching caveat-sensitive keywords (boundaries, Amerindian, etc.). */
export const getSensitiveDatasets = (records: DatasetRecord[]): SensitiveDataset[] =>
  records
    .map((r) => ({ id: r.id || 'UNKNOWN', title: r.title, category: r.category, matched: matchedSensitiveKeywords(r) }))
    .filter((r) => r.matched.length > 0);
