
import { DataCategory } from '../types';
import { computeGeojsonStats, GeoStats } from './geojsonValidator';
import { getBoundingBox, BoundingBox } from './spatialUtils';

export interface DatasetConfigDraft {
  id: string;
  title: string;
  category: DataCategory;
  description: string;
  source: string;
  tags: string[];
  geojsonPath?: string;
  externalUrl?: string;
  temporalLayers?: { year: string; path: string }[];
  extent?: BoundingBox | null;
  featureCount: number;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
  validationSummary: string;
  performanceRisk: "LOW" | "MEDIUM" | "HIGH";
  geometryTypes: string[];
  valid: boolean;
  errors: string[];
  format: 'GeoJSON' | 'API'; // Simplified for this context
}

export interface MetadataInput {
  title: string;
  category: DataCategory;
  description: string;
  source: string;
  tags: string[];
  isTemporal: boolean;
  license: string;
}

const generateId = (title: string): string => {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

export const ingestDatasetFromGeojsonText = async (rawJson: string, metadata: MetadataInput): Promise<DatasetConfigDraft> => {
  // const start = performance.now();
  
  let geojson: unknown;
  let parseError: string | null = null;

  try {
    geojson = JSON.parse(rawJson);
  } catch (e) {
    parseError = e instanceof Error ? e.message : String(e);
  }

  const now = new Date().toISOString();
  const id = generateId(metadata.title);
  
  // Basic Draft Structure (Partial if parse fails)
  const draft: DatasetConfigDraft = {
    id,
    title: metadata.title,
    category: metadata.category,
    description: metadata.description,
    source: metadata.source,
    tags: metadata.tags,
    createdAt: now,
    updatedAt: now,
    geojsonPath: `/data/${metadata.category.toLowerCase()}/${id}.geojson`, // Suggested path
    format: 'GeoJSON',
    // Stats defaults
    featureCount: 0,
    sizeBytes: new Blob([rawJson]).size,
    performanceRisk: 'HIGH',
    geometryTypes: [],
    valid: false,
    errors: [],
    validationSummary: 'Pending...',
    extent: null
  };

  if (parseError) {
    draft.valid = false;
    draft.errors.push(`JSON Parse Error: ${parseError}`);
    draft.validationSummary = 'CRITICAL: Failed to parse JSON content.';
    return draft;
  }

  // Run Tier 1 Validation
  const geoData = geojson as GeoJSON.FeatureCollection;
  const stats: GeoStats = computeGeojsonStats(geoData);

  // Run Spatial Analysis
  const extent = getBoundingBox(geoData);

  // Update Draft with Insights
  draft.featureCount = stats.featureCount;
  draft.sizeBytes = stats.sizeBytes;
  draft.performanceRisk = stats.performanceRisk;
  draft.geometryTypes = stats.geometryTypes;
  draft.valid = stats.valid;
  draft.errors = stats.errors;
  draft.extent = extent;

  // Generate Summary
  const issues = stats.errors.length;
  if (issues > 0) {
    draft.validationSummary = `FAILED: ${issues} geometry errors found.`;
  } else if (stats.performanceRisk === 'HIGH') {
    draft.validationSummary = `WARNING: Valid geometry but HIGH performance risk (${stats.featureCount} features).`;
  } else {
    draft.validationSummary = `PASSED: Clean geometry, low risk. Ready for catalog.`;
  }

  return draft;
};

export const ingestDatasetFromUrl = async (url: string, metadata: MetadataInput): Promise<DatasetConfigDraft> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }
    const text = await response.text();
    const draft = await ingestDatasetFromGeojsonText(text, metadata);
    draft.externalUrl = url;
    // Overwrite the suggested internal path if we are using an external URL permanently
    // But usually for ingestion we want to mirror it. We'll keep the suggested path in draft.
    return draft;
  } catch (e) {
    // Return a failed draft wrapper
    return {
       id: generateId(metadata.title),
       title: metadata.title,
       category: metadata.category,
       description: metadata.description,
       source: metadata.source,
       tags: metadata.tags,
       createdAt: new Date().toISOString(),
       updatedAt: new Date().toISOString(),
       format: 'API',
       featureCount: 0,
       sizeBytes: 0,
       performanceRisk: 'HIGH',
       geometryTypes: [],
       valid: false,
       errors: [e.message || 'Network request failed'],
       validationSummary: `CRITICAL: URL Fetch failed - ${e.message}`,
       extent: null
    };
  }
};
