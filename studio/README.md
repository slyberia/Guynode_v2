# Sanity Studio — schema definitions

Phase 1 of the migration plan (`docs/SANITY_MIGRATION_PLAN.md`).

**Status: DEPLOYED (MCP-managed).** Phase 1 is complete:

| What | Value |
|---|---|
| Project | `guynode` (`rd6i9t7y`), org 32BELOW — pre-existing, reused |
| Dataset | `production` (public ACL) |
| Schema | 6 types, deployed via MCP `deploy_schema` (workspace `default`) |
| Studio | https://guynode.sanity.studio/ (hosted, MCP-managed) |
| CORS | `https://www.guynode.com`, `http://localhost:3000` |

**The MCP-managed schema is authoritative.** The files here are a mirror kept
in sync for review and documentation. There is deliberately no local Studio
installation (`sanity.config.ts` / Studio deps) — the hosted MCP-managed Studio
replaces it. If a local Studio is ever scaffolded, schema management must move
to `npx sanity schema deploy` and the MCP `deploy_schema` tool must no longer
be used (the two paths conflict).

Schema changes: edit the mirror here first, then re-run `deploy_schema` with
the equivalent declaration, then re-run `deploy_studio` so the hosted Studio
picks up the change.

## Schema types (`schemaTypes/`)

| Type | Source of truth | Notes |
|---|---|---|
| `author` | `BlogAuthor` (`types.ts`) | Was embedded per-post; now a referenced doc. |
| `category` | `BlogCategory` | Referenced doc, slugged. |
| `tag` | `BlogTag` | Referenced doc, slugged. |
| `blogPost` | `BlogPost` | `content` HTML → `body` Portable Text. author/categories/tags → references. `relatedDatasets` → string IDs (datasets stay in JSON). |
| `analysis` | `public/data/analyses.json` | `datasetsUsed` → string IDs. `mapConfig` kept loose pending audit. |
| `page` | `pages/*.tsx` | Stub for Phase 5 (static pages). |

## Datasets are intentionally absent

Datasets remain pipeline-generated JSON (`public/data/datasets.json`) and are
never authored in Sanity. Blog posts and analyses reference dataset IDs as plain
strings only.

## Notes for Phase 2 (content migration)

- Per Sanity schema rules: do NOT mint deterministic `_id`s from legacy IDs.
  Let Sanity generate `_id`s; the source JSON IDs (`post-4`, `auth-1`,
  `ana-001`, ...) go in each document's `legacyId` field, and imports upsert by
  querying `legacyId`/`slug`.
- Verified empty state: `count()` per type returned 0 across all 6 types after
  deploy.
