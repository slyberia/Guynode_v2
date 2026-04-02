# Architectural Decision Records — Guynode

This document records the four key architectural decisions made for the Guynode spatial data archive. Each record explains the context, the choice made, why it was preferred, and what was accepted as a consequence.

---

## Decision: Query-param routing over React Router

**Context:** Guynode is a single-page application with multiple distinct views (Home, Catalog, Map Viewer, Blog, Analysis, etc.). A routing mechanism was needed that could deep-link to specific views and datasets without requiring a backend or server-side configuration.

**Decision:** All routing is implemented via URL query parameters (`?view=CATALOG`, `?view=MAP&datasetId=all-ndcs`) parsed in `utils/routing.ts`. A `ViewState` enum drives the view renderer in `App.tsx`. No routing library is used.

**Rationale:** Query-param routing works correctly on any static host without path-based rewrites beyond a single SPA fallback rule. React Router (or any history-API router) requires either server-side wildcard routing or careful configuration to avoid 404s on direct navigation — complexity that a static CDN host like Cloudflare Pages makes unnecessary. The query-param approach is also simpler to reason about: the entire routing contract fits in one file.

**Tradeoffs:** URLs are slightly less clean (`?view=CATALOG` vs `/catalog`). Deep-linking requires callers to use the routing utilities rather than constructing URLs manually. The `ViewState` enum is a single point of change — adding a new view requires updating both the enum and the router switch.

---

## Decision: Static JSON over a CMS or database

**Context:** The catalog, blog, and analysis data needed to be served to end users without a backend API, a CMS subscription, or a database instance. The data changes infrequently (datasets are added or corrected, not streamed in real time).

**Decision:** All content lives as static JSON files in `public/data/` and `public/blog/`, versioned in git and validated at build time with Zod schemas in `scripts/validate-content.ts`.

**Rationale:** A static JSON approach eliminates infrastructure cost, cold-start latency, and database management entirely. For a catalog of 53 datasets that changes on a weekly-or-slower cadence, the operational overhead of a CMS (authentication, content modeling, webhooks) or a database (provisioning, backups, connection pooling) is not justified. The prebuild validation step provides the same correctness guarantees a CMS would without the operational burden.

**Tradeoffs:** Updating content requires a git commit and a redeploy rather than an in-browser edit. Large catalog growth (thousands of entries) would require pagination or an index layer that static JSON cannot provide efficiently. Real-time data (live sensor feeds, daily-updated statistics) cannot be served this way.

---

## Decision: Custom HTML sanitizer over DOMPurify

**Context:** Blog post content is stored as HTML strings and rendered via `dangerouslySetInnerHTML`. An XSS sanitizer is required to strip dangerous tags and attributes before rendering.

**Decision:** A custom whitelist-based sanitizer was written in `utils/sanitize.ts`. It uses the browser's DOM parser to parse the input, walks the node tree, and removes any element or attribute not in an explicit allowlist.

**Rationale:** DOMPurify is the de-facto standard, but it adds ~45 KB to the bundle (minified) and requires careful version pinning because its bypass history is non-trivial. For a static site whose HTML content is authored in-house (not user-generated), a narrow allowlist sanitizer covers the actual risk surface without the dependency weight. The custom sanitizer is also fully auditable in a single file — there is no transitive dependency chain to track.

**Tradeoffs:** The custom sanitizer is less battle-tested than DOMPurify. If the blog ever accepts user-submitted HTML or embeds third-party content, switching to DOMPurify or a server-side sanitizer (e.g. `sanitize-html` at build time) would be strongly advisable. The current implementation must be manually updated if new allowed tags are needed.

---

## Decision: Leaflet over MapboxGL / Google Maps

**Context:** The GIS viewer needs to render vector GeoJSON layers and (optionally) raster GeoTIFF layers on an interactive tile-based map. Several map libraries were considered.

