# Guynode

**A spatial data archive for Guyana.**  
Built by Kyle Semple — [HPS Geospatial](https://hpsgeospatial.com)  


---

## Overview

Guynode is the first open spatial data archive purpose-built for Guyana
— a hub for high-quality geographic datasets built for students,
researchers, public agencies, businesses, and curious citizens who need
reliable maps and data they can reuse with attribution.

Guyana's spatial data has historically been fragmented across government
portals, academic repositories, and legacy GIS systems with inconsistent
formats, incomplete metadata, and no unified access point. Guynode
addresses this directly: every dataset is standardized, attributed to
its source organization, validated against a schema at build time, and
made available for download in its original format. Where possible,
datasets are also previewable inline — as vector map layers, raster
overlays, image maps, or PDFs — without requiring GIS software.

The application is a fully static SPA. There is no backend, no
authentication layer, no database, and no runtime server. Everything
the user sees is derived from static JSON files, served from Cloudflare
Pages, and rendered entirely in the browser. This is a deliberate
architectural choice — it minimizes operational cost and attack surface
while keeping the data itself version-controlled and auditable.

---

## Architecture

| Concern | Approach |
|---|---|
| Routing | Query-param SPA (`?view=CATALOG`, `?view=MAP`, etc.) — no React Router |
| Data | Static JSON in `public/data/` — Zod-validated at build time |
| Hosting | Cloudflare Pages — SPA fallback via `public/_redirects` |
| Maps | Leaflet via react-leaflet — open source, no API key required |
| Raster | georaster + georaster-layer-for-leaflet — dynamically imported |
| Shapefiles | shpjs — parses zipped shapefiles in-browser from GCS URLs |
| Styling | Tailwind v4 via `@tailwindcss/vite` — no CDN, class-based dark mode |
| Types | TypeScript strict mode — `ViewState` union drives all navigation |
| Validation | Zod schemas in `scripts/validate-content.ts` — runs as prebuild |
| Data context | `CatalogContext` — single data-loading layer, mounts on app init |
| Error handling | `AppErrorBoundary` with `componentDidCatch` — all views covered |
| Security | Custom whitelist HTML sanitizer — no `dangerouslySetInnerHTML` escape |

### Key architectural decisions

**Query-param routing** was chosen over React Router because Cloudflare
Pages static hosting requires all paths to resolve to `index.html`. A
single `_redirects` rule handles this cleanly without hash routing or
server configuration. All routing logic lives in `utils/routing.ts`,
making it auditable and independently testable.

**Static JSON over a CMS** keeps the entire application deployable
without a backend. Dataset metadata, blog posts, and learn content are
version-controlled files. The Zod prebuild step enforces schema
correctness before any build reaches production — content errors are
caught at commit time, not in the browser.

**`CatalogContext` as a single data-loading layer** means every
data-dependent view (Catalog, Map, Locator, Learn) reads from one
shared context rather than making independent fetch calls. This
eliminates redundant network requests and provides a single error
propagation path.

**Dynamic imports for GeoRaster** reduced the initial MapViewer chunk
from ~1,800KB to ~32KB. The raster processing library defers to a
separate chunk that only loads when a GeoTIFF dataset is actually
opened — the common case (vector GeoJSON layers) pays no cost for it.

**Leaflet over MapboxGL** avoids API key dependencies and usage-based
billing entirely. The open-source Leaflet ecosystem (react-leaflet,
georaster plugins, shpjs) covers all rendering requirements — vector
layers, raster overlays, and in-browser shapefile parsing — with no
third-party account required.

See [DECISIONS.md](./DECISIONS.md) for the full set of architectural
decision records.

---

## Local Setup

**Prerequisites:** Node 22+, npm 10+
```bash
git clone https://github.com/slyberia/Guynode_v2.git
cd Guynode_v2
npm install
npm run dev        # dev server on :3000
```

---

## Build and Deploy
```bash
npm run build      # prebuild (validate + sitemap) → vite build
npm run preview    # preview built output locally
```

**Cloudflare Pages config:**
- Build command: `npm run build`
- Output directory: `dist`
- `public/_redirects` contains the SPA fallback rule:
  `/* /index.html 200`

---

## Data Pipeline

Guynode's data pipeline has three layers: schema validation at build
time, static asset delivery via Google Cloud Storage, and an offline
conversion pipeline for transforming source shapefiles into
browser-renderable GeoJSON.

### 1. Schema validation (prebuild)

Every build automatically runs two prebuild scripts before Vite
compiles the application:

- `scripts/validate-content.ts` — validates `public/data/datasets.json`
  and `public/blog/index.json` against Zod schemas. If any entry fails
  validation (missing required field, invalid enum value, malformed URL),
  the build fails before any output is produced. This ensures the live
  site never serves malformed data.
- `scripts/generate-sitemap.js` — regenerates `public/sitemap.xml` and
  `public/robots.txt` from the current dataset and content inventory.
  The sitemap is always current with the deployed content.

### 2. Dataset metadata (`datasets.json`)

All 53 datasets are defined in `public/data/datasets.json`. Each entry
includes:

- `id` — unique slug used for routing and asset path resolution
- `title`, `description`, `source` — display metadata and attribution
- `format` — one of `GeoJSON | Shapefile | GeoTIFF | PDF | Image |
  Spreadsheet | CSV | API | Mixed`
- `viewerType` — controls which inline viewer renders:
  `leaflet | image | pdf | none`
- `downloadUrl` — direct GCS URL to the downloadable asset
- `geojsonUrl` — GCS URL to the converted GeoJSON file (vector datasets
  only, populated by the conversion pipeline)
- `ingestionStatus`, `validationReport` — provenance tracking fields
  populated by `build-provenance-registry.py`

**To add a new dataset:**
1. Add an entry to `public/data/datasets.json` following the existing
   schema
2. Upload the source file to the `guynode-public-assets` GCS bucket
   under `spatial-data/<category>/<format>/`
3. Set `downloadUrl` to the public GCS URL
4. Run `npm run build` — the prebuild step will reject any schema
   violation before the build proceeds
5. If the dataset is a shapefile intended for map preview, run the
   conversion pipeline (see below) to generate and upload the GeoJSON,
   then set `viewerType: "leaflet"`

### 3. Shapefile → GeoJSON conversion pipeline

Source datasets are distributed as ESRI Shapefiles. Leaflet cannot
render shapefiles natively, so a conversion step is required before
any shapefile can be displayed in the map viewer or locator.

`scripts/convert-and-upload.py` automates the full pipeline:

**Prerequisites:**
- Python 3.8+
- GDAL (`ogr2ogr` must be on PATH — install via `conda install gdal`
  or `brew install gdal`)
- Google Cloud SDK (`gsutil` must be on PATH and authenticated via
  `gcloud auth login`)

**Usage:**
```bash
# Step 1 — dry run: verify all source files are found, no uploads made
python scripts/convert-and-upload.py \
  --assets-dir "/path/to/shapefiles" \
  --dry-run

# Step 2 — full run: convert, upload, update datasets.json
python scripts/convert-and-upload.py \
  --assets-dir "/path/to/shapefiles" \
  --update-json

# Optional flags
--skip-existing     # skip datasets where geojsonUrl is already populated
--dataset-id <id>   # run for a single dataset only
```

**What the pipeline does per dataset:**
1. Locates the source `.zip` shapefile using the dataset ID mapping in
   `FILENAME_MAP`
2. Unzips and converts to GeoJSON using `ogr2ogr`, reprojecting to
   EPSG:4326 (WGS84) automatically
3. Uploads the GeoJSON to GCS at
   `spatial-data/<category>/geojson/<id>.geojson`
4. Sets `Content-Type: application/geo+json` on the uploaded object
5. If `--update-json` is passed, updates the corresponding entry in
   `datasets.json`: sets `viewerType: "leaflet"` and populates
   `geojsonUrl`
6. Prints a summary of successful / skipped / failed / missing counts

**After running:**
```bash
git add public/data/datasets.json
git commit -m "data: populate geojsonUrl for converted shapefiles"
git push
```

### 4. GCS sync utility

`scripts/sync-assets.sh` syncs the `public/data/` directory to the
`guynode-public-assets` GCS bucket using `gsutil rsync`. Useful for
keeping the bucket in sync after bulk content changes.
```bash
./scripts/sync-assets.sh          # dry run — shows what would sync
./scripts/sync-assets.sh --force  # executes the sync
```

Requires `gsutil` installed and authenticated. The `-d` flag means
files deleted locally will also be deleted from the bucket — review
the dry run output before using `--force`.

### 5. Provenance registry

`scripts/build-provenance-registry.py` fingerprints each dataset asset
with SHA-256, binds source organization and confidence ratings, and
outputs `datasets_registry.json`. This provides an auditable lineage
record for every file in the archive — which organization produced it,
when it was ingested, and whether the file has changed since ingestion.

---

## Known Limitations

- **Shapefiles require desktop GIS software** — downloadable `.shp`
  files cannot be previewed in the browser; use QGIS or ArcGIS to
  open them
- **GeoJSON map viewer is pending** — the dataset map viewer
  (rendering GeoJSON layers from GCS) is under development; the
  locator map (togglable settlement layers) is fully functional
- **Blog content is stub data** — blog posts are placeholder entries
  pending editorial content
- **GeoTIFF preview is raster-only** — GeoTIFF datasets render as
  raster overlays with no vector attribute inspection

---

## Remediation History

This repository is a clean rebuild of an earlier prototype. The
original scaffold (Google AI Studio → Jules → Gemini) accumulated
significant technical debt across iterative multi-tool patching
sessions — dual Tailwind versions, Leaflet loaded twice, neutralized
error boundaries, dead GCS URLs, and type drift from parallel edits
across tools with no shared context. A 16-phase structured remediation
was executed to bring the codebase to production grade, targeting a
GPT audit score improvement from 63/100 to 88+.

**Phase 1 — Blockers**
Resolved the four go/no-go blockers preventing any deployment:
removed the dual Tailwind CDN/Vite conflict; removed the duplicate
Leaflet CDN load that caused global `L` conflicts; created the
Cloudflare Pages SPA fallback (`_redirects`), restored the
`AppErrorBoundary` with proper `componentDidCatch`, and added
placeholder OG images; cleaned all stale dev artifacts left over
from AI Studio, Jules, and Gemini sessions.

**Phase 2 — Asset pipeline**
Audited all URLs in `datasets.json` and categorized each as live,
dead, or placeholder. Fixed GCS CORS configuration. Wired the map
viewer to confirmed-live GeoJSON URLs. Populated `analyses.json` and
`blog/index.json` with stub entries to prevent silent blank views.

**Phase 3 — Stability**
Full TypeScript audit (`tsc --noEmit`) — resolved all type errors and
tightened escape hatches introduced by multi-model patching. Added
loading, empty, and error states to all data-dependent views. Verified
build output was clean with no Rollup warnings.

**Phase 4 — Data correctness and image preview**
Corrected all 33 misconfigured shapefile entries in `datasets.json`
(wrong `viewerType`, non-existent `geojsonUrl` references). Fixed
format classifications across 19 entries. Added source attribution
for all 53 datasets. Expanded the `viewerType` union to support
`image` and `pdf`. Built inline image preview and PDF preview
components for the catalog detail panel.

**Phase 5 — Locator page and conversion pipeline**
Built the Locator page — a full-screen Leaflet map with a scrollable
layer panel that fetches and parses shapefiles directly from GCS using
`shpjs`, rendering them as styled GeoJSON overlays with feature
popups. Built `convert-and-upload.py` — a Python pipeline using
`ogr2ogr` and `gsutil` to automate shapefile → GeoJSON conversion
and bucket upload. Added PDF preview support for two historical
dataset entries.

**Phase 6 — Learn section**
Added a dedicated Learn section (`LEARN_INDEX`, `LEARN_POST` view
states) separate from the blog infrastructure. Built the
`LearnIndexPage` and `LearnPostPage` components with a Digital Field
Journal design system (Libre Baskerville headings, JetBrains Mono
code blocks). Authored eight structured educational posts covering
GIS fundamentals, software guides, and Guynode-specific tutorials.

**Phase 7 — Learn section content and design refinement**
Resolved dark mode conflicts in the Digital Field Journal design
system — light-only tokens replaced with proper `dark:` Tailwind
variants. Fixed markdown rendering issues in `LearnPostPage` where
per-paragraph card wrapping and raw pipe syntax were appearing instead
of formatted tables.

**Phase 8 — Replacement readiness**
Closed the gap between deployable MVP and safe domain cutover: added
17 legacy URL redirects (`guynode.gy` paths → 301s in `_redirects`),
fixed the `LocatorPage` Leaflet import (`window.L` → direct import),
expanded the sitemap to cover blog, learn, and analyses routes, and
cleaned up deployment documentation.

**Phase 9 — GCS asset pipeline execution**
Ran `convert-and-upload.py` to convert and upload 32 GeoJSON files
to the GCS bucket. Updated `datasets.json` with `geojsonUrl` values.
Verified the map viewer rendered at least three layers successfully.

**Phase 10 — Provenance registry**
Built `scripts/build-provenance-registry.py` — a pipeline that
fingerprints each dataset asset with SHA-256, binds source
organization and confidence ratings, and outputs
`datasets_registry.json` for audit and lineage tracking.

**Phase 11 — Visual polish**
Produced the branded OG image (1200×630). Audited and retired
orphaned `bloom-*` and `night-*` design token drift across component
files. Applied spacing and card consistency pass. Removed the beta
banner.

**Phase 12 — MapViewer code-splitting**
Reduced the MapViewer chunk from ~1,800KB to ~32KB by dynamically
importing `georaster` and `georaster-layer-for-leaflet` only when a
GeoTIFF dataset is opened. The deferred chunk (~1,186KB) loads on
first GeoTIFF access only.

**Phase 13 — Dependency hygiene**
Ran `npm audit fix` to resolve 18 known vulnerabilities in the
webpack/chokidar legacy chain. Verified build passed after fixes.
Documented remaining unfixable items.

**Phase 14 — Portfolio documentation**
Elevated `README.md` and `DECISIONS.md` to portfolio-grade artifacts.
Added full architectural decision records, remediation history, and
data pipeline documentation.

**Phases 15–16 — Planned**
Phase 15: developer hooks (`fcakyon` TypeScript/lint hooks, PR comment
→ Claude Code trigger automation). Phase 16: multi-agent pipeline
connecting the Antigravity superscalar model and Notion-driven async
architecture to Guynode's data ingestion workflow.

---

## License

© 2026 Kyle Semple / HPS Geospatial. All rights reserved.
