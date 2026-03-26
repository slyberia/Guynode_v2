import { Dataset } from '../types';
import { GLOBAL_GEOJSON_DB } from '../data/geoJsonData';

export interface ConsistencyIssue {
  datasetId: string;
  severity: 'CRITICAL' | 'WARNING';
  message: string;
}

export const validateCatalogEntry = (dataset: Dataset): ConsistencyIssue[] => {
  const issues: ConsistencyIssue[] = [];
  
  if (!dataset.id) issues.push({ datasetId: 'UNKNOWN', severity: 'CRITICAL', message: 'Missing ID' });
  const validCategories = ['Boundaries', 'Demographics', 'Environment', 'Economy', 'Infrastructure', 'Reference', 'Administrative Boundaries', 'Planning and Development'];
  if (!dataset.category || !validCategories.includes(dataset.category)) {
    issues.push({ datasetId: dataset.id, severity: 'WARNING', message: `Invalid Category: ${dataset.category}` });
  }
  if (!dataset.description) issues.push({ datasetId: dataset.id, severity: 'WARNING', message: 'Missing Description' });
  
  return issues;
};

export const validateViewerCompatibility = (dataset: Dataset): ConsistencyIssue[] => {
  const issues: ConsistencyIssue[] = [];

  // If format is GeoJSON, it must have a geojsonUrl
  if (dataset.format === 'GeoJSON') {
    if (!dataset.geojsonUrl) {
      issues.push({ datasetId: dataset.id, severity: 'CRITICAL', message: 'Format is GeoJSON but no geojsonUrl provided' });
    } else {
      // Check if it exists in the Global DB
      if (!GLOBAL_GEOJSON_DB[dataset.geojsonUrl]) {
        issues.push({ datasetId: dataset.id, severity: 'CRITICAL', message: `GeoJSON path ${dataset.geojsonUrl} not found in GLOBAL_GEOJSON_DB` });
      }
    }
  }

  return issues;
};

export const runFullConsistencyCheck = (datasets: Dataset[]): ConsistencyIssue[] => {
  let allIssues: ConsistencyIssue[] = [];
  datasets.forEach(d => {
    allIssues = [...allIssues, ...validateCatalogEntry(d), ...validateViewerCompatibility(d)];
  });
  return allIssues;
};
