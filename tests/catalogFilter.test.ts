import test from 'node:test';
import assert from 'node:assert';
import {
  deriveCategoryFacets,
  deriveTagFacets,
  applyCatalogFilters,
  reconcileFilterState,
  hasActiveFilters,
  FORMAT_DUPLICATE_TAGS,
} from '../utils/catalogFilter.js';
import { Dataset } from '../types.js';

const make = (o: Partial<Dataset>): Dataset =>
  ({
    id: 'id',
    title: 'Title',
    description: 'Description',
    category: 'Reference',
    lastUpdated: '2024',
    format: 'CSV',
    size: '1 KB',
    source: 'Source',
    imageUrl: '',
    ...o,
  }) as Dataset;

const CATALOG: Dataset[] = [
  make({ id: 'a', title: 'Regions', category: 'Administrative Boundaries', tags: ['vector', 'region map', 'ndc'] }),
  make({ id: 'b', title: 'NDCs', category: 'Administrative Boundaries', tags: ['vector', 'ndc'] }),
  make({ id: 'c', title: 'Census 2012', category: 'Demographics', tags: ['census', 'population', 'png'] }),
  make({ id: 'd', title: 'Georgetown Map', category: 'Reference', tags: ['georgetown', 'region map', 'static'] }),
  make({ id: 'e', title: 'Plan', category: 'Planning and Development', tags: ['ndc'] }),
];

test('deriveCategoryFacets: counts match data, sorted by count then name', () => {
  const facets = deriveCategoryFacets(CATALOG);
  assert.deepEqual(facets, [
    { value: 'Administrative Boundaries', count: 2 },
    { value: 'Demographics', count: 1 },
    { value: 'Planning and Development', count: 1 },
    { value: 'Reference', count: 1 },
  ]);
});

test('deriveCategoryFacets: never surfaces a category absent from the data (no dead chips)', () => {
  const values = deriveCategoryFacets(CATALOG).map((f) => f.value);
  for (const dead of ['Boundaries', 'Environment', 'Economy', 'Infrastructure']) {
    assert.ok(!values.includes(dead), `${dead} should not be a chip`);
  }
});

test('deriveTagFacets: excludes format-duplicate tags, counts the rest', () => {
  const facets = deriveTagFacets(CATALOG);
  const map = new Map(facets.map((f) => [f.value, f.count]));
  // format-duplicate noise excluded
  assert.ok(!map.has('vector'));
  assert.ok(!map.has('png'));
  assert.ok(!map.has('static'));
  assert.ok(FORMAT_DUPLICATE_TAGS.has('vector'));
  // real signal kept, with true counts
  assert.equal(map.get('ndc'), 3);
  assert.equal(map.get('region map'), 2);
  assert.equal(map.get('census'), 1);
});

test('deriveTagFacets: limit keeps top-N but always includes active tags', () => {
  const facets = deriveTagFacets(CATALOG, { limit: 1, include: ['census'] });
  const values = facets.map((f) => f.value);
  assert.equal(values[0], 'ndc'); // most frequent
  assert.ok(values.includes('census')); // active tag preserved past the cap
});

test('applyCatalogFilters: category AND search combine (AND across facet types)', () => {
  const results = applyCatalogFilters(CATALOG, {
    searchQuery: '',
    category: 'Administrative Boundaries',
    tags: [],
  });
  assert.deepEqual(results.map((r) => r.item.id).sort(), ['a', 'b']);
});

test('applyCatalogFilters: multiple tags are OR-combined within the facet', () => {
  const results = applyCatalogFilters(CATALOG, {
    searchQuery: '',
    category: 'ALL',
    tags: ['census', 'georgetown'],
  });
  assert.deepEqual(results.map((r) => r.item.id).sort(), ['c', 'd']);
});

test('applyCatalogFilters: tag AND category intersect', () => {
  const results = applyCatalogFilters(CATALOG, {
    searchQuery: '',
    category: 'Planning and Development',
    tags: ['ndc'],
  });
  assert.deepEqual(results.map((r) => r.item.id), ['e']);
});

test('reconcileFilterState: unknown category resets to ALL, unknown tags dropped', () => {
  const cleaned = reconcileFilterState(
    { searchQuery: 'x', category: 'Boundaries', tags: ['ndc', 'not-a-real-tag'] },
    CATALOG
  );
  assert.equal(cleaned.category, 'ALL');
  assert.deepEqual(cleaned.tags, ['ndc']);
  assert.equal(cleaned.searchQuery, 'x');
});

test('reconcileFilterState: keeps valid category/tags untouched', () => {
  const cleaned = reconcileFilterState(
    { searchQuery: '', category: 'Reference', tags: ['region map'] },
    CATALOG
  );
  assert.equal(cleaned.category, 'Reference');
  assert.deepEqual(cleaned.tags, ['region map']);
});

test('hasActiveFilters reflects state', () => {
  assert.equal(hasActiveFilters({ searchQuery: '', category: 'ALL', tags: [] }), false);
  assert.equal(hasActiveFilters({ searchQuery: 'q', category: 'ALL', tags: [] }), true);
  assert.equal(hasActiveFilters({ searchQuery: '', category: 'Reference', tags: [] }), true);
  assert.equal(hasActiveFilters({ searchQuery: '', category: 'ALL', tags: ['ndc'] }), true);
});
