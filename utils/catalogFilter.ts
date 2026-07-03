import { Dataset, SearchResult } from '../types';
import { SearchEngine } from '../services/searchEngine';
import { getCatalogFacetCategory, LEGACY_HOMEPAGE_CATEGORY_ORDER } from './legacyCategoryTaxonomy';

/**
 * Pure catalog discovery logic: derive honest facets from the loaded data and
 * apply search + category + tag filters together.
 *
 * House rule (Phase 4): every facet offered to the user is derived from the
 * current catalog, so no chip can ever be a dead filter (0 results). Combining
 * rule: AND across facet types (search ∧ category ∧ tags), OR within the tag
 * facet (tag A OR tag B).
 */

export interface CatalogFilterState {
  searchQuery: string;
  category: string; // 'ALL' or a real category value present in the data
  tags: string[]; // OR-combined; each must be a real tag present in the data
}

export interface Facet {
  value: string;
  count: number;
}

export const EMPTY_FILTER_STATE: CatalogFilterState = {
  searchQuery: '',
  category: 'ALL',
  tags: [],
};

/**
 * Tags that merely restate a record's `format` / `viewerType` (which have their
 * own fields). Excluded from the tag facet so tags add semantic signal instead
 * of duplicating the format column. They remain real tags — a deep-linked
 * `tags=vector` still filters — they're just not surfaced as suggested chips.
 */
/**
 * Curated synonym merges, applied at derivation time so equivalent tags collapse
 * into one facet / one filter without editing the source data. Keys and values
 * are lowercase. Kept deliberately small and unambiguous — only genuine synonyms
 * belong here; specificity variants (census / census 2012, boundary / town
 * boundary, region 1 … region 10) are distinct tags and are NOT merged.
 */
export const TAG_SYNONYMS: Record<string, string> = {
  'regional map': 'region map',
};

/** Normalize a tag to its canonical, lowercased form (applies synonym merges). */
export function canonicalizeTag(tag: string): string {
  const key = tag.trim().toLowerCase();
  return TAG_SYNONYMS[key] || key;
}

export const FORMAT_DUPLICATE_TAGS = new Set([
  'vector',
  'raster',
  'static',
  'png',
  'jpg',
  'jpeg',
  'pdf',
  'csv',
  'xlsx',
  'xls',
  'geotiff',
  'tiff',
  'tif',
  'shapefile',
  'shp',
  'geojson',
  'image',
  'spreadsheet',
]);

/**
 * Category chips derived from the loaded datasets, each with a real count.
 * Sorted by legacy homepage category order. Never returns a category
 * that matches zero records — by construction.
 */
