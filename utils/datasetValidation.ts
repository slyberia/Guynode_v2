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

const isCaveatSensitive = (record: DatasetRecord): boolean => {
  const haystack = [
    record.category ?? '',
    record.title ?? '',
    ...(record.tags ?? []),
  ]
    .join(' ')
    .toLowerCase();
  return CAVEAT_SENSITIVE_KEYWORDS.some((k) => haystack.includes(k));
};

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
export const validateDatasetRecord = (record: DatasetRecord): ValidationIssue[] => {
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

  const checksums: string[] = [];
  if (record.metadataHash) checksums.push(record.metadataHash);
  (record.distributions ?? []).forEach((d) => d.checksum && checksums.push(d.checksum));
  const realChecksum = checksums.find((c) => !looksLikePlaceholderChecksum(c));
  if (!realChecksum) {
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
export const validateDatasets = (records: DatasetRecord[]): ValidationSummary => {
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
    issues.push(...validateDatasetRecord(record));
  }

  return {
    recordCount: records.length,
    issues,
    errorCount: issues.filter((i) => i.level === 'error').length,
    warningCount: issues.filter((i) => i.level === 'warning').length,
    infoCount: issues.filter((i) => i.level === 'info').length,
  };
};
