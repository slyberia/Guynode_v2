/**
 * Utility: Viewer Comparison Logic
 * Handles styling and ID conflict resolution when viewing two _datasets simultaneously.
 */

// Styles for the Comparison Layer (Distinct from Primary)
const COMPARISON_STYLE = {
  color: '#CE1126', // Guyana Red
  weight: 2,
  dashArray: '5, 5',
  fillOpacity: 0.1
};

export const getComparisonStyle = (_Dataset: import('../types').Dataset) => {
  return COMPARISON_STYLE;
};

export const unifyFeatureIds = (primary: GeoJSON.FeatureCollection, comparison: GeoJSON.FeatureCollection) => {
  // In a robust implementation, this would prefix IDs to prevent Leaflet layer collision.
  // For this client-side mock, we rely on separate Layer Groups in MapViewer.
  return { primary, comparison };
};
