
import { Dataset } from '../types';

export const generateDeveloperDocSnippet = (dataset: Dataset): string => {
  const endpoint = dataset.geojsonUrl || dataset.downloadUrl || 'Check dataset details for URL';
  return `Dataset: ${dataset.title}
ID: ${dataset.id}
Format: ${dataset.format}
Primary Endpoint: ${endpoint}
Usage:
  - JS: fetch('${endpoint}')
  - Python: geopandas.read_file('${endpoint}')
  - CLI: curl -O '${endpoint}'
`;
};
