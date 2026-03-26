# Guynode — Claude Code Instructions

## Project
Static SPA — spatial data archive for Guyana.
Repo: https://github.com/slyberia/GuynodeRedesigned.git
Live target: https://www.guynode.com (Cloudflare Pages)

## Stack
| Layer | Package | Version |
|---|---|---|
| UI | React | 19.2 |
| Build | Vite | 6.2 |
| Language | TypeScript | 5.8 |
| Styling | Tailwind | v4 via @tailwindcss/vite — NO CDN |
| Maps | react-leaflet + leaflet | 5.0 + 1.9.4 — NO unpkg CDN |
| GeoRaster | georaster + georaster-layer-for-leaflet | 1.6 + 4.1 |
| Meta | react-helmet-async | 3.0 |
| Validation | zod | 4.3 |
| Runtime | Node | 22+ |

## Architecture
- Routing: query-param SPA (?view=CATALOG, ?view=MAP, etc.) — no React Router
- Routing logic: utils/routing.ts — ViewState enum drives all navigation
- Data: fetched at runtime from public/data/datasets.json, public/blog/index.json
- Context: CatalogContext (context/CatalogContext.tsx) loads all data on mount
- Hosting: Cloudflare Pages — SPA fallback via public/_redirects
- No backend, no API keys in client, no AI runtime

## Key paths
```
index.tsx              Entry point
App.tsx                Root component + view router
types.ts               All shared types — ViewState, Dataset, BlogPost, etc.
utils/routing.ts       URL parsing, view resolution, legacy path mapping
utils/env.ts           SITE_URL, SUPPORT_EMAIL, env guards
utils/sanitize.ts      Custom HTML sanitizer (whitelist-based, no DOMPurify)
components/core/       AppErrorBoundary, MetaManager
context/               CatalogContext — single source of truth for all data
services/dataFetcher.ts  All fetch calls — datasets, analyses, blog posts
public/data/           Static JSON data files (served at runtime)
public/blog/           Blog index + individual post JSON files
public/_redirects      Cloudflare Pages SPA fallback (/* /index.html 200)
scripts/               validate-content.ts, generate-sitemap.js (prebuild)
tests/                 Node test runner — tsx --test
```

## Build
```bash
npm run dev          # dev server on :3000
npm run build        # prebuild (validate + sitemap) → vite build
npm run lint         # eslint
npm run test         # tsx --test (runs tests/*.test.ts)
npm run preview      # preview built output
```
Prebuild runs automatically on `npm run build`:
1. scripts/validate-content.ts — Zod validates datasets.json + blog/index.json
2. scripts/generate-sitemap.js — regenerates public/sitemap.xml + robots.txt

## Theme system
Tailwind v4 only — compiled via @tailwindcss/vite plugin.
Theme tokens are defined in index.html inline script (being removed in Phase 1).
After Phase 1: tokens live in CSS or tailwind config only.
Semantic token convention: bg-gn-surface, text-gn-foreground, border-gn-border, etc.
Dark mode: class-based (.dark on <html>). Toggled in App.tsx via localStorage.
Do NOT use raw hex values or legacy night-* classes in components.

## Known issues (active remediation)
- Phase 1: Tailwind CDN + v4 conflict, Leaflet double-load, missing SPA fallback,
  neutralized AppErrorBoundary, 0-byte OG/placeholder images, stale dev artifacts
- Phase 2: GCS asset URLs unverified, CORS not configured for guynode.com,
  analyses.json + blog/index.json are empty arrays
- Phase 3: TypeScript drift from multi-model patching, missing error states on
  data-dependent views

## Behavior rules
- Never reprint a full file that already exists — show diffs or changed blocks only
- New files: show once in full
- Changed blocks: include file path header + 3–5 lines of surrounding context
- All terminal commands in a single ordered fenced block at the end
- No dependency additions without flagging the name and reason first
- No changes outside the stated session scope
- One [OUT OF SCOPE] note per discovered issue — do not fix it
- TypeScript: minimal correct fix — no : any, no as unknown unless explicitly permitted
- Commit after each named task: prefix with task ID (e.g. "1A: remove Tailwind CDN")
- Run npm run build before closing any session

## Do not touch (unless the session brief explicitly says so)
- public/data/datasets.json structure
- public/blog/posts/*.json content
- migrated_prompt_history/ — .gitignore only, do not delete contents
- types.ts ViewState union — changes here break all routing

## Session close format
Every session must end with exactly:

DONE
- What changed: [one line per file]
- Decisions: [non-obvious choices, or "none"]
- Open: [OUT OF SCOPE items or unresolved issues, or "none"]
```