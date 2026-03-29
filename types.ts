
// Section 5 & 6: Dataset Schema & Metadata Model

export type DataCategory =
  | 'Boundaries'
  | 'Demographics'
  | 'Environment'
  | 'Economy'
  | 'Infrastructure'
  | 'Reference'
  | 'Administrative Boundaries'
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

export interface Dataset {
  id: string;
  title: string;
  description: string;
  category: DataCategory;
  lastUpdated: string;
  format: 'GeoJSON' | 'CSV' | 'Shapefile' | 'API' | 'Mixed' | 'PDF' | 'Spreadsheet' | 'GeoTIFF' | 'Image';
  size: string;
  fileSize?: string;
  source: string; // e.g., "Bureau of Statistics"
  downloadUrl?: string;
  geojsonUrl?: string; // URL for map preview
  imageUrl: string;
  
  viewerType?: 'leaflet' | 'arcgis' | 'none' | 'image' | 'pdf';
  arcGisEmbedUrl?: string;

  // Section 7: Pipeline Fields
  ingestionStatus?: IngestionStatus;
  validationReport?: ValidationReport;
  metadataHash?: string; // For integrity
  
  // Tier 3: Temporal Support
  temporalLayers?: TemporalLayer[];
  
  // New: Visual Configuration
  style?: DatasetStyle;

  // Multi-asset support
  assets?: DatasetAsset[];
  tags?: string[];
}

export interface AnalysisSection {
  id: string;
  type: string;
  title: string;
  body: string;
}

export interface AnalysisMapConfig {
  datasetIds?: string[];
  center?: { lat: number; lng: number };
  zoom?: number;
}

export interface AnalysisChartConfig {
  id: string;
  title: string;
  description?: string;
  type: string;
  note?: string;
}

export interface AnalysisSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  datasetsUsed: string[];
  publishedAt: string;
  updatedAt?: string;
  author?: string;
  level: string;
  status: string;
  mapConfig?: AnalysisMapConfig;
  charts?: AnalysisChartConfig[];
  heroImageUrl?: string;
}

export interface AnalysisEntry extends AnalysisSummary {
  sections: AnalysisSection[];
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
  | 'ANALYSIS' 
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

// MOCK_DATASETS removed. Data is now fetched asynchronously from /data/datasets.json.