**Decision:** Leaflet 1.9 is used as the map engine, with `react-leaflet` for React integration and `georaster-layer-for-leaflet` for raster support. CartoCDN basemap tiles are used (no API key required).

**Rationale:** Leaflet is fully open-source and requires no API key for either the library itself or the CartoCDN basemap tiles used as the default basemap. MapboxGL requires a Mapbox access token (and incurs per-tile billing above the free tier); Google Maps requires a billing-enabled Google Cloud project. For a zero-budget public-good project, a no-key-required stack is essential. Leaflet's plugin ecosystem (especially `georaster-layer-for-leaflet`) covers the GeoTIFF raster use case without additional licensing.

**Tradeoffs:** Leaflet does not support WebGL-accelerated vector tile rendering. At very high feature counts, vector layer performance degrades more than MapboxGL would. The `georaster-layer-for-leaflet` plugin adds ~1.9 MB to the MapViewer chunk (the largest single contributor to bundle size). If Guynode ever needs smooth rendering of dense vector tile layers at zoom levels below 8, a migration to MapboxGL or Deck.gl should be evaluated.

---

## Decision: GeoRaster dynamic import

**Context:** `georaster` and `georaster-layer-for-leaflet` are large libraries required only when a user opens a GeoTIFF dataset in the map viewer. Initially they were statically imported alongside the rest of the MapViewer component.

**Decision:** Both libraries are loaded via `import()` dynamic import, triggered only when a GeoTIFF layer is actually needed.

**Rationale:** Static import produced a MapViewer chunk of approximately 1,800 KB — the single largest chunk in the bundle. Lazy-loading reduced the initial MapViewer chunk to 32 KB (-98%). Users who never open a GeoTIFF dataset never download either library. The trade-off is a brief loading pause on first GeoTIFF open, which is acceptable given the interaction pattern.

**Tradeoffs:** A loading state must be managed while the dynamic import resolves. The first GeoTIFF open on a slow connection will have a perceivable delay. Error handling must cover import failures in addition to fetch/parsing failures.

---

## Decision: Remediation via clean repository

**Context:** Guynode was originally scaffolded in Google AI Studio and iteratively patched using Jules and Gemini. Over time, accumulated multi-tool drift produced conflicting naming conventions, CDN anti-patterns, a neutralized `AppErrorBoundary`, stale build artifacts, and TypeScript that had drifted from its own type definitions.

**Decision:** A new repository (Guynode_v2) was started from a clean baseline rather than continuing to patch the original.

**Rationale:** The original codebase had reached a state where each incremental patch introduced as many inconsistencies as it resolved. The multi-model patching history made it difficult to reason about what any given file was authoritative for. A clean repo provided a stable baseline, a coherent git history readable as a portfolio artifact, and the ability to document architectural decisions explicitly from the start. A GPT audit of the original repo scored it 63/100; the target for Guynode_v2 is 88+.

**Tradeoffs:** All historical git blame was lost. Content and data files were migrated manually, introducing a migration window where both repos existed simultaneously. The clean-repo decision is not always the right call — it was appropriate here because the original had no test coverage, no schema validation, and no documented architecture to preserve.

---

## Decision: npm audit fix without --force

**Context:** `npm audit` reports 15 advisories in the installed dependency tree. All are in build-time transitive dependencies within the webpack/chokidar legacy chain — none are present in the production bundle served to users.

**Decision:** The advisories are accepted as-is. `npm audit fix --force` is not run.

**Rationale:** All 15 advisories affect packages that are only used during local development (file watching, build tooling). The production bundle shipped to Cloudflare Pages does not include them. Forcing resolution would upgrade major versions of build-tool internals that Vite depends on, with a meaningful risk of breaking the build pipeline. The correct resolution is to wait for upstream maintainers to release patched versions.

**Tradeoffs:** The `npm audit` output will continue to show advisories until upstream packages release fixes. Any new developer cloning the repo will see the audit warnings and may be confused. This ADR exists to document the conscious decision so it is not re-litigated.
