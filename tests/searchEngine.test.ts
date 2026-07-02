import test from 'node:test';
import assert from 'node:assert';
import { SearchEngine } from '../services/searchEngine.js';
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

test('SearchEngine matches on tags (previously ignored)', () => {
  const datasets = [
    make({ id: 'tagged', title: 'Alpha', description: 'nothing', source: 'x', tags: ['census'] }),
    make({ id: 'untagged', title: 'Beta', description: 'nothing', source: 'x', tags: ['population'] }),
  ];
  const results = SearchEngine.search(datasets, 'census');
  assert.equal(results.length, 1);
  assert.equal(results[0].item.id, 'tagged');
});

test('SearchEngine: exact tag scores above a partial tag match', () => {
  const exact = make({ id: 'exact', title: 'A', description: 'd', source: 's', tags: ['census'] });
  const partial = make({ id: 'partial', title: 'B', description: 'd', source: 's', tags: ['census-2012'] });
  const results = SearchEngine.search([partial, exact], 'census');
  assert.equal(results[0].item.id, 'exact');
});

test('SearchEngine: tag terms appear in matches[]', () => {
  const datasets = [make({ id: 'a', title: 'A', description: 'd', source: 's', tags: ['georgetown'] })];
  const results = SearchEngine.search(datasets, 'georgetown');
  assert.ok(results[0].matches.includes('georgetown'));
});

test('SearchEngine: id and source still covered', () => {
  const byId = make({ id: 'region-2', title: 'X', description: 'd', source: 's', tags: [] });
  const bySource = make({ id: 'y', title: 'Y', description: 'd', source: 'Bureau of Statistics', tags: [] });
  assert.equal(SearchEngine.search([byId, bySource], 'region-2')[0].item.id, 'region-2');
  assert.equal(SearchEngine.search([byId, bySource], 'bureau')[0].item.id, 'y');
});

test('SearchEngine: empty query returns everything with neutral score', () => {
  const datasets = [make({ id: 'a' }), make({ id: 'b' })];
  const results = SearchEngine.search(datasets, '   ');
  assert.equal(results.length, 2);
});

test('SearchEngine: zero-relevance records filtered out', () => {
  const datasets = [make({ id: 'a', title: 'Roads', description: 'roads', source: 's', tags: ['infra'] })];
  assert.equal(SearchEngine.search(datasets, 'zzzznomatch').length, 0);
});
