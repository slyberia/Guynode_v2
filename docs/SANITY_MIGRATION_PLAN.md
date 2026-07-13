# Sanity CMS Migration — Phased Implementation Plan

Status: **PROPOSED — not yet executed.** No Sanity project, schema, or document
has been created. No repo code has changed. Nothing runs until each phase is
approved.

## 1. Locked decisions

| Decision | Choice | Rationale |
|---|---|---|
| **Scope** | Editorial only | Blog + analyses + static pages move to Sanity. Datasets stay as pipeline-generated JSON. |
| **Delivery** | Build-time fetch | Prebuild pulls from Sanity, writes JSON into `public/`, keeps Zod validation. Site stays 100% static on Cloudflare Pages. |
| **Blog body** | Portable Text | HTML bodies convert to structured Portable Text; rendered with `@portabletext/react`. Retires `utils/sanitize.ts` for blog content. |

### Why datasets stay out of Sanity
`public/data/datasets.json` is produced by the ingestion pipeline
(`scripts/convert-shapefiles.ts`, `check-dataset-links.ts`,
`extract-table-previews.ts`) and carries real checksums, georeferences, and
validation reports. A human editing those in a Studio would fight the pipeline
and break provenance. Datasets remain authoritative as JSON; blog posts may
*reference* dataset IDs via `relatedDatasets`, but Sanity never owns dataset
records.

## 2. Guardrails / non-goals

- **No production request-path dependency on Sanity.** The MCP and Sanity API
  are build-time/authoring-time only. Cloudflare Pages still serves static JSON.
- **No dataset content enters Sanity.** `public/data/**` is untouched.
- **Do not touch** `types.ts` `ViewState` union, `public/blog/posts/*.json` will
  be *read then retired*, not edited in place.
- **Irreversible MCP actions** (`create_project`, `create_dataset`,
  `deploy_schema`, `deploy_studio`, `publish_documents`, `add_cors_origin`) run
  **only after explicit go for that phase.** Read-only MCP calls (`whoami`,
  `list_projects`, `get_schema`, `query_documents`, `read_docs`,
  `search_docs`) may run freely during planning/verification.
- **Docs-before-code:** each Sanity-touching phase begins with `search_docs` /
  `read_docs` / `list_sanity_rules` to confirm current APIs (SDK may have moved
  since model training).
- Every phase ends with a **commit checkpoint** (task-ID prefixed) and, where
  applicable, `npm run build` green before proceeding.

---

## Phase 0 — Pre-flight (read-only, no side effects)

**Goal:** confirm the workspace and lock the exact field mapping before creating
anything.

MCP (read-only):
- `whoami` — confirm authenticated identity and org.
- `list_projects` / `list_organizations` — confirm whether a project already
  exists; if so, do not create a duplicate.
- `list_sanity_rules` then `read_docs` for `get-started` and `groq` rules.

Repo-side:
- Freeze the source-of-truth field mapping in this doc (Phase 1 table below),
  derived from `types.ts`: `BlogPost`, `BlogAuthor`, `BlogCategory`, `BlogTag`,
  and the analyses shape in `public/data/analyses.json`.

**Exit:** identity + project state known; no writes performed.
**Commit:** none (read-only).

---

## Phase 1 — Schema design & deploy

**Goal:** Sanity schema that mirrors the editorial types, deployed and queryable.

Schema documents to author (from `types.ts`):

