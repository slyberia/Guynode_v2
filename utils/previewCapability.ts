import { Dataset } from '../types';
import { GLOBAL_GEOJSON_DB } from '../data/geoJsonData';
import { GEOJSON_MANIFEST } from '../data/geojsonManifest';
import { TABLE_PREVIEW_MANIFEST } from '../data/tablePreviewManifest';
import { safeUrl } from './url';

/**
 * Capability, not assumption.
 *
 * A record is only "GIS-previewable" if it actually carries something we can
 * render in-browser right now:
 *   - a `geojsonUrl` present in GLOBAL_GEOJSON_DB (small inline demo geometry) or
 *     in GEOJSON_MANIFEST (a real converted file fetched from /public/data), or
 *   - an `arcGisEmbedUrl` (safe http/https), or
 *   - a `viewerType` of `image`/`pdf` with a usable asset (`downloadUrl`).
 *
 * `viewerType: 'none'` records — and shapefiles that could not be converted —
 * are honestly non-previewable. We never fabricate preview data to change that.
 */

/**
 * True only when the record's geojsonUrl resolves to real geometry: either
 * inline demo data (GLOBAL_GEOJSON_DB) or a converted file listed in the
 * manifest (GEOJSON_MANIFEST). The manifest entry proves a file was produced by
 * the conversion pipeline; MapViewer/catalog fetch it at runtime.
 */
export const hasRenderableGeojson = (dataset: Dataset | null | undefined): boolean =>
  Boolean(dataset?.geojsonUrl && (GLOBAL_GEOJSON_DB[dataset.geojsonUrl] || GEOJSON_MANIFEST[dataset.geojsonUrl]));

/** True only when the record carries a safe ArcGIS embed URL. */
export const hasRenderableArcGis = (dataset: Dataset | null | undefined): boolean =>
  Boolean(dataset?.arcGisEmbedUrl && safeUrl(dataset.arcGisEmbedUrl));

/** True only when an image/pdf record carries a safe asset to render. */
export const hasRenderableAsset = (dataset: Dataset | null | undefined): boolean =>
  Boolean(
    dataset &&
    (dataset.viewerType === 'image' || dataset.viewerType === 'pdf') &&
    dataset.downloadUrl &&
    safeUrl(dataset.downloadUrl)
  );

/**
 * True only when a table record has a bounded preview extracted to /data/tables
 * (listed in the manifest). Not a GIS preview — rendered inline as a table.
 */
export const hasTablePreview = (dataset: Dataset | null | undefined): boolean =>
  Boolean(
    dataset &&
    dataset.viewerType === 'table' &&
    dataset.tablePreviewUrl &&
    TABLE_PREVIEW_MANIFEST[dataset.tablePreviewUrl]
  );

/**
 * Valid WGS84 overlay bounds [[south, west],[north, east]]: finite, in range,
 * south < north, west < east, and not the degenerate 0,0 box. Bounds must come
 * from real control points — this only checks numeric sanity, not provenance.
 */
export const isValidGeoBounds = (b: unknown): b is [[number, number], [number, number]] => {
  if (!Array.isArray(b) || b.length !== 2 || !Array.isArray(b[0]) || !Array.isArray(b[1])) return false;
  const [[s, w], [n, e]] = b as number[][];
  if (![s, w, n, e].every((v) => typeof v === 'number' && Number.isFinite(v))) return false;
  if (s < -90 || n > 90 || w < -180 || e > 180) return false;
  if (s >= n || w >= e) return false;
  if (s === 0 && w === 0 && n === 0 && e === 0) return false;
  return true;
};

/**
 * True only when a record carries a real georeference (valid bounds + status) and
 * an image asset to overlay. Records without control-point data stay 'image'; we
 * never derive overlay bounds from a vector bbox.
 */
export const hasRasterOverlay = (dataset: Dataset | null | undefined): boolean =>
  Boolean(
    dataset &&
    dataset.viewerType === 'map-raster' &&
    dataset.georeference &&
    isValidGeoBounds(dataset.georeference.bounds) &&
    dataset.downloadUrl &&
    safeUrl(dataset.downloadUrl)
  );

/**
 * GIS-previewable == can be shown in the interactive map viewer (leaflet vector,
 * CSV points, a georeferenced raster overlay, an ArcGIS embed, or an image/pdf
 * asset the viewer page renders). Tables are NOT GIS-previewable — see
 * isInlinePreviewable.
 */
export const isGisPreviewable = (dataset: Dataset | null | undefined): boolean => {
  if (!dataset || dataset.viewerType === 'none') return false;
  return (
    hasRenderableGeojson(dataset) ||
    hasRenderableArcGis(dataset) ||
    hasRenderableAsset(dataset) ||
    hasRasterOverlay(dataset)
  );
};

/**
 * Anything with an in-catalog inline preview: everything GIS-previewable, plus
 * table records with a bounded preview. Gates the catalog "Preview" toggle.
 */
export const isInlinePreviewable = (dataset: Dataset | null | undefined): boolean =>
  isGisPreviewable(dataset) || hasTablePreview(dataset);
