import test from 'node:test';
import assert from 'node:assert';
import { createCatalogDatasetEntry, buildPublicChangelogSummary } from '../utils/datasetRegistration.js';
import { IngestionStatus, ValidationStatus } from '../types.js';
import { DatasetConfigDraft } from '../utils/datasetIngestion.js';

test('createCatalogDatasetEntry', async (t) => {
  await t.test('creates valid entry for a valid draft with low risk', () => {
    const draft: DatasetConfigDraft = {
      id: 'test-dataset',
      title: 'Test Dataset',
      description: 'A test dataset',
      category: 'Infrastructure',
      updatedAt: '2023-10-27T10:00:00Z',
      format: 'GeoJSON',
      sizeBytes: 1048576, // 1 MB
      source: 'Test Source',
      geojsonPath: '/data/test.geojson',
      valid: true,
      performanceRisk: 'LOW',
      featureCount: 100,
      validationSummary: 'Valid',
      errors: [],
      tags: [],
      createdAt: '2023-10-27T10:00:00Z',
      geometryTypes: ['Polygon'],
    };

    const result = createCatalogDatasetEntry(draft);

    assert.strictEqual(result.id, 'test-dataset');
    assert.strictEqual(result.title, 'Test Dataset');
    assert.strictEqual(result.description, 'A test dataset');
    assert.strictEqual(result.category, 'Infrastructure');
    assert.strictEqual(result.lastUpdated, '2023-10-27');
    assert.strictEqual(result.format, 'GeoJSON');
    assert.strictEqual(result.size, '1 MB');
    assert.strictEqual(result.source, 'Test Source');
    assert.strictEqual(result.geojsonUrl, '/data/test.geojson');
    assert.strictEqual(result.imageUrl, '/images/dataset-placeholder.jpg');
    assert.strictEqual(result.ingestionStatus, IngestionStatus.COMPLETED);
    assert.strictEqual(result.validationReport?.status, ValidationStatus.VERIFIED);
    assert.deepStrictEqual(result.validationReport?.issues, []);
    assert.ok(result.validationReport?.timestamp);
  });

  await t.test('creates valid entry with warning status for high risk', () => {
    const draft: DatasetConfigDraft = {
      id: 'test-dataset-high-risk',
      title: 'High Risk Dataset',
      description: 'A high risk dataset',
      category: 'Environment',
      updatedAt: '2023-10-27T10:00:00Z',
      format: 'GeoJSON',
      sizeBytes: 104857600, // 100 MB
      source: 'Test Source',
      geojsonPath: '/data/test-large.geojson',
      valid: true,
      performanceRisk: 'HIGH',
      featureCount: 50000,
      validationSummary: 'Valid but large',
      errors: [],
      tags: [],
      createdAt: '2023-10-27T10:00:00Z',
      geometryTypes: ['Polygon'],
    };

    const result = createCatalogDatasetEntry(draft);

    assert.strictEqual(result.validationReport?.status, ValidationStatus.WARNING);
  });

  await t.test('creates invalid entry for invalid draft', () => {
    const draft: DatasetConfigDraft = {
      id: 'test-invalid-dataset',
      title: 'Invalid Dataset',
      description: 'An invalid dataset',
      category: 'Environment',
      updatedAt: '2023-10-27T10:00:00Z',
      format: 'GeoJSON',
      sizeBytes: 0,
      source: 'Test Source',
      geojsonPath: '/data/test-invalid.geojson',
      valid: false,
      performanceRisk: 'LOW',
      featureCount: 0,
      validationSummary: 'Invalid',
      errors: ['Missing properties'],
      tags: [],
      createdAt: '2023-10-27T10:00:00Z',
      geometryTypes: ['Polygon'],
    };

    const result = createCatalogDatasetEntry(draft);

    assert.strictEqual(result.ingestionStatus, IngestionStatus.FAILED);
    assert.strictEqual(result.validationReport?.status, ValidationStatus.ERROR);
    assert.deepStrictEqual(result.validationReport?.issues, ['Missing properties']);
  });

  await t.test('prefers externalUrl over geojsonPath if set', () => {
    const draft: DatasetConfigDraft = {
      id: 'test-dataset-external',
      title: 'External Dataset',
      description: 'An external dataset',
      category: 'Infrastructure',
      updatedAt: '2023-10-27T10:00:00Z',
      format: 'GeoJSON',
      sizeBytes: 1024, // 1 KB
      source: 'Test Source',
      geojsonPath: '/data/internal.geojson',
      externalUrl: 'https://example.com/external.geojson',
      valid: true,
      performanceRisk: 'LOW',
      featureCount: 10,
      validationSummary: 'Valid',
      errors: [],
      tags: [],
      createdAt: '2023-10-27T10:00:00Z',
      geometryTypes: ['Polygon'],
    };

    const result = createCatalogDatasetEntry(draft);

    assert.strictEqual(result.geojsonUrl, 'https://example.com/external.geojson');
  });

  await t.test('formats bytes correctly', () => {
    const draft: DatasetConfigDraft = {
      id: 'test-bytes',
      title: 'Bytes Dataset',
      description: 'A bytes dataset',
      category: 'Infrastructure',
      updatedAt: '2023-10-27T10:00:00Z',
      format: 'GeoJSON',
      sizeBytes: 1048576, // 1 MB
      source: 'Test Source',
      geojsonPath: '/data/test.geojson',
      valid: true,
      performanceRisk: 'LOW',
      featureCount: 10,
      validationSummary: 'Valid',
      errors: [],
      tags: [],
      createdAt: '2023-10-27T10:00:00Z',
      geometryTypes: ['Polygon'],
    };

    // Test different byte sizes using the internal function indirectly
    assert.strictEqual(createCatalogDatasetEntry({ ...draft, sizeBytes: 0 }).size, '0 Bytes');
    assert.strictEqual(createCatalogDatasetEntry({ ...draft, sizeBytes: 1024 }).size, '1 KB');
    assert.strictEqual(createCatalogDatasetEntry({ ...draft, sizeBytes: 1048576 }).size, '1 MB');
    assert.strictEqual(createCatalogDatasetEntry({ ...draft, sizeBytes: 1073741824 }).size, '1 GB');
    // Test decimals
    assert.strictEqual(createCatalogDatasetEntry({ ...draft, sizeBytes: 1536 }).size, '1.5 KB');
  });
});

test('buildPublicChangelogSummary', async (t) => {
  await t.test('formats summary string correctly', () => {
    const draft: DatasetConfigDraft = {
      id: 'test-dataset',
      title: 'City Parks',
      description: 'A dataset of city parks',
      category: 'Environment',
      updatedAt: '2023-10-27T10:00:00Z',
      format: 'GeoJSON',
      sizeBytes: 1024,
      source: 'City Data Portal',
      geojsonPath: '/data/parks.geojson',
      valid: true,
      performanceRisk: 'LOW',
      featureCount: 150,
      validationSummary: 'Valid',
      errors: [],
      tags: [],
      createdAt: '2023-10-27T10:00:00Z',
      geometryTypes: ['Polygon'],
    };

    const summary = buildPublicChangelogSummary(draft);

    assert.strictEqual(summary, 'New Data Available: City Parks. This Environment dataset provides 150 features sourced from City Data Portal. It has been validated and optimized for the GIS Viewer.');
  });
});
