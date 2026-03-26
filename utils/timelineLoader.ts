
import { TemporalLayer } from '../types';
import { loadGeojsonOnDemand } from './geojsonLoader';

/**
 * Utility: Timeline Loader
 * Manages loading specific temporal slices of a dataset.
 */

export const getAvailableYears = (layers: TemporalLayer[]): number[] => {
  if (!layers) return [];
  return layers.map(l => parseInt(l.year, 10)).sort((a, b) => a - b);
};

export const clampYear = (year: number, layers: TemporalLayer[]): number => {
  const years = getAvailableYears(layers);
  if (years.length === 0) return year;
  
  // Return closest available year
  return years.reduce((prev, curr) => 
    Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev
  );
};

export const loadTemporalLayer = async (layers: import("../types").TemporalLayer[], year: number): Promise<GeoJSON.GeoJSON> => {
  const target = layers.find(l => parseInt(l.year, 10) === year);
  if (!target) {
     // Fallback to closest or default
     throw new Error(`No layer found for year ${year}`);
  }
  return await loadGeojsonOnDemand(target.path);
};
