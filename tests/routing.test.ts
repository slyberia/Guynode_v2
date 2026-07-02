import test from 'node:test';
import assert from 'node:assert';
import { getViewFromUrl, getUrlForView, RouteParams } from '../utils/routing.js';

// getViewFromUrl defaults pathname to window.location.pathname; pass it
// explicitly so these run under node (no window).
const parse = (search: string) => getViewFromUrl(search, '/');

test('routing round-trip: {q, category, tags} → URL → parsed back equal', () => {
  const params: RouteParams = {
    searchQuery: 'region',
    category: 'Administrative Boundaries',
    tags: ['ndc', 'region map'],
  };
  const url = getUrlForView('CATALOG', params);
  const { view, params: parsed } = parse(url);

  assert.equal(view, 'CATALOG');
  assert.equal(parsed.searchQuery, 'region');
  assert.equal(parsed.category, 'Administrative Boundaries');
  assert.deepEqual(parsed.tags, ['ndc', 'region map']);
});

test('routing: tags omitted from URL when empty', () => {
  const url = getUrlForView('CATALOG', { searchQuery: 'x', tags: [] });
  assert.ok(!url.includes('tags='));
  assert.equal(parse(url).params.tags, undefined);
});

test('routing: tags param de-duplicates and trims on parse', () => {
  const { params } = parse('?view=catalog&tags=ndc%2C%20ndc%2C%20census%2C');
  assert.deepEqual(params.tags, ['ndc', 'census']);
});

test('routing: absent tags param yields undefined', () => {
  const { params } = parse('?view=catalog&q=hi');
  assert.equal(params.tags, undefined);
});