export function deriveCategoryFacets(datasets: Dataset[]): Facet[] {
  const counts = new Map<string, number>();
  for (const d of datasets) {
    const c = getCatalogFacetCategory(d);
    if (!c) continue;
    // Keep resource-only categories out of the catalog unless they have real data
    // (This naturally happens because if they are in the dataset, they get counted)
    counts.set(c, (counts.get(c) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => {
      const idxA = LEGACY_HOMEPAGE_CATEGORY_ORDER.indexOf(a.value as typeof LEGACY_HOMEPAGE_CATEGORY_ORDER[number]);
      const idxB = LEGACY_HOMEPAGE_CATEGORY_ORDER.indexOf(b.value as typeof LEGACY_HOMEPAGE_CATEGORY_ORDER[number]);
      
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      
      return b.count - a.count || a.value.localeCompare(b.value);
    });
}

export interface TagFacetOptions {
  /** Cap the number of surfaced tags (top-N by frequency). */
  limit?: number;
  /** Drop format/viewerType-duplicate tags (default true). */
  excludeFormatDuplicates?: boolean;
  /** Always keep these tags in the result even if beyond `limit` (e.g. active tags). */
  include?: string[];
}

/**
 * Tag chips derived from the loaded datasets. Curated: format-duplicate noise is
 * excluded and (optionally) only the top-N by frequency are surfaced, so the
 * facet adds signal rather than dumping all 62 distinct tags. Every returned tag
 * has a real count and yields >= 1 result.
 */
export function deriveTagFacets(datasets: Dataset[], options: TagFacetOptions = {}): Facet[] {
  const { limit, excludeFormatDuplicates = true, include = [] } = options;
  const includeLower = new Set(include.map((t) => canonicalizeTag(t)));

  const counts = new Map<string, number>();
  for (const d of datasets) {
    // Count each canonical tag at most once per record so synonym merges (and a
    // record that carries both a synonym and its canonical form) don't inflate.
    const seenInRecord = new Set<string>();
    for (const raw of d.tags || []) {
      const canon = canonicalizeTag(raw);
      if (!canon || seenInRecord.has(canon)) continue;
      seenInRecord.add(canon);
      if (excludeFormatDuplicates && FORMAT_DUPLICATE_TAGS.has(canon)) continue;
      counts.set(canon, (counts.get(canon) || 0) + 1);
    }
  }

  const sorted = [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));

  if (typeof limit !== 'number') return sorted;

  const top = sorted.slice(0, limit);
  const present = new Set(top.map((f) => f.value.toLowerCase()));
  // Keep any explicitly-included (active) tags visible even if they fall below the cap.
  for (const f of sorted) {
    if (includeLower.has(f.value.toLowerCase()) && !present.has(f.value.toLowerCase())) {
      top.push(f);
      present.add(f.value.toLowerCase());
    }
  }
  return top;
}

/** Every distinct canonical tag present in the data, for validation/reconciliation. */
export function deriveAllTags(datasets: Dataset[]): Set<string> {
  const all = new Set<string>();
  for (const d of datasets) {
    for (const raw of d.tags || []) {
      const tag = canonicalizeTag(raw);
      if (tag) all.add(tag);
    }
  }
  return all;
}

/**
 * Apply search + category + tag filters in one pure step.
 * AND across facet types; OR within the tag facet.
 */
export function applyCatalogFilters(datasets: Dataset[], state: CatalogFilterState): SearchResult[] {
  let results = SearchEngine.search(datasets, state.searchQuery);

  if (state.category && state.category !== 'ALL') {
    results = results.filter((r) => getCatalogFacetCategory(r.item) === state.category);
  }

  if (state.tags.length > 0) {
    const wanted = new Set(state.tags.map((t) => canonicalizeTag(t)));
    results = results.filter((r) => {
      const itemTags = (r.item.tags || []).map((t) => canonicalizeTag(t));
      return itemTags.some((t) => wanted.has(t)); // OR within tags
    });
  }

  return results;
}

/**
 * Drop filter values the current data can't back: an unknown category resets to
 * 'ALL', unknown tags are removed. This prevents a shared/bookmarked URL with a
 * stale category or tag from showing an empty catalog behind a dead chip.
 */
export function reconcileFilterState(state: CatalogFilterState, datasets: Dataset[]): CatalogFilterState {
  if (datasets.length === 0) return state;

  const categories = new Set(datasets.map((d) => getCatalogFacetCategory(d)));
  const allTags = deriveAllTags(datasets);

  const category = state.category !== 'ALL' && categories.has(state.category) ? state.category : 'ALL';

  // Store canonical tag forms so the URL/filter state stays normalized (a
  // synonym like `regional map` becomes `region map`), and drop tags no dataset
  // carries so a stale bookmark never leaves a dead chip active.
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const t of state.tags) {
    const canon = canonicalizeTag(t);
    if (allTags.has(canon) && !seen.has(canon)) {
      seen.add(canon);
      tags.push(canon);
    }
  }

  return { searchQuery: state.searchQuery, category, tags };
}

/** True when at least one facet is active (used for empty-state / clear affordances). */
export function hasActiveFilters(state: CatalogFilterState): boolean {
  return Boolean(state.searchQuery.trim()) || state.category !== 'ALL' || state.tags.length > 0;
}
