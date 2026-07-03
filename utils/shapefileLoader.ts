import shp from 'shpjs';
import type { FeatureCollection } from 'geojson';

/**
 * Loads and parses a Shapefile (.zip) into a GeoJSON FeatureCollection.
 * 
 * @param url The URL of the Shapefile zip to load.
 * @returns A promise that resolves to a GeoJSON FeatureCollection.
 */
export const loadShapefile = async (url: string): Promise<FeatureCollection> => {
  try {
    const geojson = await shp(url);
    
    // shpjs can return an array of FeatureCollections if the zip contains multiple shapefiles.
    // In our context, we merge them or just take the first one. Let's merge them if it's an array.
    if (Array.isArray(geojson)) {
      const merged: FeatureCollection = {
        type: 'FeatureCollection',
        features: geojson.flatMap(collection => collection.features)
      };
      return merged;
    }
    
    return geojson as FeatureCollection;
  } catch (error) {
    console.error('Failed to load or parse shapefile:', error);
    throw error;
  }
};
