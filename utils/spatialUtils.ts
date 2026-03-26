/**
 * Spatial Utilities for Progressive Loading and Performance Optimization
 */

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export const getBoundingBox = (geojson: GeoJSON.FeatureCollection): BoundingBox | null => {
  if (!geojson || !geojson.features) return null;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  const updateBounds = (coords: number[]) => {
    const [lng, lat] = coords;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  };

  const traverseGeometry = (geometry: GeoJSON.Geometry) => {
    if (geometry.type === 'Point') {
      updateBounds(geometry.coordinates);
    } else if (geometry.type === 'LineString' || geometry.type === 'MultiPoint') {
      geometry.coordinates.forEach((c: number[]) => updateBounds(c));
    } else if (geometry.type === 'Polygon' || geometry.type === 'MultiLineString') {
      geometry.coordinates.forEach((ring: number[][]) => ring.forEach((c: number[]) => updateBounds(c)));
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach((poly: number[][][]) => 
        poly.forEach((ring: number[][]) => ring.forEach((c: number[]) => updateBounds(c)))
      );
    }
  };

  geojson.features.forEach((f: GeoJSON.Feature) => {
    if (f.geometry) traverseGeometry(f.geometry);
  });

  if (minLat === Infinity) return null;

  return { minLat, maxLat, minLng, maxLng };
};

export const clipToViewBounds = (geojson: GeoJSON.FeatureCollection, bounds: BoundingBox): GeoJSON.FeatureCollection => {
  if (!geojson || !geojson.features) return geojson;

  const features = geojson.features.filter((f: GeoJSON.Feature) => {
    // Quick BBox check for each feature (simplified)
    // In a real app, we'd cache feature bboxes. Here we calculate on fly or check first coordinate.
    const fBox = getBoundingBox({ type: 'FeatureCollection' as const, features: [f] });
    if (!fBox) return false;

    // Check intersection
    return (
      fBox.minLat <= bounds.maxLat &&
      fBox.maxLat >= bounds.minLat &&
      fBox.minLng <= bounds.maxLng &&
      fBox.maxLng >= bounds.minLng
    );
  });

  return {
    ...geojson,
    features
  };
};

export const simplifyGeometry = (geojson: GeoJSON.FeatureCollection, ): GeoJSON.FeatureCollection => {
  // Placeholder for Visvalingam or Ramer-Douglas-Peucker algorithm
  // For Tier 2 demo, we simply return the geometry as is, 
  // but this function signature allows for future optimization.
  return geojson;
};