| Sanity type | Source interface | Notes |
|---|---|---|
| `author` | `BlogAuthor` | Was embedded per-post; becomes a referenced document (de-duplicates). |
| `category` | `BlogCategory` | Referenced document. |
| `tag` | `BlogTag` | Referenced document. |
| `blogPost` | `BlogPost` | `content` → Portable Text `body`. `author`/`categories`/`tags` → references. `relatedDatasets` → array of strings (dataset IDs, not references — datasets aren't in Sanity). `seoMeta` → object. `isPublished`/`isFeatured` retained. |
| `analysis` | `analyses.json` records | `summary`, `tags`, `datasetsUsed` (string IDs), `mapConfig` (object), `level`, `status`. |
| `page` | `pages/About.tsx`, `Privacy.tsx` | Portable Text body + slug. Deferred to Phase 5. |

MCP (write — requires go):
- `create_project` + `create_dataset` **only if Phase 0 found none.**
- `deploy_schema` with the authored schema.
- `deploy_studio` so editors have a UI.
- `add_cors_origin` for `https://www.guynode.com` and localhost dev (needed only
  if runtime queries are ever added; harmless to set now for the Studio).

MCP (verify):
- `get_schema` — confirm deployed shape matches intent.
- `query_documents` with a trivial GROQ (`*[_type=="blogPost"]`) — expect empty
  set, confirms the type exists and queries run.

**Exit:** schema deployed, Studio reachable, empty queries succeed.
**Commit:** `S1: sanity schema definitions` (schema files live in repo under
`sanity/` or `studio/`).

---

## Phase 2 — Content migration (blog + analyses)

**Goal:** every existing post and analysis exists as a Sanity document with no
field loss.

Repo-side transform (I already have the source JSON in context):
- Read `public/blog/index.json` + `public/blog/posts/*.json` (5 posts) and
  `public/data/analyses.json`.
- Convert each post `content` HTML string → Portable Text via
  `@sanity/block-tools`.
- Resolve embedded authors/categories/tags into deduplicated reference
  documents (create those first, then reference by `_id`).

MCP (write — requires go):
- `create_documents` for authors, categories, tags (dedup set).
- `create_documents` for blogPost + analysis docs referencing the above.
- `publish_documents` to promote drafts to published.

MCP (verify — this is the key integrity loop):
- `query_documents` each migrated doc and diff field-by-field against the source
  JSON. Specifically confirm Portable Text round-trips headings, lists, `<strong>`,
  and links from the original HTML (the API-v2 post and the Caribbean post are
  the richest — use them as canaries).
- Confirm reference resolution: a `blogPost` query with dereferenced
  `author->`, `categories[]->`, `tags[]->` returns the same names as the JSON.

**Exit:** N documents published; field-diff clean; Portable Text visually
equivalent to source HTML.
**Commit:** `S2: content migration scripts + import log` (the transform/import
script is committed; it's reusable and documents exactly what moved).

---

## Phase 3 — Build-time fetch + validation

**Goal:** prebuild pulls from Sanity and writes the same JSON files the app
already consumes, so the static contract is unchanged.

Repo-side:
- New `scripts/fetch-sanity-content.ts`: uses `@sanity/client` with GROQ to
  fetch blogPost + analysis docs, renders/serializes to the **exact JSON shapes**
  in `types.ts` (`BlogPost[]`, analyses), and writes:
  - `public/blog/index.json`
  - `public/blog/posts/<slug>.json`
  - `public/data/analyses.json`
- Portable Text → the app's render format: bodies serialize to Portable Text
  JSON in the document files (see Phase 4 renderer), **not** back to HTML.
- Wire into `package.json` `prebuild` **before** `validate-content.ts`, so Zod
  still gates every publish:
  `prebuild: "tsx scripts/fetch-sanity-content.ts && tsx scripts/validate-content.ts && ..."`
- Extend `scripts/validate-content.ts` Zod schema for the Portable Text `body`
  field shape.
- `scripts/generate-sitemap.js` already reads the JSON — no change needed once
  the JSON is regenerated from Sanity.

MCP (read-only): `query_documents` to confirm the GROQ used by the script
returns the expected shape before wiring it into prebuild.

Environment:
- `SANITY_PROJECT_ID`, `SANITY_DATASET`, and a **read token** become build env
  vars (Cloudflare Pages build settings). Read token only; never shipped to the
  client. No secrets in the repo.

**Exit:** `npm run build` regenerates the JSON from Sanity, Zod passes, sitemap
regenerates. Deleting a post in Studio → rebuild → post gone from `public/`.
**Commit:** `S3: build-time sanity fetch + prebuild wiring`.

---

## Phase 4 — App integration (fetch swap + Portable Text render)

**Goal:** the app renders Sanity-authored content. The fetch API surface is
unchanged, so consumers don't move.

Repo-side:
- `services/dataFetcher.ts`: **unchanged behavior** — still
  `fetch('/blog/index.json')` etc., because Phase 3 keeps writing those files.
  This is the payoff of build-time delivery: the runtime data path is identical.
  (If we had chosen runtime queries, this file would swap to `@sanity/client`;
  we did not.)
- New `components/blog/PortableTextBody.tsx` using `@portabletext/react` to
  render the `body` field. Replaces HTML-string + `dangerouslySetInnerHTML` +
  `utils/sanitize.ts` for blog/analysis bodies.
- `BlogPostPage.tsx`, analysis pages, and any component reading `post.content`
  as an HTML string switch to the Portable Text renderer.
- `utils/sanitize.ts` stays in the tree if any non-blog surface still uses it;
  otherwise flagged for removal (verify usages first — do not delete blind).

Verify:
- `npm run dev`, walk every blog route (`BLOG_INDEX`, `BLOG_POST`,
  `BLOG_CATEGORY`, `BLOG_ARCHIVE`, `BLOG_SEARCH`) and analysis views. Confirm
  rendering matches pre-migration.
- `npm run test`, `npm run lint`, `npm run build` all green.

**Exit:** app renders Sanity content identically to before; sanitizer no longer
in the blog path.
**Commit:** `S4: portable text rendering + fetch-layer alignment`.

---

## Phase 5 — Static pages (optional, can defer)

**Goal:** About / Privacy / Attribution move from hardcoded TSX to Sanity `page`
docs.

- Author `page` schema (Phase 1 already stubbed it).
- Migrate copy from `pages/About.tsx`, `Privacy.tsx`, `AttributionPage.tsx` into
  `page` documents.
- Render via the same Portable Text component; page components become thin
  loaders keyed by slug.
- Lower priority — these change rarely. Ship Phases 1–4 first; treat this as a
  fast-follow.

**Commit:** `S5: static pages to sanity`.

---

## Phase 6 — Cutover & editor workflow

**Goal:** editors publish without touching the repo; a publish triggers a deploy.

- **Deploy webhook:** Sanity publish → Cloudflare Pages deploy hook. This is the
  one piece that keeps "static site" and "no-redeploy-editing" compatible: the
  editor clicks Publish, the webhook fires a rebuild, Phase 3's prebuild pulls
  fresh content. Configured in Cloudflare + Sanity dashboards (I can document the
  exact steps; the hook URL is a secret, set by you).
- Retire `public/blog/posts/*.json` and `index.json` as **hand-edited** sources —
  they're now build outputs, regenerated each build. Add a header comment /
  `.gitignore` decision: either commit generated JSON (reviewable diffs) or
  gitignore it (cleaner tree, build-only). Recommend **committing** it so PRs
  show content diffs and the site still builds if Sanity is briefly unreachable.
- Update `README.md` + `CLAUDE.md` "Data" section to describe the new flow.

**Commit:** `S6: editor workflow docs + generated-content policy`.

---

## Rollback

Each phase is independently revertable:
- Phases 1–2 (Sanity-side) leave the repo's static JSON untouched — the live
  site is unaffected until Phase 3 wires prebuild. Rolling back = don't merge.
- Phase 3–4 rollback = revert the `prebuild` script change and the fetch/render
  commits; the committed `public/**` JSON still serves the site with zero Sanity
  dependency. **The site can always fall back to fully static** because the JSON
  is committed.

## Dependencies to add (flagged per CLAUDE.md)

| Package | Reason | Phase |
|---|---|---|
| `@sanity/client` | Build-time GROQ fetch | 3 |
| `@sanity/block-tools` | HTML → Portable Text conversion (one-time + build) | 2–3 |
| `@portabletext/react` | Render Portable Text in the app | 4 |
| `sanity` (Studio) | Studio config in repo under `studio/` | 1 |

This is a real footprint against the current near-zero-backend, minimal-dep
posture. All are build/authoring-time except `@portabletext/react`, which ships
to the client (replacing the custom-sanitizer render path, roughly net-neutral).

## Open decisions / to confirm before Phase 1 go

- **[DECISION]** Commit generated `public/**` JSON (recommended) vs. gitignore it.
- **[DECISION]** Studio location: embedded route in this app vs. separate
  `studio/` deploy. Recommend separate — keeps the SPA bundle clean.
- **[OUT OF SCOPE]** Datasets remain JSON/pipeline-owned; not revisited here.
- **[CONFIRM]** Sanity plan/tier is adequate for document count + one editor
  (free tier almost certainly fine at this scale).

## Suggested execution order

Phases 0 → 1 → 2 → 3 → 4 gets a fully working, editor-authored blog + analyses on
a static site. Phase 5 (static pages) and Phase 6 (webhook automation) are
fast-follows. I recommend **stopping for review after Phase 2** (content
migrated and verified in Sanity, repo still untouched) as the natural
go/no-go gate before changing the build.
