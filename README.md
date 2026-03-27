# Guynode — Guyana Spatial Data Archive

Guynode is a static, zero-tracking spatial data archive for Guyana. It provides a unified catalog of geographic datasets — administrative boundaries, census data, electoral constituencies, marine zones, and historical maps — along with a built-in GIS viewer and a research blog. It is built for students, researchers, public agencies, and developers who need reliable, reusable spatial data on Guyana.

**Live site:** [https://www.guynode.com](https://www.guynode.com)

---

## Architecture

| Layer | Choice | Why |
|---|---|---|
| Framework | React 19 + Vite 6 | Fast HMR during development; optimized production bundles with code-splitting |
| Routing | Query-param SPA (`?view=CATALOG`) | No server-side routing required; works with Cloudflare Pages SPA fallback; deep-linkable without a backend |
| Styling | Tailwind v4 via `@tailwindcss/vite` | Zero-runtime CSS; all tokens compiled at build time; no CDN dependency |
| Data | Static JSON files in `public/data/` | No database or API server needed; data is versioned in git; prebuild validation catches schema drift |
| Maps | Leaflet + react-leaflet | Open-source, lightweight, no API key required; GeoRaster plugin adds GeoTIFF raster support |
| Hosting | Cloudflare Pages | Global CDN edge delivery; `public/_redirects` handles SPA fallback; zero cold-start latency |

---

## Local Setup

**Prerequisites:** Node.js 22+, npm 10+

```bash
git clone https://github.com/slyberia/Guynode_v2.git
cd Guynode_v2
npm install
npm run dev          # dev server on http://localhost:3000
```

---

## Build and Deploy

```bash
npm run build        # prebuild (validate + sitemap) → vite build → dist/
npm run preview      # serve dist/ locally for smoke-testing
```

**Cloudflare Pages config:**

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | `22` |

The file `public/_redirects` contains `/* /index.html 200`, which instructs Cloudflare Pages to serve `index.html` for every path, enabling client-side routing to take over. Without this file, direct URL navigation (e.g. `https://www.guynode.com/?view=CATALOG`) would return a 404.

---

## Data Pipeline

### Dataset catalog

All datasets are defined in `public/data/datasets.json` — an array of 53 entries conforming to the `Dataset` interface in `types.ts`. Each entry includes:

- `id` — unique kebab-case identifier
- `title`, `description`, `category`, `source`, `format`
- `viewerType` — controls inline preview: `"none"` | `"image"` | `"arcgis"` | `"leaflet"`
- `downloadUrl` — direct link to the file on GCS
- `ingestionStatus` / `validationReport` — pipeline metadata

**Prebuild validation** runs automatically on `npm run build` via `scripts/validate-content.ts`. It uses Zod to parse `datasets.json` and `public/blog/index.json` against their schemas and exits non-zero on any violation. This prevents deploying malformed data.

**Adding a new dataset:**

1. Add an entry to `public/data/datasets.json` following the existing schema.
2. Set `viewerType: "none"` unless you have a verified public GeoJSON or image URL.
3. Run `npm run build` — validation will catch missing required fields.
4. Upload the asset to the GCS bucket under `gs://guynode-public-assets/spatial-data/`.

### Analyses and blog

- `public/data/analyses.json` — array of `AnalysisEntry` objects (full content)
- `public/blog/index.json` — array of `BlogPost` summaries (full content in `public/blog/posts/`)

Both are populated manually and validated at build time.

---

## Environment Variables

Guynode has **no API keys** and **no runtime secrets**. The only environment variable used is:

| Variable | Default | Purpose |
|---|---|---|
| `NODE_ENV` | `development` | Suppresses debug logs in production; set automatically by Vite/Node |

---

## Known Limitations

- **Shapefiles require desktop GIS software.** Shapefile downloads (`.zip`) must be opened in QGIS, ArcGIS, or similar. There is no browser-based shapefile renderer.
- **GeoTIFF preview is raster-only.** The `guyana-coastal-villages` GeoTIFF is displayed as a static image via `ImageViewer`. Band-level raster analysis is not supported in the browser.
- **Blog content is stub data.** The five blog posts are representative placeholders. Real editorial content will replace them in a future update.
- **No user accounts or data collection.** Guynode is fully static — no analytics, no cookies, no form submissions are processed server-side.
