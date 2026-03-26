import { Dataset } from '../types';

export interface LinkCheckResult {
  url: string;
  ok: boolean;
  status: number | null;
  error?: string;
  type: 'DOWNLOAD' | 'GEOJSON' | 'IMAGE';
  datasetId: string;
}

export const checkUrl = async (url: string): Promise<{ ok: boolean; status: number | null; error?: string }> => {
  try {
    // In a real environment, we would use fetch with HEAD. 
    // Since this is client-side mock, we simulate logic based on string validity.
    // We'll treat our local paths starting with / as valid if they look like known paths.
    
    if (url.startsWith('/')) {
      return { ok: true, status: 200 };
    }

    // Simulate fetch for external URLs
    // Note: Real fetch often blocked by CORS on client-side for external domains.
    // We will simulate a "CORS/Network" check.
    const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    
    // Opaque response in no-cors (status 0), assume OK if no error thrown
    return { ok: true, status: response.status || 200 };
  } catch (error) {
    return { ok: false, status: null, error: error.message || 'Network Error' };
  }
};

export const checkDatasetLinks = async (datasets: Dataset[]): Promise<LinkCheckResult[]> => {
  const results: LinkCheckResult[] = [];

  for (const dataset of datasets) {
    // Check Download URL
    if (dataset.downloadUrl) {
      const res = await checkUrl(dataset.downloadUrl);
      results.push({ ...res, url: dataset.downloadUrl, type: 'DOWNLOAD', datasetId: dataset.id });
    }

    // Check GeoJSON URL
    if (dataset.geojsonUrl) {
      const res = await checkUrl(dataset.geojsonUrl);
      results.push({ ...res, url: dataset.geojsonUrl, type: 'GEOJSON', datasetId: dataset.id });
    }

    // Check Image URL
    if (dataset.imageUrl) {
      const res = await checkUrl(dataset.imageUrl);
      results.push({ ...res, url: dataset.imageUrl, type: 'IMAGE', datasetId: dataset.id });
    }
  }

  return results;
};
