import { GLOBAL_GEOJSON_DB } from '../data/geoJsonData';

export interface GeoStats {
  featureCount: number;
  sizeBytes: number;
  geometryTypes: string[];
  performanceRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  valid: boolean;
  errors: string[];
}

export const loadGeoJSON = async (path: string): Promise<GeoJSON.GeoJSON> => {
  // In a real app, fetch(path). Here, use centralized mock DB.
  return GLOBAL_GEOJSON_DB[path] || null;
};

export const validateGeometry = (geojson: GeoJSON.FeatureCollection): string[] => {
  const errors: string[] = [];
  if (!geojson || geojson.type !== 'FeatureCollection') {
    errors.push('Invalid GeoJSON: Not a FeatureCollection');
    return errors;
  }
  
  if (!Array.isArray(geojson.features)) {
    errors.push('Invalid GeoJSON: Missing features array');
    return errors;
  }

  geojson.features.forEach((f: GeoJSON.Feature, i: number) => {
    if (!f.geometry || !('coordinates' in f.geometry) || f.geometry.coordinates.length === 0) {
      errors.push(`Feature [${i}] has empty or missing geometry`);
    }
  });

  return errors;
};

export const computeGeojsonStats = (geojson: GeoJSON.FeatureCollection): GeoStats => {
  const errors = validateGeometry(geojson);
  if (errors.length > 0) {
    return { featureCount: 0, sizeBytes: 0, geometryTypes: [], performanceRisk: 'HIGH', valid: false, errors };
  }

  const featureCount = geojson.features.length;
  const sizeBytes = JSON.stringify(geojson).length;

  const types = new Set<string>();
  for (let i = 0; i < featureCount; i++) {
    types.add(geojson.features[i].geometry.type);
  }

  let performanceRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (sizeBytes > 5 * 1024 * 1024) performanceRisk = 'MEDIUM'; // 5MB
  if (sizeBytes > 15 * 1024 * 1024) performanceRisk = 'HIGH'; // 15MB
  if (featureCount > 5000) performanceRisk = 'HIGH';

  return {
    featureCount,
    sizeBytes,
    geometryTypes: Array.from(types) as string[],
    performanceRisk,
    valid: true,
    errors: []
  };
};
