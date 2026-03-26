import { test } from 'node:test';
import assert from 'node:assert';
import { ingestDatasetFromGeojsonText } from '../utils/datasetIngestion';

test('ingestDatasetFromGeojsonText handles malformed JSON correctly', async () => {
  const malformedJson = '{ "type": "FeatureCollection", "features": [ { "type": "Feature", "geometry": { "type": "Point", "coordinates": [0, 0] } }'; // missing closing brackets
  const metadata = {
    title: 'Test Dataset',
    category: 'ENVIRONMENT' as import('../types').DataCategory,
    description: 'A test dataset',
    source: 'Test Source',
    tags: ['test'],
    isTemporal: false,
    license: 'MIT'
  };

  const draft = await ingestDatasetFromGeojsonText(malformedJson, metadata);

  assert.strictEqual(draft.valid, false, 'Draft should be marked as invalid');
  assert.strictEqual(draft.errors.length > 0, true, 'Draft should have errors');
  assert.match(draft.errors[0], /JSON Parse Error/, 'Error should indicate a JSON parse failure');
  assert.match(draft.validationSummary, /CRITICAL: Failed to parse JSON content/, 'Validation summary should be critical');
});

test('ingestDatasetFromGeojsonText handles valid JSON correctly', async () => {
  const validJson = '{ "type": "FeatureCollection", "features": [ { "type": "Feature", "geometry": { "type": "Point", "coordinates": [0, 0] }, "properties": {} } ] }';
  const metadata = {
    title: 'Valid Dataset',
    category: 'INFRASTRUCTURE' as import('../types').DataCategory,
    description: 'A valid dataset',
    source: 'Test Source',
    tags: ['test'],
    isTemporal: false,
    license: 'MIT'
  };

  const draft = await ingestDatasetFromGeojsonText(validJson, metadata);

  assert.strictEqual(draft.valid, true, 'Draft should be marked as valid');
  assert.strictEqual(draft.errors.length, 0, 'Draft should have no errors');
  assert.strictEqual(draft.featureCount, 1, 'Draft should have 1 feature');
});
