import { Dataset } from '../types';

export interface IntegrityIssue {
  datasetId: string;
  field: string;
  issue: string;
}

export const checkMetadataCompleteness = (d: Dataset): IntegrityIssue[] => {
  const issues: IntegrityIssue[] = [];
  if (!d.source) issues.push({ datasetId: d.id, field: 'source', issue: 'Missing source authority' });
  if (!d.lastUpdated) issues.push({ datasetId: d.id, field: 'lastUpdated', issue: 'Missing date' });
  return issues;
};

export const checkThumbnailPresence = (d: Dataset): IntegrityIssue[] => {
  if (!d.imageUrl) return [{ datasetId: d.id, field: 'imageUrl', issue: 'Missing thumbnail URL' }];
  return [];
};

export const runInternalIntegrityReport = (datasets: Dataset[]): IntegrityIssue[] => {
  let issues: IntegrityIssue[] = [];
  datasets.forEach(d => {
    issues = [...issues, ...checkMetadataCompleteness(d), ...checkThumbnailPresence(d)];
    // Check logical ID formatting
    if (!d.id.match(/^[a-z0-9-_]+$/i)) {
      issues.push({ datasetId: d.id, field: 'id', issue: 'ID contains invalid characters (non-alphanumeric)' });
    }
  });
  return issues;
};
