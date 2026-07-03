
// Section 5 & 6: Dataset Schema & Metadata Model

// Categories are DERIVED FROM THE DATA at runtime (see utils/catalogFilter.ts),
// not from a fixed list — a hardcoded union drifts from datasets.json and
// produces dead filter chips. The literals below only document the values
// currently present in public/data/datasets.json; `string` keeps the type
// honest for whatever the data actually contains.
export type DataCategory =
  | 'Reference'
  | 'Administrative Boundaries'
  | 'Demographics'
  | 'Planning and Development'
  | string;

export enum IngestionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum ValidationStatus {
  VERIFIED = 'VERIFIED',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  UNCHECKED = 'UNCHECKED'
}

export interface ValidationReport {
  status: ValidationStatus;
  issues: string[];
  timestamp: string;
}

export interface TemporalLayer {
  year: string;
  path: string; // URL to GeoJSON for this specific year
}

// New: Centralized Styling Contract for Viewer/Catalog consistency
export interface DatasetStyle {
  color?: string;
  weight?: number;
  fillOpacity?: number;
  dashArray?: string;
}

export type AssetType = 'shapefile' | 'geojson' | 'pdf' | 'image' | 'web-map' | 'csv' | 'api';

export interface DatasetAsset {
  id: string;
  type: AssetType;
  label: string;
  originalUrl: string;
  isDownloadable: boolean;
  isViewable: boolean;
  storagePath?: string | null;
}

// --- Metadata Contract (Prompt 1: Dataset Metadata Contract and Validation) ---
// See docs/GUYNODE_PORTAL_IMPLEMENTATION_SEQUENCE.md for terminology.
// All fields below are additive and optional to preserve backward compatibility
// with existing pages that read downloadUrl / geojsonUrl / format / size / viewerType.

// How the source relates to the underlying authority.
export type SourceType =
  | 'official'
  | 'digitized'
  | 'derived'
  | 'external'
  | 'historical'
  | 'unknown';

// How authoritative the record should be treated as.
export type AuthorityLevel =
  | 'official'
  | 'reference-only'
  | 'indicative-only'
  | 'needs-review'
  | 'unknown';

// Verified availability of a record or distribution link.
// Aligned with the URL-health classifications produced by scripts/check-dataset-links.ts.
export type AvailabilityStatus =
  | 'available'
  | 'broken'
  | 'forbidden'
  | 'not-found'
  | 'cors-limited'
  | 'unknown'
  | 'skipped'
  | 'needs-review';

export interface SourceReference {
  label: string;
  url: string;
  relationship:
    | 'primary-source'
    | 'provenance-source'
    | 'reference-source'
    | 'portal-source'
    | 'app-reference'
    | 'tutorial-context'
    | 'commercial-reference'
    | 'needs-review';
  status?: AvailabilityStatus;
  confidence?: 'high' | 'medium' | 'low';
  notes?: string;
}

// A single downloadable/previewable representation of a dataset.
// Prefer this over the legacy top-level downloadUrl/geojsonUrl going forward.
export interface Distribution {
  label: string;
  format: string;
  url: string;
  size?: string;
  contentType?: string;
  previewable?: boolean;
  downloadable?: boolean;
  requiresSoftware?: boolean;
  // Only populate with a REAL file checksum (e.g. "sha256:..." or origin "md5:..."). Never a placeholder.
  checksum?: string;
  // Outcome of attempting to checksum the file (e.g. 'generated', 'verified-via-origin-hash', 'skipped-large-file').
  checksumStatus?: string;
  // Provenance of the checksum: 'self-sha256' | 'origin-md5' | 'origin-crc32c'.
  checksumSource?: string;
  status?: AvailabilityStatus;
  lastVerified?: string;
}

export interface Dataset {
  id: string;
  title: string;
  description: string;
  category: DataCategory;
  legacyHomepageCategory?: string;
  tags: string[];
  lastUpdated: string;
  format: 'GeoJSON' | 'CSV' | 'Shapefile' | 'API' | 'Mixed' | 'PDF' | 'Spreadsheet' | 'GeoTIFF' | 'Image';
  size: string;
  fileSize?: string;
  source: string; // e.g., "Bureau of Statistics"
  downloadUrl?: string;
  geojsonUrl?: string; // URL for map preview
  imageUrl: string;
  
  viewerType?: 'leaflet' | 'arcgis' | 'none' | 'image' | 'pdf' | 'table' | 'map-table' | 'map-raster';
  arcGisEmbedUrl?: string;
  // Local, build-time-extracted tabular preview (see scripts/extract-table-previews.ts).
  // Points at a bounded JSON preview under /data/tables, not the raw CSV/XLSX.
  tablePreviewUrl?: string;
  // Real georeference for overlaying an image on the map (viewerType 'map-raster').
  // bounds MUST come from ground control points / published sheet corners — never
  // from a vector layer's bounding box (that produces confidently-wrong overlays).
  georeference?: Georeference;

