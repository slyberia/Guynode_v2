
import { DatasetConfigDraft } from './datasetIngestion';
import { Dataset, IngestionStatus, ValidationStatus } from '../types';

/**
 * Transforms a raw ingestion draft into a clean Dataset object matching the application schema.
 */
export const createCatalogDatasetEntry = (draft: DatasetConfigDraft): Dataset => {
  return {
    id: draft.id,
    title: draft.title,
    description: draft.description,
    category: draft.category,
    lastUpdated: draft.updatedAt.split('T')[0],
    format: draft.format,
    size: formatBytes(draft.sizeBytes),
    source: draft.source,
    geojsonUrl: draft.externalUrl || draft.geojsonPath, // Prefer external if set, else internal path
    imageUrl: `/images/dataset-placeholder.jpg`, // Placeholder generation
    ingestionStatus: draft.valid ? IngestionStatus.COMPLETED : IngestionStatus.FAILED,
    validationReport: {
      status: draft.valid 
        ? (draft.performanceRisk === 'HIGH' ? ValidationStatus.WARNING : ValidationStatus.VERIFIED)
        : ValidationStatus.ERROR,
      issues: draft.errors,
      timestamp: new Date().toISOString()
    },
    // temporalLayers: draft.temporalLayers // Passed through if present
  };
};

/**
 * Generates the text content for a new Internal Log entry.
 */
export const buildInternalLogDraft = (draft: DatasetConfigDraft): string => {
  // const statusIcon = draft.valid ? '✅' : '❌';
  
  return `
{
  id: "${new Date().toISOString().split('T')[0]}-add-${draft.id}",
  date: "${new Date().toISOString().split('T')[0]}",
  title: "Added Dataset: ${draft.title}",
  summary: "Ingested new ${draft.category} dataset via Admin Console.",
  details: \`
    • Source: ${draft.source}
    • Features: ${draft.featureCount}
    • Risk Level: ${draft.performanceRisk}
    • Validation: ${draft.validationSummary}
    • Extent: ${draft.extent ? JSON.stringify(draft.extent) : 'N/A'}
  \`,
  affectedFiles: ["/data/datasets.ts", "/data/geoJsonData.ts"],
  tags: ["ingestion", "dataset", "${draft.category.toLowerCase()}"],
  riskLevel: "${draft.performanceRisk}",
  version: "1.0.0",
  publicSummary: "Added '${draft.title}' to the ${draft.category} catalog.",
  isPublic: true
}
`.trim();
};

/**
 * Generates a user-friendly summary string for the public changelog.
 */
export const buildPublicChangelogSummary = (draft: DatasetConfigDraft): string => {
  return `New Data Available: ${draft.title}. This ${draft.category} dataset provides ${draft.featureCount} features sourced from ${draft.source}. It has been validated and optimized for the GIS Viewer.`;
};

// Helper
const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
