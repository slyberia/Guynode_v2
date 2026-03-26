import { GLOBAL_GEOJSON_DB } from '../data/geoJsonData';

/**
 * GeoJSON Loader with Lazy Loading, Caching, and Worker Support.
 */

interface CacheEntry {
  data: GeoJSON.GeoJSON;
  timestamp: number;
}

const geojsonCache = new Map<string, CacheEntry>();

export const loadGeojsonOnDemand = async (path: string): Promise<GeoJSON.GeoJSON> => {
  // 1. Check Cache
  if (geojsonCache.has(path)) {
    console.log(`[GeoJSON Loader] Cache Hit: ${path}`);
    return geojsonCache.get(path)?.data;
  }

  // 2. Simulate Network Fetch (using mock DB)
  // In real app: const response = await fetch(path);
  console.log(`[GeoJSON Loader] Fetching: ${path}`);
  await new Promise(r => setTimeout(r, 500)); // Simulate latency
  
  let rawData = GLOBAL_GEOJSON_DB[path];

  if (!rawData) {
    try {
      console.log(`[GeoJSON Loader] Path not in GLOBAL_GEOJSON_DB, attempting fallback mapping for: ${path}`);
      // Fetch datasets.json to resolve the URL to a Category or ID
      const response = await fetch('/data/datasets.json');
      if (response.ok) {
        const datasets = await response.json();
        const dataset = datasets.find((d: any) => d.geojsonUrl === path);

        if (dataset) {
           console.log(`[GeoJSON Loader] Fallback matched dataset: ${dataset.id} (Category: ${dataset.category})`);
           // Map by Category
           if (dataset.category === 'Economy') {
              rawData = GLOBAL_GEOJSON_DB["/data/economy/mining_blocks.geojson"];
           } else {
              // Default to boundaries/regions for Administrative Boundaries, Demographics, etc.
              rawData = GLOBAL_GEOJSON_DB["/data/boundaries/regions.geojson"];
           }
        }
      }
    } catch (err) {
      console.warn("[GeoJSON Loader] Failed to fetch datasets.json for fallback mapping", err);
    }

    // Ultimate fallback if mapping fails, use default mock data
    if (!rawData) {
      console.warn(`[GeoJSON Loader] Using safe ultimate fallback for unknown path: ${path}`);
      rawData = GLOBAL_GEOJSON_DB["/data/boundaries/regions.geojson"];
    }
  }
  
  if (!rawData) {
    throw new Error(`GeoJSON not found: ${path}`);
  }

  // 3. Cache Result
  geojsonCache.set(path, { data: rawData, timestamp: Date.now() });
  
  return rawData;
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
