# Guynode — Guyana Spatial Data Archive

Guynode is a static, zero-tracking spatial data archive for Guyana. It provides a unified catalog of geographic datasets — administrative boundaries, census data, electoral constituencies, marine zones, and historical maps — along with a built-in GIS viewer, analysis summaries, a research blog, and a learning center. It is built for students, researchers, public agencies, and developers who need reliable, reusable spatial data on Guyana without infrastructure friction.

**Live site:** [https://www.guynode.com](https://www.guynode.com)  
**Repo:** [https://github.com/slyberia/Guynode_v2](https://github.com/slyberia/Guynode_v2)

---

## Architecture

| Layer | Choice | Why |
|---|---|---|
| Framework | React 19 + TypeScript 5.8 + Vite 6 | Fast HMR during development; optimized production bundles with code-splitting |
| Routing | Query-param SPA (`?view=CATALOG`) | No server-side routing required; works with Cloudflare Pages SPA fallback; deep-linkable without a backend |
| Styling | Tailwind v4 via `@tailwindcss/vite` | Zero-runtime CSS; all tokens compiled at build time; no CDN dependency |
| Data | Static JSON files in `public/data/` | No database or API server needed; data is versioned in git; prebuild validation catches schema drift |
| Maps | Leaflet 1.9 + react-leaflet 5 | Open-source, no API key required; GeoRaster plugin adds GeoTIFF raster support |
| Hosting | Cloudflare Pages | Global CDN edge delivery; `public/_redirects` handles SPA fallback; zero cold-start latency |

### Query-param routing

All navigation state lives in the URL as `?view=<VIEW_STATE>`. The `ViewState` enum in `types.ts` drives the view renderer in `App.tsx`; all parsing and construction lives in `utils/routing.ts`. This eliminates server-side route configuration entirely — Cloudflare Pages only needs a single `/* /index.html 200` fallback rule.

### Static JSON data layer

All catalog, analysis, and blog content is served as static JSON fetched at runtime:

| File | Purpose |
|---|---|
| `public/data/datasets.json` | 53 dataset catalog entries |
| `public/data/analyses.json` | Analysis summaries |
| `public/blog/index.json` | Blog post index |
| `public/learn/index.json` | Learn center article index |

Data changes infrequently and is authored directly in git. The prebuild step validates every file against Zod schemas (`scripts/validate-content.ts`) before `vite build` runs. This trades real-time editability for zero operational overhead — no CMS subscription, no webhook configuration, no auth surface.

### GCS asset hosting

Binary assets (GeoJSON files, GeoTIFFs, shapefiles) are hosted in the `guynode-public-assets` GCS bucket and served via public URLs. CORS is configured on the bucket with a wildcard origin rule to allow browser fetches from `guynode.com`.

### Cloudflare Pages deployment

`public/_redirects` contains `/* /index.html 200`. Without it, direct navigation to any `?view=` URL would return a 404 from Cloudflare's edge. The file is copied into `dist/` at build time.

---

## Local Setup

**Prerequisites:** Node.js 18+, git

```bash
git clone https://github.com/slyberia/Guynode_v2.git
cd Guynode_v2
npm install
npm run dev          # dev server on http://localhost:3000
```

**Environment variables:** None. Guynode has no API keys and no runtime secrets. The only implicit variable is `NODE_ENV`, set automatically by Vite.

---

## Build and Deploy

```bash
npm run build        # prebuild (validate + sitemap) → vite build → dist/
npm run preview      # serve dist/ locally for smoke-testing
```

The `prebuild` script runs two steps before Vite:
1. `scripts/validate-content.ts` — Zod validates `datasets.json` and `blog/index.json`; exits non-zero on schema violation
2. `scripts/generate-sitemap.js` — regenerates `public/sitemap.xml` and `public/robots.txt`

**Cloudflare Pages config:**

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | `22` |

**OG image generation** (run manually, not part of CI):

```bash
node scripts/generate-og-image.js
```

Outputs `public/og-image.png` (1200×630). Requires a local Chrome/Chromium install for Puppeteer.

---

## Data Pipeline

### Shapefile → GeoJSON conversion

The canonical pipeline tool is `scripts/convert-and-upload.py`. It accepts a `.zip` shapefile, reprojects to WGS-84, converts to GeoJSON with `geopandas`, and uploads the result to the `guynode-public-assets` GCS bucket under `spatial-data/`.

```
Input: .zip shapefile (any projection)
       ↓ geopandas reproject → WGS-84
       ↓ to_file(driver='GeoJSON')
       ↓ gsutil cp → gs://guynode-public-assets/spatial-data/<slug>.geojson
Output: public GCS URL added to datasets.json
```

`sync-assets.sh` was an earlier bulk-sync helper and has been superseded by the Python pipeline. It remains in the repo for reference but is not used in the current workflow.

**GCS bucket:** `guynode-public-assets`  
**CORS:** wildcard origin configured at bucket level

### Adding a new dataset

1. Run `scripts/convert-and-upload.py` to convert and upload the file.
2. Add an entry to `public/data/datasets.json` following the existing schema.
3. Set `viewerType: "none"` unless you have a verified public GeoJSON or image URL.
4. Run `npm run build` — validation will catch missing required fields.

---

## Remediation History

Guynode was originally scaffolded in **Google AI Studio** and iteratively patched using **Jules** and **Gemini** over several months. The accumulated multi-tool drift (conflicting naming conventions, CDN anti-patterns, neutralized error boundaries, stale artifacts) eventually made incremental patching unsafe. A clean repository — **Guynode_v2** — was started to address the technical debt on a stable baseline, with a cleaner git history and explicit architectural decisions documented here.

A GPT-based audit of the original repo scored it **63/100**. The target for Guynode_v2 is **88+**.

### Phase log

| Phase | Scope |
|---|---|
| 1 | Removed Tailwind CDN conflict, fixed Leaflet double-load, added `_redirects` SPA fallback, restored `AppErrorBoundary` |
| 2 | Verified GCS asset URLs, configured CORS for `guynode.com`, populated `analyses.json` and `blog/index.json` |
| 3 | Resolved TypeScript drift from multi-model patching; added error states on data-dependent views |
| 4 | Zod schema validation prebuild step; sitemap and robots.txt generation |
| 5 | GIS viewer: GeoRaster dynamic import (MapViewer chunk 1,800 KB → 32 KB); Leaflet tile layer cleanup |
| 6 | Blog system: index page, post page, category filtering, archive, search |
| 7 | Analysis detail page; dataset detail modal; viewerType routing |
| 8 | Learn center: index page, post page, difficulty/category filtering |
| 9 | SEO: `react-helmet-async` per-page meta, canonical URLs, OG tags, sitemap entries |
| 10 | Locator tool: coordinate lookup, region highlight, GeoJSON boundary overlay |
| 11a | Design system: removed `night-*` / `bloom-*` token drift; unified `gn-*` semantic tokens |
| 11b | Design system: dark mode audit; `prose-invert` cleanup; card elevation tokens |
| 11c | Design system: component-level token sweep; removed raw hex values from components |
| 11d | Design system: Libre Baskerville + JetBrains Mono typography; Learn post blueprint background; h1 signature underline; content cards; meta row |
| 12 | Performance: code-splitting audit; lazy-loaded route chunks; image optimisation |
| 13 | Accessibility: focus rings, ARIA labels, keyboard navigation, skip link |

---

## Known Issues

- **15 npm audit advisories** — all build-time transitive dependencies in the webpack/chokidar legacy chain, not present in the production bundle. Forcing resolution with `npm audit fix --force` risks breaking Vite's build pipeline. These will clear when upstream packages release patched versions.
- **`sync-assets.sh` is superseded** — the file remains in `scripts/` for reference but the Python pipeline (`convert-and-upload.py`) is the current standard.
- **Blog content is stub data** — the blog posts are representative placeholders pending real editorial content.
