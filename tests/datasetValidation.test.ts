import test from 'node:test';
import assert from 'node:assert';
import {
  validateDatasetRecord,
  validateDatasets,
  DatasetRecord,
} from '../utils/datasetValidation.js';

const base: DatasetRecord = {
  id: 'sample',
  title: 'Sample Dataset',
  description: 'A sample dataset',
  category: 'Reference',
  format: 'PDF',
  source: 'Test Source',
  downloadUrl: 'https://example.com/sample.pdf',
  imageUrl: '/images/real-thumb.jpg',
  license: 'CC-BY-4.0',
  citationText: 'Test, 2024',
  caveats: ['Indicative only'],
  lastVerified: '2026-01-01',
  authorityLevel: 'reference-only',
  distributions: [{ label: 'PDF', format: 'PDF', url: 'https://example.com/sample.pdf', checksum: 'sha256:abc123def456' }],
};

const errors = (issues: ReturnType<typeof validateDatasetRecord>) =>
  issues.filter((i) => i.level === 'error');
const hasRule = (issues: ReturnType<typeof validateDatasetRecord>, rule: string) =>
  issues.some((i) => i.rule === rule);

test('dataset validation', async (t) => {
  await t.test('a complete record produces no errors', () => {
    assert.strictEqual(errors(validateDatasetRecord(base)).length, 0);
  });

  await t.test('missing required fields are errors', () => {
    const issues = validateDatasetRecord({ ...base, id: undefined, title: undefined });
    assert.ok(hasRule(issues, 'required-field'));
    assert.ok(errors(issues).length >= 2);
  });

  await t.test('duplicate ids are flagged at the collection level', () => {
    const summary = validateDatasets([base, { ...base }]);
    assert.ok(summary.issues.some((i) => i.rule === 'duplicate-id' && i.level === 'error'));
  });

  await t.test('claimed download without a URL is an error', () => {
    const issues = validateDatasetRecord({
      ...base,
      downloadUrl: undefined,
      distributions: [{ label: 'x', format: 'PDF', url: '', downloadable: true }],
    });
    assert.ok(hasRule(issues, 'download-url-missing'));
  });

  await t.test('claimed map preview without geojsonUrl is an error', () => {
    const issues = validateDatasetRecord({ ...base, viewerType: 'leaflet' });
    assert.ok(hasRule(issues, 'preview-url-missing'));
  });

  await t.test('leaflet record with an unresolvable local geojsonUrl is an error', () => {
    const resolver = { maxBytes: 1_500_000, resolve: () => null };
    const issues = validateDatasetRecord(
      { ...base, format: 'GeoJSON', viewerType: 'leaflet', geojsonUrl: '/data/missing/x.geojson' },
      resolver
    );
    assert.ok(hasRule(issues, 'preview-url-unresolvable'));
  });

  await t.test('leaflet record with an over-budget geojsonUrl is an error', () => {
    const resolver = {
      maxBytes: 1_500_000,
      resolve: (url: string) => (url === '/data/big/x.geojson' ? { bytes: 2_000_000 } : null),
    };
    const issues = validateDatasetRecord(
      { ...base, format: 'GeoJSON', viewerType: 'leaflet', geojsonUrl: '/data/big/x.geojson' },
      resolver
    );
    assert.ok(hasRule(issues, 'preview-oversize'));
  });

  await t.test('leaflet record with a resolvable, in-budget geojsonUrl passes', () => {
    const resolver = {
      maxBytes: 1_500_000,
      resolve: (url: string) => (url === '/data/ok/x.geojson' ? { bytes: 100_000 } : null),
    };
    const issues = validateDatasetRecord(
      { ...base, format: 'GeoJSON', viewerType: 'leaflet', geojsonUrl: '/data/ok/x.geojson' },
      resolver
    );
    assert.strictEqual(hasRule(issues, 'preview-url-unresolvable'), false);
    assert.strictEqual(hasRule(issues, 'preview-oversize'), false);
  });

  await t.test('a PDF mislabeled as Shapefile is an error', () => {
    const issues = validateDatasetRecord({ ...base, format: 'Shapefile' });
    assert.ok(issues.some((i) => i.rule === 'format-mismatch' && i.level === 'error'));
  });

  await t.test('placeholder thumbnail is info, not error', () => {
    const issues = validateDatasetRecord({ ...base, imageUrl: '/images/dataset-placeholder.jpg' });
    assert.ok(issues.some((i) => i.rule === 'placeholder-thumbnail' && i.level === 'info'));
    assert.strictEqual(errors(issues).length, 0);
  });

  await t.test('missing license/caveat/checksum are warnings, not errors', () => {
    const issues = validateDatasetRecord({
      ...base,
      license: undefined,
      caveats: undefined,
      distributions: undefined,
      metadataHash: undefined,
    });
    assert.ok(issues.some((i) => i.rule === 'missing-license' && i.level === 'warning'));
    assert.ok(issues.some((i) => i.rule === 'missing-checksum' && i.level === 'warning'));
    assert.strictEqual(errors(issues).length, 0);
  });

  await t.test('placeholder checksum is treated as missing (warning)', () => {
    const issues = validateDatasetRecord({
      ...base,
      distributions: [{ label: 'PDF', format: 'PDF', url: base.downloadUrl, checksum: 'sha256:00000000' }],
    });
    assert.ok(issues.some((i) => i.rule === 'missing-checksum' && i.level === 'warning'));
  });

  await t.test('boundary dataset without caveats/authority is warned', () => {
    const issues = validateDatasetRecord({
      ...base,
      category: 'Administrative Boundaries',
      caveats: undefined,
      authorityLevel: undefined,
    });
    assert.ok(hasRule(issues, 'sensitive-missing-caveats'));
    assert.ok(hasRule(issues, 'sensitive-missing-authority'));
  });
});
