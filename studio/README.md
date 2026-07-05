# Sanity Studio — schema definitions

Phase 1 of the migration plan (`docs/SANITY_MIGRATION_PLAN.md`).

**Status: schema DESIGNED, not yet DEPLOYED.** These type definitions are the
source of truth for the Sanity Studio and for the MCP `deploy_schema` step. No
Sanity project, dataset, or schema has been created yet — the deploy half of
Phase 1 was blocked on the Sanity MCP being reachable.

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

## Remaining Phase 1 steps (need the Sanity MCP reachable)

1. `search_docs` / `read_docs` (`get-started`, `schema`, `groq` rules) to confirm
   current Studio/schema APIs before deploy.
2. `whoami` / `list_projects` — reuse an existing project or `create_project` +
   `create_dataset` if none.
3. `deploy_schema` from `schemaTypes/index.ts`; `deploy_studio`.
4. `add_cors_origin` for `https://www.guynode.com` + localhost.
5. Verify with `get_schema` and an empty `query_documents` per type.

Studio runtime scaffolding (`sanity.config.ts`, Studio deps) is deferred until
deploy so we don't add `sanity`/Studio dependencies to `package.json` before the
project exists.
