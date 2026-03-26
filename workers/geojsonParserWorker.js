/**
 * Web Worker: GeoJSON Parsing
 * Offloads heavy JSON parsing and validation from the main UI thread.
 */

self.onmessage = function(e) {
  const { type, payload } = e.data;

  if (type === 'parse') {
    try {
      const start = performance.now();
      
      // 1. Parse JSON
      const geojson = JSON.parse(payload);
      
      // 2. Basic Validation / Stats
      if (!geojson || geojson.type !== 'FeatureCollection') {
        throw new Error('Invalid GeoJSON: Root must be FeatureCollection');
      }

      const featureCount = geojson.features ? geojson.features.length : 0;
      const end = performance.now();

      // 3. Return result
      self.postMessage({
        type: 'result',
        geojson: geojson,
        stats: {
          featureCount,
          parseTime: end - start
        }
      });

    } catch (error) {
      self.postMessage({
        type: 'error',
        message: error.message
      });
    }
  }
};
