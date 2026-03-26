/**
 * Centralized Mock GeoJSON Database
 * Serves as the Single Source of Truth for MapViewer, Catalog, and Validation tools.
 */

export const GLOBAL_GEOJSON_DB: Record<string, GeoJSON.FeatureCollection> = {
  "/data/boundaries/regions.geojson": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {
          "name": "Region 4 (Demerara-Mahaica)",
          "pop": 313429,
          "density": "High"
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-58.18, 6.82], [-57.95, 6.70], [-57.90, 6.45], 
            [-58.20, 6.40], [-58.25, 6.60], [-58.18, 6.82]
          ]]
        }
      },
      {
         "type": "Feature",
         "properties": {
           "name": "Region 3 (Essequibo Islands)",
           "pop": 107495,
           "density": "Medium"
         },
         "geometry": {
           "type": "Polygon",
           "coordinates": [[
             [-58.55, 6.90], [-58.30, 6.85], [-58.35, 6.50],
             [-58.60, 6.55], [-58.55, 6.90]
           ]]
         }
       }
    ]
  },
  "/data/economy/mining_blocks.geojson": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": { "block_id": "MZ-102", "status": "Active", "mineral": "Gold" },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [-59.5, 6.0], [-59.2, 6.0], [-59.2, 5.8], [-59.5, 5.8], [-59.5, 6.0]
          ]]
        }
      }
    ]
  }
};
