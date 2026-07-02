import test from 'node:test';
import assert from 'node:assert';
import { Dataset } from '../types.js';
import { GLOBAL_GEOJSON_DB } from '../data/geoJsonData.js';
import { GEOJSON_MANIFEST } from '../data/geojsonManifest.js';
import { TABLE_PREVIEW_MANIFEST } from '../data/tablePreviewManifest.js';
import {
  isGisPreviewable,
  isInlinePreviewable,
  hasTablePreview,
  hasRenderableGeojson,
  hasRenderableArcGis,
  hasRenderableAsset,
} from '../utils/previewCapability.js';

// Minimal base record; individual tests set only the fields under test.
const base: Dataset = {
  id: 'fixture',
  title: 'Fixture Dataset',
  description: 'For capability checks',
  category: 'Reference',
  format: 'GeoJSON',
  source: 'Test',
  size: '1 KB',
  lastUpdated: '2026-01-01',
} as unknown as Dataset;

// A key guaranteed to exist in the client-side GeoJSON DB. This is the fixture
// that future-proofs the leaflet path: when a real record carries this URL, the
// viewer wiring is proven to treat it as renderable.
const REAL_GEOJSON_URL = '/data/boundaries/regions.geojson';

test('preview capability', async (t) => {
  await t.test('the leaflet fixture URL is actually present in GLOBAL_GEOJSON_DB', () => {
    assert.ok(GLOBAL_GEOJSON_DB[REAL_GEOJSON_URL], 'fixture GeoJSON must exist in the DB');
  });

  await t.test('a record with real GeoJSON is previewable via the leaflet path', () => {
    const d = { ...base, viewerType: 'leaflet', geojsonUrl: REAL_GEOJSON_URL } as Dataset;
    assert.strictEqual(hasRenderableGeojson(d), true);
    assert.strictEqual(isGisPreviewable(d), true);
  });

  await t.test('a geojsonUrl with no data in the DB is NOT previewable', () => {
    const d = { ...base, viewerType: 'leaflet', geojsonUrl: '/data/does/not/exist.geojson' } as Dataset;
    assert.strictEqual(hasRenderableGeojson(d), false);
    assert.strictEqual(isGisPreviewable(d), false);
  });

  await t.test('a converted record listed in the manifest is previewable (fetched at runtime)', () => {
    const manifestUrls = Object.keys(GEOJSON_MANIFEST);
    assert.ok(manifestUrls.length > 0, 'manifest should list converted files — run npm run convert:shapefiles');
    const d = { ...base, viewerType: 'leaflet', geojsonUrl: manifestUrls[0] } as Dataset;
    assert.strictEqual(hasRenderableGeojson(d), true);
    assert.strictEqual(isGisPreviewable(d), true);
    // Not bundled inline — proves the manifest path (runtime fetch), not GLOBAL_GEOJSON_DB.
    assert.strictEqual(Boolean(GLOBAL_GEOJSON_DB[manifestUrls[0]]), false);
  });

  await t.test('an arcGisEmbedUrl (safe) is previewable', () => {
    const d = { ...base, viewerType: 'arcgis', arcGisEmbedUrl: 'https://example.com/map' } as Dataset;
    assert.strictEqual(hasRenderableArcGis(d), true);
    assert.strictEqual(isGisPreviewable(d), true);
  });

  await t.test('image/pdf with a safe downloadUrl is previewable', () => {
    const img = { ...base, viewerType: 'image', downloadUrl: 'https://example.com/a.png' } as Dataset;
    const pdf = { ...base, viewerType: 'pdf', downloadUrl: 'https://example.com/a.pdf' } as Dataset;
    assert.strictEqual(hasRenderableAsset(img), true);
    assert.strictEqual(hasRenderableAsset(pdf), true);
    assert.strictEqual(isGisPreviewable(img), true);
    assert.strictEqual(isGisPreviewable(pdf), true);
  });

  await t.test('image/pdf without a usable asset is NOT previewable', () => {
    const d = { ...base, viewerType: 'image' } as Dataset;
    assert.strictEqual(isGisPreviewable(d), false);
  });

  await t.test("viewerType 'none' is never previewable, even with a geojsonUrl", () => {
    const d = { ...base, viewerType: 'none', geojsonUrl: REAL_GEOJSON_URL } as Dataset;
    assert.strictEqual(isGisPreviewable(d), false);
  });

  await t.test('a shapefile record (no renderable payload) is NOT previewable', () => {
    const d = { ...base, viewerType: 'none', format: 'Shapefile' } as Dataset;
    assert.strictEqual(isGisPreviewable(d), false);
  });

  await t.test('a table record with a manifest-listed preview is inline-previewable, not GIS', () => {
    const manifestUrls = Object.keys(TABLE_PREVIEW_MANIFEST);
    assert.ok(manifestUrls.length > 0, 'table manifest should list previews — run npm run extract:tables');
    const d = { ...base, viewerType: 'table', tablePreviewUrl: manifestUrls[0] } as Dataset;
    assert.strictEqual(hasTablePreview(d), true);
    assert.strictEqual(isInlinePreviewable(d), true);
    // A table is NOT a GIS preview — the map-viewer button stays disabled.
    assert.strictEqual(isGisPreviewable(d), false);
  });

  await t.test('a table record with an unlisted tablePreviewUrl is not previewable', () => {
    const d = { ...base, viewerType: 'table', tablePreviewUrl: '/data/tables/nope.preview.json' } as Dataset;
    assert.strictEqual(hasTablePreview(d), false);
    assert.strictEqual(isInlinePreviewable(d), false);
  });
});
