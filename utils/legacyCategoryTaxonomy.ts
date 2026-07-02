import { Dataset } from '../types';

export const LEGACY_HOMEPAGE_CATEGORY_ORDER = [
  'Administrative Boundaries',
  'DEMs, Imagery & Topo Maps',
  'Coordinate Systems',
  'Infrastructure',
  'Environmental Layers',
  'Petroleum Layers',
  'Socio-Economic Layers',
  'Place Finders',
  'Place-Based Geocoding',
  'GIS Resources',
  'Developer Corner / API',
  'Global Map Services',
] as const;

export const CATALOG_LEGACY_CATEGORIES = [
  'Administrative Boundaries',
  'DEMs, Imagery & Topo Maps',
  'Coordinate Systems',
  'Infrastructure',
  'Environmental Layers',
  'Petroleum Layers',
  'Socio-Economic Layers',
  'Place Finders',
] as const;

export function getCatalogFacetCategory(dataset: Dataset): string {
  return dataset.legacyHomepageCategory || dataset.category;
}
