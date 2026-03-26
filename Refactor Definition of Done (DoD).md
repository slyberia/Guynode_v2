# Refactor Definition of Done (DoD)

1. The build must succeed (`npm run build`).
2. No AI Assistant code or UI is shipped.
3. No client API keys are present in the codebase.
4. The Catalog loads strictly from `/public/data/datasets.json`.
5. The Blog loads strictly from `/public/blog/index.json` and `/public/blog/posts/*`.
6. The viewer loads GeoJSON by URL.
7. Legacy URLs are handled gracefully via Firebase redirects.