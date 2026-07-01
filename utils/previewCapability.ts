import { Dataset } from '../types';
import { GLOBAL_GEOJSON_DB } from '../data/geoJsonData';
import { safeUrl } from './url';

/**
 * Capability, not assumption.
 *
 * A record is only "GIS-previewable" if it actually carries something we can
 * render in-browser right now:
 *   - a `geojsonUrl` whose data is present in GLOBAL_GEOJSON_DB, or
 *   - an `arcGisEmbedUrl` (safe http/https), or
 *   - a `viewerType` of `image`/`pdf` with a usable asset (`downloadUrl`).
 *
 * `viewerType: 'none'` records — and shapefiles awaiting a conversion pipeline —
 * are honestly non-previewable. We never fabricate preview data to change that.
 */

/** True only when the record has real GeoJSON keyed in the client-side DB. */
export const hasRenderableGeojson = (dataset: Dataset | null | undefined): boolean =>
  Boolean(dataset?.geojsonUrl && GLOBAL_GEOJSON_DB[dataset.geojsonUrl]);

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

export const isGisPreviewable = (dataset: Dataset | null | undefined): boolean => {
  if (!dataset || dataset.viewerType === 'none') return false;
  return hasRenderableGeojson(dataset) || hasRenderableArcGis(dataset) || hasRenderableAsset(dataset);
};
