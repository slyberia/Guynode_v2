import { GLOBAL_GEOJSON_DB } from '../data/geoJsonData';
import { safeUrl } from './url';

/**
 * GeoJSON Loader with Lazy Loading, Caching, and Worker Support.
 *
 * Resolution order (honest — no fabricated fallback):
 *   1. in-memory cache
 *   2. GLOBAL_GEOJSON_DB (small inline demo geometry, bundled)
 *   3. real network fetch of the file at `path` (converted files under
 *      /public/data, served at that path)
 * A path that resolves to nothing throws, so the caller (wrapped in
 * ViewerErrorBoundary) shows an honest error instead of the wrong dataset.
 */

interface CacheEntry {
  data: GeoJSON.GeoJSON;
  timestamp: number;
}

const geojsonCache = new Map<string, CacheEntry>();

export const loadGeojsonOnDemand = async (path: string): Promise<GeoJSON.GeoJSON> => {
  // 1. Check Cache
  const cached = geojsonCache.get(path);
  if (cached) return cached.data;

  // 2. Inline demo geometry takes precedence (small, bundled).
  const inline = GLOBAL_GEOJSON_DB[path];
  if (inline) {
    geojsonCache.set(path, { data: inline, timestamp: Date.now() });
    return inline;
  }

  // 3. Fetch the real converted file. safeUrl allows local /data paths.
  const url = safeUrl(path);
  if (!url) throw new Error(`Refusing to fetch unsafe GeoJSON path: ${path}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch GeoJSON (${response.status}): ${path}`);
  }
  const data = (await response.json()) as GeoJSON.GeoJSON;

  geojsonCache.set(path, { data, timestamp: Date.now() });
  return data;
};

// Worker Factory Helper (to deal with build environments)
// In a real setup, we'd use 'new Worker("/workers/...")'
const createWorker = () => {
  const workerCode = `
    self.onmessage = function(e) {
      const { type, payload } = e.data;
      if (type === 'parse') {
        try {
          const geojson = JSON.parse(payload);
          const featureCount = geojson.features ? geojson.features.length : 0;
          self.postMessage({ type: 'result', geojson, stats: { featureCount } });
        } catch (err) {
          self.postMessage({ type: 'error', message: err.message });
        }
      }
    };
  `;
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
};

export const loadWithWorker = async (path: string): Promise<GeoJSON.GeoJSON> => {
  console.log(`[GeoJSON Loader] Worker Init: ${path}`);
  
  // 1. Get Raw String (Simulated)
  const rawObj = await loadGeojsonOnDemand(path); 
  const rawString = JSON.stringify(rawObj); // Simulate fetching raw text

  return new Promise((resolve, reject) => {
    const worker = createWorker();
    
    worker.onmessage = (e) => {
      const { type, geojson, message } = e.data;
      if (type === 'result') {
        resolve(geojson);
        worker.terminate();
      } else if (type === 'error') {
        reject(new Error(message));
        worker.terminate();
      }
    };

    worker.postMessage({ type: 'parse', payload: rawString });
  });
};
