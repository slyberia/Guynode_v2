# Architectural Decision Records — Guynode

This document records key architectural decisions made during the design
and remediation of Guynode. Each entry follows the ADR format: context,
decision, rationale, and tradeoffs accepted.

---

## Decision: Query-param routing over React Router

**Context:** Guynode is a single-page application hosted on Cloudflare
Pages with no server-side rendering. A routing strategy was needed that
works reliably with static hosting and a `_redirects` SPA fallback.

**Decision:** All navigation is driven by URL query parameters
(`?view=CATALOG`, `?view=MAP`, etc.) resolved through `utils/routing.ts`.
The `ViewState` union in `types.ts` is the single source of truth for all
valid application states.

**Rationale:** React Router requires either a server or hash-based routing
to avoid 404s on direct URL access. Query params work natively with the
Cloudflare Pages `/* /index.html 200` fallback rule. Keeping all routing
logic in a single file (`utils/routing.ts`) makes the navigation model
auditable and testable without a router library.

**Tradeoffs:** Browser back/forward history requires manual management.
Deep linking to nested states (e.g., a specific dataset) requires
composing multiple query params. The ViewState union must be updated
whenever a new view is added.

---

## Decision: Static JSON over a CMS or database

**Context:** Guynode serves curated spatial datasets for Guyana. Content
updates are infrequent and performed by a single maintainer. A data
storage strategy was needed that minimized infrastructure cost and
operational complexity.

**Decision:** All dataset metadata, blog posts, and content are stored as
static JSON files in `public/data/` and `public/blog/`, validated at
build time via Zod schemas in `scripts/validate-content.ts`.

**Rationale:** A CMS or database adds backend infrastructure, auth
complexity, and ongoing cost. Static JSON is version-controlled, free to
host, and validated automatically on every build — content errors are
caught before deployment, not after. The Zod prebuild step provides the
same data integrity guarantees a schema-enforced database would, without
the operational overhead.

**Tradeoffs:** Content updates require a code commit and redeploy.
Real-time or user-generated content is not possible without a backend.
Large datasets (hundreds of entries) would require pagination logic
implemented entirely client-side.

---

## Decision: Leaflet over MapboxGL / Google Maps

**Context:** Guynode requires an interactive map viewer capable of
rendering GeoJSON vector layers and GeoTIFF raster layers. A mapping
library was needed that could handle both formats without API key
dependencies or usage-based billing.

**Decision:** Leaflet (via react-leaflet) is used for all map rendering.
GeoRaster and georaster-layer-for-leaflet handle GeoTIFF raster display.

**Rationale:** Mapbox GL JS and Google Maps both require API keys and
impose usage-based pricing that is inappropriate for a public-access
archive with unpredictable traffic. Leaflet is open source, has no
billing model, and has mature ecosystem support for both GeoJSON
(`L.geoJSON()`) and raster formats (via georaster plugins). react-leaflet
provides a stable React integration layer compatible with React 19.

**Tradeoffs:** Leaflet's 2D rendering model does not support 3D
visualization or vector tile streaming. WebGL-accelerated rendering
available in MapboxGL is not available. The georaster chunk
(georaster-layer-for-leaflet, ~1,186KB uncompressed) is large — mitigated
via dynamic imports so it only loads when a GeoTIFF dataset is opened.

---

## Decision: Custom HTML sanitizer over DOMPurify

**Context:** Blog post content and dataset descriptions are stored as
HTML strings in JSON files. A sanitization strategy was needed to prevent
XSS when rendering this content via `dangerouslySetInnerHTML`.

**Decision:** A custom whitelist-based HTML sanitizer in
`utils/sanitize.ts` is used instead of DOMPurify.

**Rationale:** The content corpus is small, controlled, and authored by a
single maintainer — not user-generated. A whitelist sanitizer covering
the known tag set (headings, paragraphs, lists, links, emphasis) is
sufficient for this threat model and avoids adding a dependency for a
problem that is adequately solved in-house. DOMPurify is the correct
choice for user-generated content at scale; it is not necessary here.

**Tradeoffs:** The custom sanitizer must be manually updated if new HTML
tags are needed in content. It has not been independently audited. If
content authorship is ever opened to external contributors, replacing it
with DOMPurify should be evaluated.

---

## Decision: Dynamic imports for GeoRaster

**Context:** The initial build produced a MapViewer chunk of ~1,800KB,
dominated by the georaster and georaster-layer-for-leaflet packages. This
chunk was loaded eagerly on every map view regardless of whether a
GeoTIFF dataset was actually opened.

**Decision:** GeoRaster packages are loaded via dynamic `import()` inside
the map viewer, triggered only when a GeoTIFF dataset is selected.

**Rationale:** The majority of datasets are GeoJSON vector layers. Loading
a 1,800KB raster processing library for every map view imposed unnecessary
parse and execution cost on users who never open a GeoTIFF. Dynamic
imports reduce the initial MapViewer chunk to ~32KB and defer the raster
library load to the moment it is actually needed.

**Tradeoffs:** First open of a GeoTIFF dataset incurs a network fetch for
the deferred chunk. This is a UX tradeoff (slight delay on first raster
load) accepted in exchange for significantly faster initial map view load.

---

## Decision: Shapefile → GeoJSON conversion pipeline

**Context:** Source datasets are distributed as ESRI Shapefiles. Leaflet
cannot render shapefiles natively — a conversion step was required to make
the data usable in the map viewer.

**Decision:** A Python pipeline using `ogr2ogr` (GDAL) and `gsutil`
converts all shapefiles to GeoJSON and uploads them to Google Cloud
Storage. The resulting URLs are referenced in `datasets.json` via the
`geojsonUrl` field.

**Rationale:** Server-side conversion produces smaller, cleaner GeoJSON
than browser-side parsing and avoids shipping a shapefile parser
(e.g., shpjs) to every client. `ogr2ogr` is the industry-standard tool
for this conversion and handles projection normalization (→ EPSG:4326)
automatically. GCS provides reliable public CDN delivery with CORS
support.

**Tradeoffs:** Adding or updating a dataset requires running the pipeline
manually and redeploying `datasets.json`. The pipeline depends on GDAL
being installed in the build environment.

---

## Decision: Cloudflare Pages over Vercel / Netlify

**Context:** Guynode is a static SPA with no server-side functions. A
hosting platform was needed that could serve the built output reliably
with SPA routing support.

**Decision:** Cloudflare Pages is used for all hosting and deployment.

**Rationale:** Cloudflare Pages is free for static sites with no
function invocations, has no bandwidth caps on the free tier, and
deploys directly from GitHub. The global CDN provides low-latency access
appropriate for an audience in Guyana and the broader Caribbean. The
`_redirects` file convention for SPA fallback is simple and well-documented.

**Tradeoffs:** Cloudflare Pages has less mature support for server-side
rendering and edge functions compared to Vercel. If Guynode ever adds
server-side features, migration would be required.
