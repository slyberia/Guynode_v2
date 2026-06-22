# Guynode Portal Implementation Sequence

## Purpose

This document records the larger implementation plan for the Guynode replacement
site (the spatial data portal at https://www.guynode.com) so that future
implementation prompts — especially Claude Code CLI prompts run one at a time —
can reference the same goal, evidence, terminology, and sequence.

It exists to:

- **Prevent context drift.** Each prompt is run in isolation; without a durable
  reference, later prompts tend to re-derive (and subtly change) requirements.
- **Avoid hallucinated requirements.** The portal must be built from the audit
  findings and the real repository contents, not invented features.
- **Keep later implementation work connected to the audit findings** and to the
  intended end-to-end user flow:
  1. Discovery
  2. Evaluation
  3. Preview
  4. Download / Use

Future implementation steps should treat this document as the source of truth
for sequencing and terminology, and should update it when assumptions, field
names, validation rules, or implementation status change.

## Current audit summary

The audit of the replacement site found the following:

- The replacement site is **functional and substantially improved** over the old
  site in structure.
- The live Cloud Run site renders the major sections: **Home, Catalog, GIS
  Viewer, Locator, Developers, Learn, and About.**
- The **Catalog is structured and metadata-driven**, but metadata quality and
  trust signals need improvement.
- **Many datasets remain download-only** or do not have clear preview behavior.
  (At the time of this audit, all catalog records carry a `downloadUrl` and none
  carry a `geojsonUrl`, so no record is wired for true map preview yet.)
- **Some preview buttons and preview states are unclear or incomplete.**
- **Some dataset links may be broken** or need validation.
- The **integrity hash currently appears placeholder-like** and should not be
  presented as a real trust signal unless it is backed by real file checksums.
  (As of this audit the `metadataHash` field exists in the type model but is not
  populated or displayed anywhere, so no fake hash is rendered today. This must
  remain true.)
- **Dataset caveats from the current Guynode site are not fully represented** in
  the replacement metadata.
- The **Developers page is a major improvement** but depends on the quality of
  the dataset metadata and endpoint URLs.
- The **GIS Viewer exists** but the catalog-to-viewer handoff still needs work.
- The **Learn section is implemented and appears useful**, but legacy
  specialized content should still be reviewed for parity.
- **Legacy URL redirects and page parity still need a dedicated audit.**

## Larger implementation sequence

Work is intended to proceed in the following order:

1. **Dataset Metadata Contract and Validation**
2. **Catalog UX Pipeline**
3. **Viewer and Map Integration**
4. **Search, Tags, and Categories**
5. **Learn / Resources / Specialized Content Migration**
6. **QA Harness and Legacy Redirects**

### Why this order matters

- **Metadata must be fixed before UI can reliably display trust/status cues.**
  The catalog and developers page render whatever the metadata says; cleaning the
  contract first prevents building UI on top of ambiguous data.
- **Link validation must happen before download UX can be trusted.** A download
  modal or "Download" button is only as trustworthy as the verified URLs behind
  it.
- **Preview status must be clarified before catalog-to-viewer integration is
  finalized.** The viewer handoff depends on knowing which distributions are
  genuinely previewable.
- **Search/tag/category improvements depend on reliable metadata.** Faceted
  search is only useful when tags and categories are consistent.
- **Learn and specialized content migration should be based on a structured
  inventory** of legacy content, not ad-hoc copying.
- **QA should verify that future changes do not regress** routing, downloads,
  previews, mobile layout, console health, or accessibility.

## Classification terms

These statuses are reserved for use across metadata, validation, and UI. They
are defined here so future prompts use them consistently.

**Record / distribution availability:**

- `available` — link/distribution has been verified as reachable and usable.
- `broken` — link/distribution is confirmed unreachable or invalid.
- `unknown` — availability has not been determined.
- `needs-review` — flagged for human administrator review.

**Access mode:**

- `download-only` — usable only by downloading the file.
- `preview-available` — a preview (map or document) can be shown in-app.
- `preview-unavailable` — no in-app preview is currently possible.
- `requires-gis-software` — file needs external GIS software (e.g. zipped
  shapefiles) to be meaningfully used.
- `reference-only` — intended as reference material, not authoritative data.
- `indicative-only` — approximate/illustrative; not suitable for legal or
  precise use.

**Source / authority type:**

- `official` — issued by the responsible authority (e.g. GLSC, Bureau of
  Statistics).
- `digitized` — derived by digitizing an analog/printed source.
- `derived` — computed or transformed from other datasets.
- `external` — sourced from a third-party/global open repository (e.g. OSM).
- `historical` — historical material; context and caveats apply.

## Non-negotiable implementation principles

- **Do not invent metadata.**
- **Do not invent source caveats.**
- **Do not treat placeholder values as real validation data.**
- **Do not remove existing dataset records** unless they are clearly broken and
  the removal is documented.
- **Preserve backward compatibility where practical.**
- **Prefer additive schema changes before destructive refactors.**
- If old-site caveats or source details **cannot be confirmed from current repo
  content, mark them as `needs-review`.**
- Any field added for trust, citation, source, caveat, license, or validation
  should be designed so it can later be displayed in the **Catalog** and
  **Developers** page.
- Any validation script should produce **clear output that a human administrator
  can act on** (separated errors / warnings / info).

## Interpreting validation output (Prompt 1 triage)

When the validation script runs against the current data it reports a large
number of warnings (329 at the time of the triage pass). This is expected and
must not be misread:

- **The warnings are expected after adding the new contract.** Every new
  trust/provenance field (`license`, `caveats`, `citationText`, `lastVerified`,
  `checksum`, `authorityLevel`, …) is checked on every record, and those fields
  are not populated yet.
- **Warnings represent enrichment backlog, not regressions.** No existing data
  was changed or broken; the count measures how much metadata still needs to be
  filled in.
- **0 validation errors only means no blocking schema failures were detected** —
  no missing required fields, no duplicate IDs, no broken preview/download
  claims, no format/extension contradictions. It does **not** mean the metadata
  is complete.
- **Live URL health and CORS checks may still require deeper testing.**
  `utils/linkChecker.ts` is a client-side mock (`no-cors`, assumes local paths
  are OK); there is currently **no** script that performs real HEAD/GET checks
  against the remote GCS URLs, and **no** checksum generation exists. Both are
  needed before download UX can be trusted.

The triage classification (priority levels, automatable vs manual tracks,
script-resolvable vs evidence-required fields, and the list of sensitive
datasets) lives in the generated worklist at `docs/DATASET_METADATA_AUDIT.md`.

### Warning triage model

Each warning rule is classified on two independent axes:

- **Priority** — urgency/impact: `High` (legal/sensitive), `Medium`,
  `Low`, `Technical` (scriptable hygiene).
- **Resolution track** — `Automatable`, `Semi-automatable`, or
  `Manual / evidence-required`. The "manual review required" bucket equals every
  rule whose track is `Manual / evidence-required`.

Script-resolvable fields (`lastVerified`, `checksum`, URL status, content type,
file size, extension/format mismatch) are deferred to a future enrichment
script. Evidence-required fields (`license`, `citationText`, `attribution`,
`caveats`, `authorityLevel`, `sourceType`, `lineage`, `legalUseWarning`) must
never be auto-filled — they require source confirmation.

## Prompt 1.5 split: technical vs evidence-based metadata

Step 1 (Dataset Metadata Contract and Validation) is implemented across a split
sequence before Prompt 2:

- **Prompt 1.5A — Automatable Technical Metadata Validation (implemented).**
  Real, server-side URL health and file-integrity checks:
  - `utils/urlHealth.ts` — pure, dependency-injected helpers (HTTP status
    classification, `YYYY-MM-DD` verification dates, SHA-256, placeholder
    rejection, size-gated checksum) plus a `checkUrlHealth` orchestrator that
    tries `HEAD` then falls back to a ranged `GET` (`Range: bytes=0-0`).
  - `scripts/check-dataset-links.ts` (`npm run check:links`, add `-- --checksum`)
    — checks every `downloadUrl` / `geojsonUrl` / distribution / image URL,
    classifies each as `available` / `broken` / `forbidden` / `not-found` /
    `cors-limited` / `unknown` / `skipped`, and writes
    `docs/dataset-technical-validation.json`.
  - The audit generator folds that sidecar into a **Technical validation**
    section of `docs/DATASET_METADATA_AUDIT.md`.
  - By default `datasets.json` is **not** mutated (the script writes a report;
    `-- --write` is an explicit opt-in to apply `lastVerified` / `checksum`).

- **Prompt 1.6 — Legacy Metadata Extraction From Current Guynode (next).**
  Manual / evidence-based fields that must come from the old Guynode site or
  other confirmed source text — `caveats`, `lineage`, `sourceType`,
  `authorityLevel`, `legalUseWarning`, `attribution`, `citationText`, and
  specialized category context. These must **never** be auto-filled or invented.

These are split deliberately: URL/file validation is technical and automatable,
whereas caveats, legal warnings, authority levels, lineage, license
interpretation, and citations require human-confirmed evidence.

### User-facing vs admin-facing

- **URL health is user-facing.** It determines whether download buttons,
  previewable files, and developer endpoint URLs actually work, and lets the
  Catalog eventually show accurate status cues (`Available`, `Broken`,
  `Download only`, `Needs review`).
- **Checksums are mostly admin/developer-facing.** They support file-integrity
  verification, change/version tracking, migration QA, and provenance. They must
  **not** be a prominent regular-user UI signal — at most an advanced technical
  metadata section or a simple `File verified on YYYY-MM-DD` message derived from
  `lastVerified`.

## Future prompt reference

Future Claude Code CLI prompts should **read this document before making
changes.** Each future implementation step should **update this document** when
assumptions, field names, validation rules, or implementation status change.

The next planned step is **Prompt 1.6: Legacy Metadata Extraction From Current
Guynode**, then **Prompt 2: Catalog UX Pipeline**.