  // Section 7: Pipeline Fields
  ingestionStatus?: IngestionStatus;
  validationReport?: ValidationReport;
  // NOTE: legacy integrity placeholder. Do NOT display this as a trust signal.
  // It is not backed by a real file checksum. Real checksums belong on
  // Distribution.checksum and must only be shown when genuinely computed.
  metadataHash?: string;

  // --- Source and trust (additive, optional) ---
  sourceUrl?: string;
  sourceType?: SourceType;
  authorityLevel?: AuthorityLevel;
  lineage?: string;
  caveats?: string[];
  knownLimitations?: string[];
  legalUseWarning?: string;

  // --- Temporal and spatial context (additive, optional) ---
  lastVerified?: string;
  geographicCoverage?: string;
  temporalCoverage?: string;
  spatialReference?: string;

  // --- License and citation (additive, optional) ---
  license?: string;
  attribution?: string;
  citationText?: string;

  // --- File access and distributions (additive, optional) ---
  // Preferred structure for download/preview metadata. Legacy fields above
  // (downloadUrl, geojsonUrl, format, size, viewerType) remain authoritative
  // until consumers migrate to distributions.
  distributions?: Distribution[];
  sourceReferences?: SourceReference[];

  // Tier 3: Temporal Support
  temporalLayers?: TemporalLayer[];
  
  // New: Visual Configuration
  style?: DatasetStyle;

  // Multi-asset support
  assets?: DatasetAsset[];
}

export interface BlogCategory {
  id: string;
  slug: string;
  name: string;
  description?: string;
}

export interface BlogTag {
  id: string;
  slug: string;
  name: string;
}

export interface BlogAuthor {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  publishedDate: string;
  author: BlogAuthor;
  categories: BlogCategory[];
  tags: BlogTag[];
  heroImageUrl?: string;
  readTimeMinutes?: number;
  isFeatured?: boolean;
  isPublished: boolean;
  relatedDatasets?: string[];
  seoMeta?: {
    title: string;
    description: string;
  };
}

export interface BlogArchiveBucket {
  year: number;
  month: number;
  label: string;
  count: number;
  slug: string;
}

// Section 9: Data Preview Types
export interface CsvPreviewRow {
  [key: string]: string | number | boolean | null;
}

export interface GeoJsonPreviewRow {
  id: string | number;
  type: string;
  geometryType?: string;
  properties: Record<string, unknown>;
}

export type PreviewRow = CsvPreviewRow | GeoJsonPreviewRow;

// Section 10: Error States / Edge Cases
export interface AppError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'critical';
  context?: Record<string, unknown>;
}

export type ViewState =
  | 'HOME'
  | 'CATALOG'
  | 'MAP'
  | 'DOCS'
  | 'ATTRIBUTION'
  | 'ABOUT'
  | 'INTERNAL_LOG' 
  | 'CHANGELOG'
  | 'SUPPORT'
  | 'REPORT_ISSUE'
  // Blog Module Routes
  | 'BLOG_INDEX'
  | 'BLOG_POST'
  | 'BLOG_CATEGORY'
  | 'BLOG_ARCHIVE'
  | 'BLOG_SEARCH'
  | 'PRIVACY'
  | 'LOCATOR'
  // Learn Module Routes
  | 'LEARN_INDEX'
  | 'LEARN_POST'

// Section 8: Search Index Model
export interface SearchResult {
  item: Dataset;
  score: number;
  matches: string[];
}

// Real georeference for an image overlay. `bounds` is [[south, west],[north, east]]
// in WGS84, derived from ground control points / published sheet corners — NOT a
// vector bbox. `georeferenceStatus: 'approximate'` is allowed only when the
// approximation is real (e.g. published corners), never a bbox guess.
export interface Georeference {
  bounds: [[number, number], [number, number]];
  georeferenceStatus: 'verified' | 'approximate';
  method: 'gcp' | 'sheet-corners' | 'allmaps';
  source?: string;
  opacityDefault?: number;
}

// Bounded tabular preview extracted offline from a CSV/XLSX source
// (scripts/extract-table-previews.ts). Written to /data/tables/<id>.preview.json
// and rendered by components/viewer/TableViewer.tsx.
export interface TablePreview {
  columns: string[];
  rows: (string | number | null)[][];
  totalRows: number;   // total data rows in the source (excludes header)
  previewRows: number; // number of rows included in `rows`
  truncated: boolean;  // true when totalRows > previewRows
  sourceFormat: string; // 'CSV' | 'Spreadsheet'
}

// MOCK_DATASETS removed. Data is now fetched asynchronously from /data/datasets.json.


