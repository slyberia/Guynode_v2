# Guynode Sensitive Dataset Metadata Evidence Bank

**Compiled date:** June 22, 2026  
**Purpose:** Consolidate the two prior findings reports into one usable evidence bank that can substitute for a program’s inability to directly access the Guynode website.

## 1. Working Context

The dataset metadata audit identified **32 sensitive datasets** that require manual metadata enrichment. These records were flagged because they involve boundaries, Indigenous/Amerindian areas, historical maps, maritime boundaries, planning boundaries, petroleum layers, or other categories where provenance, caveats, and legal-use warnings matter.

The missing or weak metadata fields are mostly:

- `license`
- `citationText` / `attribution`
- `caveats`
- `authorityLevel`
- `sourceType`
- `lineage`
- `legalUseWarning`

The Guynode website does not appear to expose a clean structured metadata API for these records. Instead, the useful information is scattered across the homepage, about page, administrative-boundaries page, local-layers page, environmental page, and planning/context pages. Humanity’s usual contribution to systems design: useful data, lovingly hidden in prose.

## 2. High-Level Evidence Extracted From Guynode

### 2.1 License and reuse posture

Guynode’s homepage states that **all datasets are licensed under open data licenses** and can be downloaded and reused freely with attribution【442686565285398†L21-L24】. This supports using a default license value such as:

> `Public domain / open data. Free to use with attribution.`

The About page reinforces this by stating that all datasets stored on the Guynode spatial data portal are in the **public domain**【535471492362637†L49-L55】. It also explains that datasets come from public sites such as OpenStreetMap and the Statistical Bureau of Guyana, with some shapefiles digitized from images in public-domain documents【535471492362637†L49-L57】.

### 2.2 Source model

Guynode’s data model is best understood as a **curated and digitized public-source portal**, not as a single official government data publisher. The site describes itself as a grassroots open spatial data infrastructure project meant to make GIS data easier to access in Guyana【535471492362637†L22-L34】.

For metadata purposes, source types should be classified as one of:

- `official` — direct government or institutional source
- `external` — non-Guynode public source
- `digitized` — converted or traced by Guynode from maps, PDFs, images, or web maps
- `derived` — compiled from multiple sources
- `historical` — archival map or historical document

Many records will need more than one label, such as `external/digitized` or `official/digitized`.

### 2.3 Authority and caveat model

Several Guynode layers were created because official GIS-ready shapefiles could not be located. For Georgetown census districts, Guynode states that an official census district map was unavailable, so the layer was developed using census district names from the Bureau of Statistics and boundaries from GECOM【137168263236309†L156-L164】. For Linden, Guynode states that district boundaries were digitized from OpenStreetMap, Google Maps, Bing Maps, and other internet maps; it also warns that some boundaries may still need editing and that an official shapefile could not be located【137168263236309†L188-L192】.

That is the core caveat pattern:

> Many boundaries are useful for mapping, education, and exploratory analysis, but they should not be treated as legal, cadastral, electoral, administrative, or planning authority unless explicitly sourced from an official boundary product.

## 3. Global Metadata Defaults

These defaults can be applied when a dataset’s page has no stronger or more specific evidence.

| Field | Recommended default |
|---|---|
| `license` | Public domain / open data |
| `attribution` | Credit Guynode and original source |
| `authorityLevel` | Low to medium |
| `sourceType` | Digitized or derived |
| `lastVerified` | Set from successful URL check |
| `legalUseWarning` | Not for legal boundary decisions |

### 3.1 Default citation template

Use this when the dataset was hosted or compiled by Guynode and the source page names a provider:

> Data hosted or compiled by Guynode. Original source: `[source organization]`. Where applicable, boundaries were digitized or derived by Guynode from public maps, documents, or shapefiles.

### 3.2 Default caveat template

Use this for digitized boundaries:

> Boundary geometry is indicative and may have been digitized from public maps, documents, or third-party basemaps. It should be used for reference, education, exploratory mapping, or general analysis only. It should not be used as a legal, cadastral, electoral, planning, maritime, Indigenous land, or administrative boundary authority.

### 3.3 Default legal-use warning

Use this for sensitive boundary and planning records:

> This dataset is not a legal boundary instrument. Verify against the responsible authority before using it for legal, regulatory, planning, land-tenure, resource-rights, electoral, or boundary-dispute decisions.

## 4. Source Evidence by Website Area

### 4.1 Homepage

The homepage provides the broadest license and reuse evidence. It says Guynode provides free GIS datasets for students, researchers, local authorities, and communities in Guyana【442686565285398†L17-L22】. It also states that datasets are open-data licensed and free to use with attribution【442686565285398†L21-L24】.

Use this evidence for:

- default `license`
- default `attribution`
- general reuse statement
- project-level metadata summary

### 4.2 About page

The About page explains why Guynode exists: government websites in Guyana rarely provide GIS-ready spatial data, and maps are often distributed as PDFs, JPGs, or TIFFs that require geoprocessing before analysis【535471492362637†L28-L34】.

It also states that Guynode collects GIS layers and maps, organizes conversion into GIS formats, and stores them on a single platform for public access【535471492362637†L31-L34】. This is strong evidence that many datasets are curated or digitized products rather than official source datasets.

Use this evidence for:

- `lineage`
- `sourceType`
- `caveats`
- `authorityLevel`

### 4.3 Administrative boundaries page

The administrative page contains the highest-value evidence for the audit’s sensitive dataset list. It includes national, regional, municipal, NDC, village, historic, and maritime boundary layers.

Important source statements include:

- Guyana international boundary shapefile appears as OpenStreetMap-derived【137168263236309†L34-L40】.
- Guyana’s EEZ shapefile was digitized by Guynode from a Flanders Marine Institute shapefile【137168263236309†L64-L68】.
- Regional Democratic Council data use OpenStreetMap for basemap geometry and Bureau of Statistics for demographic data【137168263236309†L85-L93】.
- Georgetown census districts were developed by Guynode using Bureau of Statistics names and GECOM boundaries because an official census district map was unavailable【137168263236309†L156-L164】.
- Linden census districts were digitized from OSM, Google Maps, Bing Maps, and other online maps; some boundaries may need editing【137168263236309†L188-L192】.

Use this page as the primary source for most sensitive boundary records.

### 4.4 Local layers page

The local layers page provides additional evidence for NDCs, municipal boundaries, villages, and Amerindian areas. It lists:

- NDC boundaries and demographic tables connected to the Bureau of Statistics【211068140461389†L19-L25】.
- Amerindian Areas shapefile with LandMark as the listed source【211068140461389†L27-L32】.
- Local government planning objectives and community-level GIS features Guynode wants to assemble【211068140461389†L33-L45】.

Use this page for:

- `all-ndcs`
- `local-government-areas`
- `amerindian-areas`
- village/NDC group records

### 4.5 Environmental page

The environmental page gives critical evidence for petroleum and maritime layers. It states:

- The EEZ shapefile was digitized by Guynode from a Flanders Marine Institute shapefile, with **precision not guaranteed**【139409179908986†L90-L95】.
- Petroleum Blocks were created by Guynode using OilNow data and public-domain maps【139409179908986†L96-L102】.
- Exxon and Tullow oil wells were digitized from ExxonMobil maps and other public-domain maps【139409179908986†L103-L108】.

Use this page for:

- `guyana-exclusive-economic-zone`
- petroleum-block records if present in the broader catalog
- maritime-sensitive caveats

## 5. Sensitive Dataset Worklist

### 5.1 Historical and reference records

#### `plantations-and-negro-villages-1860`

**Evidence:** The dataset appears in the historical/reference group as “Plantations and Negro Villages, British Guiana, 1860.” Guynode’s About page states that some shapefiles and maps were digitized from public-domain documents【535471492362637†L49-L57】.

**Recommended metadata:**

- `license`: Public domain / open data
- `sourceType`: Historical / archival
- `authorityLevel`: Low
- `lineage`: Historical map or PDF hosted or referenced by Guynode; likely scanned or digitized from a public-domain historical source.
- `caveats`: Reflects historical colonial-era geography and naming. Not current. Not authoritative for present-day settlement, land ownership, or administrative boundaries.
- `legalUseWarning`: Do not use for present-day legal, land-tenure, planning, or administrative decisions.

#### `georgetown-vintage-town-map-1914`

**Evidence:** The administrative page includes a historic boundary-map section with historical maps of British Guiana and related archive links【137168263236309†L76-L83】. The About page explains that historical maps may be digitized from public-domain documents【535471492362637†L49-L57】.

**Recommended metadata:**

- `license`: Public domain / open data
- `sourceType`: Historical / archival
- `authorityLevel`: Low
- `lineage`: Historical town map hosted or linked by Guynode.
- `caveats`: Shows historic Georgetown conditions, not current administrative or cadastral boundaries.
- `legalUseWarning`: Not suitable for present-day legal or planning determinations.

#### `guyana-suriname-maritime-boundary-dispute`

**Evidence:** The administrative page links to “Background to Guyana / Suriname Boundary Dispute” and identifies it as a short conference paper by Peggy Hoyle, 2001【137168263236309†L72-L76】.

**Recommended metadata:**

- `license`: Unclear from specific item; use Guynode open-data context with caution
- `sourceType`: External reference / secondary document
- `authorityLevel`: Low
- `lineage`: Reference paper linked by Guynode, not a boundary dataset.
- `caveats`: Narrative/legal-history reference. Does not establish a current maritime boundary.
- `legalUseWarning`: Not legal advice or an official boundary source.

### 5.2 National, regional, and local administrative boundaries

#### `guyana-national-boundary`

**Evidence:** The administrative page lists “Guyana, International Boundary” as a shapefile of Guyana’s boundaries as they appear in OpenStreetMap, with OpenStreetMap named as the source【137168263236309†L34-L40】.

**Recommended metadata:**

- `license`: Open data; include OpenStreetMap attribution / ODbL if implemented in code
- `sourceType`: External / digitized from OpenStreetMap
- `authorityLevel`: Medium
- `lineage`: Boundary geometry from OpenStreetMap and hosted by Guynode.
- `caveats`: Community-maintained boundary geometry may differ from official national boundary definitions.
- `legalUseWarning`: Not an official international boundary source.

#### `region-1-boundary`, `region-9-boundary`, and other region boundary records

**Evidence:** The administrative page provides regional maps from the Guyana Lands and Surveys Commission and separate region boundary web map/shapefile entries sourced from OpenStreetMap【137168263236309†L104-L152】.

**Recommended metadata:**

- `license`: Open data / public domain, with original-source attribution
- `sourceType`: Official reference map plus OSM-derived shapefile
- `authorityLevel`: Medium for shapefile; high only for official reference-map image
- `lineage`: Regional PNG/reference maps from Guyana Lands and Surveys Commission; shapefile geometry appears to come from OpenStreetMap.
- `caveats`: Distinguish official map image from digitized/OSM geometry.
- `legalUseWarning`: Verify against official regional boundary sources before legal use.

#### `all-ndcs`, `local-government-areas`, and `region-*_ndcs`

**Evidence:** The local layers page lists NDC boundaries and demographic tables, with the list of NDCs and demographic tables connected to the Bureau of Statistics【211068140461389†L19-L25】. The broader administrative page shows a pattern of combining OpenStreetMap geometry with Bureau of Statistics demographic attributes for regional administrative records【137168263236309†L85-L93】.

**Recommended metadata:**

- `license`: Public domain / open data
- `sourceType`: Official/digitized or derived
- `authorityLevel`: Medium
- `lineage`: NDC names/demographic attributes from Bureau of Statistics; geometry may be digitized or derived from public map sources.
- `caveats`: NDC geometry may not be official or fully current.
- `legalUseWarning`: Do not use as final legal local-government boundary authority.

#### `region-5-villages`

**Evidence:** Guynode’s local layers page includes a villages section and identifies coastal villages and Amerindian areas as shapefile resources【211068140461389†L27-L32】. The broader site context indicates Guynode assembles local-level layers to support planning and climate adaptation work【211068140461389†L33-L45】.

**Recommended metadata:**

- `license`: Public domain / open data
- `sourceType`: Digitized / derived
- `authorityLevel`: Low to medium
- `lineage`: Village layer assembled by Guynode from public local-level sources.
- `caveats`: Village boundaries or locations may be approximate.
- `legalUseWarning`: Not for land-tenure, title, or legal settlement-boundary decisions.

### 5.3 Municipal, town, and constituency records

Applies to:

- `anna-regina-boundary`
- `corriverton-constituencies`
- `georgetown-constituencies`
- `lethem-constituencies`
- `mabaruma-constituencies`
- `mahdia-boundary`
- `rose-hall-constituencies`
- `linden-town-constituencies`
- `bartica-municipality`

**Evidence:** Guynode repeatedly indicates that official shapefiles for some town, census, and constituency boundaries could not be located. For Georgetown, the layer was built from Bureau of Statistics names and GECOM boundaries【137168263236309†L156-L164】. For Linden, the layer was digitized from OpenStreetMap, Google Maps, Bing Maps, and other online maps, and Guynode notes that some boundaries may still need editing【137168263236309†L188-L192】. Other constituency records cite GECOM or GECOM documentation as the source for election or constituency boundaries【137168263236309†L175-L203】.

**Recommended metadata for the group:**

- `license`: Public domain / open data
- `sourceType`: Digitized / derived
- `authorityLevel`: Low to medium
- `lineage`: Digitized by Guynode using GECOM documentation, Bureau of Statistics names, OpenStreetMap, Google Maps, Bing Maps, and other public maps.
- `caveats`: Official GIS shapefiles may not exist or were not located. Some boundaries may need editing. Geometry may be approximate.
- `legalUseWarning`: Not suitable as official constituency, census, municipal, or legal boundary authority.

### 5.4 Amerindian / Indigenous records

#### `amerindian-areas`

**Evidence:** The local layers page lists “Amerindian Areas (shp)” with preview/download links and identifies LandMark as the source【211068140461389†L27-L32】.

**Recommended metadata:**

- `license`: Public domain / open data, with LandMark attribution
- `sourceType`: External / Indigenous land reference
- `authorityLevel`: Low to medium
- `lineage`: Amerindian Areas shapefile sourced from LandMark and hosted by Guynode.
- `caveats`: Indicative Indigenous/community land mapping. Not a legal land-title source.
- `legalUseWarning`: Do not use for legal land claims, title adjudication, territorial rights decisions, or resource-permitting decisions.

#### `amerindian-villages`

**Evidence:** No dedicated page was confirmed in the reviewed pages. The closest evidence is the local layers page’s Amerindian Areas entry sourced from LandMark【211068140461389†L27-L32】 and the site’s broader description of assembling local-level GIS data【211068140461389†L33-L45】.

**Recommended metadata:**

- `license`: Public domain / open data
- `sourceType`: External / digitized / derived
- `authorityLevel`: Low
- `lineage`: Likely derived from Amerindian areas/village reference data or public map sources.
- `caveats`: Source not confirmed from reviewed pages. Treat as approximate until original data source is verified.
- `legalUseWarning`: Not for legal land-rights, settlement-boundary, or title decisions.

### 5.5 Maritime and petroleum records

#### `guyana-exclusive-economic-zone`

**Evidence:** The administrative page says the Guyana EEZ shapefile was digitized by Guynode from a shapefile available at the Flanders Marine Institute【137168263236309†L64-L68】. The environmental page repeats this and explicitly adds: “Precision not guaranteed”【139409179908986†L90-L95】.

**Recommended metadata:**

- `license`: Open data with Flanders Marine Institute attribution
- `sourceType`: External / digitized
- `authorityLevel`: Medium
- `lineage`: Digitized by Guynode from Flanders Marine Institute / Marine Regions shapefile.
- `caveats`: Precision is not guaranteed. Dataset may not reflect the current legally operative maritime boundary.
- `legalUseWarning`: Not for legal maritime boundary, concession, enforcement, or treaty analysis.

#### Petroleum blocks and oil wells, if present in broader catalog

**Evidence:** Petroleum Blocks were created by Guynode using OilNow data and public-domain maps【139409179908986†L96-L102】. Exxon and Tullow oil wells were digitized by Guynode from ExxonMobil maps and other public-domain maps【139409179908986†L103-L108】.

**Recommended metadata:**

- `license`: Public domain / open data, with provider attribution
- `sourceType`: Derived / digitized
- `authorityLevel`: Low to medium
- `lineage`: Compiled by Guynode from OilNow, ExxonMobil, and public-domain maps.
- `caveats`: Approximate. May not reflect current concessions, operations, well status, or regulatory boundaries.
- `legalUseWarning`: Not for legal, investment, operational, concession, or regulatory decisions.

### 5.6 Planning boundary records

#### `silica-city-boundary`

**Evidence:** The prior review found search-result evidence indicating that the Silica City shapefile was digitized by Guynode, with the Ministry of Housing and Water identified as the data source. The directly reviewed planning page provides broader planning context and links to land-use plans and community development plans, but does not provide a fully structured dataset entry for this record【131890562759273†L20-L30】【131890562759273†L45-L63】.

**Recommended metadata:**

- `license`: Public domain / open data, pending direct source confirmation
- `sourceType`: Official/digitized, pending confirmation
- `authorityLevel`: Low to medium
- `lineage`: Likely digitized by Guynode from Ministry of Housing and Water material.
- `caveats`: Source page was not fully accessible in the reviewed evidence. Boundary should be treated as approximate until official planning documentation is verified.
- `legalUseWarning`: Not for legal planning, permitting, zoning, development, land-acquisition, or title decisions.

## 6. Program-Ready Metadata Patterns

### 6.1 Boundary dataset pattern

Use this for most administrative, municipal, NDC, constituency, and village datasets.

```json
{
  "license": "Public domain / open data. Free to use with attribution.",
  "sourceType": "digitized",
  "authorityLevel": "low-to-medium",
  "citationText": "Hosted or compiled by Guynode from public source materials. Credit Guynode and the original source named in the dataset record.",
  "caveats": "Boundary geometry is indicative and may have been digitized from public maps, documents, or third-party basemaps. It may not match official boundary definitions.",
  "legalUseWarning": "Not a legal boundary instrument. Verify with the responsible authority before using for legal, regulatory, cadastral, electoral, planning, or land-tenure decisions."
}
```

### 6.2 Official-source hybrid pattern

Use this where an official source supplies names, demographic tables, or reference maps, but Guynode supplies digitized geometry.

```json
{
  "license": "Public domain / open data. Free to use with attribution.",
  "sourceType": "official/digitized",
  "authorityLevel": "medium",
  "citationText": "Dataset compiled by Guynode using official source attributes or reference maps and digitized boundary geometry.",
  "caveats": "Official attributes or map references may be present, but GIS geometry may be digitized or derived and should be verified before authoritative use.",
  "legalUseWarning": "Do not rely on this record as the final official legal boundary source."
}
```

### 6.3 Historical dataset pattern

Use this for historical maps and archival references.

```json
{
  "license": "Public domain / historical reference, with attribution.",
  "sourceType": "historical",
  "authorityLevel": "low",
  "citationText": "Historical map or document hosted or linked by Guynode. Cite the original archive when available and credit Guynode as the access point.",
  "caveats": "Represents historical conditions and terminology. Not current and not suitable for present-day boundary or planning decisions.",
  "legalUseWarning": "Do not use this historical record for current legal, cadastral, administrative, or land-tenure decisions."
}
```

### 6.4 Indigenous/Amerindian dataset pattern

Use this for Amerindian Areas and Amerindian Villages unless stronger source evidence is found.

```json
{
  "license": "Public domain / open data, with original-source attribution.",
  "sourceType": "external/digitized",
  "authorityLevel": "low-to-medium",
  "citationText": "Hosted by Guynode using Indigenous/community land reference data from the source named in the dataset record.",
  "caveats": "Indicative Indigenous/community land mapping. May not represent legal land title, exact settlement limits, or current government-recognized boundaries.",
  "legalUseWarning": "Do not use for land claims, title adjudication, territorial-rights decisions, resource permitting, or legal boundary determinations."
}
```

### 6.5 Maritime/petroleum dataset pattern

Use this for EEZ, maritime, petroleum block, and oil-well datasets.

```json
{
  "license": "Open data / public domain where applicable, with original-source attribution.",
  "sourceType": "external/digitized",
  "authorityLevel": "low-to-medium",
  "citationText": "Compiled or digitized by Guynode from external maritime, petroleum, corporate, news, or public-domain map sources.",
  "caveats": "Approximate and potentially outdated. Precision may not be guaranteed. May not reflect current legal, regulatory, concession, or operational status.",
  "legalUseWarning": "Not for legal maritime boundary, concession, petroleum-rights, regulatory, enforcement, investment, or operational decisions."
}
```

## 7. Dataset-to-Pattern Mapping

| Dataset group | Apply pattern |
|---|---|
| National boundary | Boundary dataset |
| Regional boundaries | Official-source hybrid |
| NDCs | Official-source hybrid |
| Local government areas | Official-source hybrid |
| Municipal/town boundaries | Boundary dataset |
| Constituencies | Boundary dataset |
| Amerindian areas | Indigenous/Amerindian |
| Amerindian villages | Indigenous/Amerindian |
| Historic maps | Historical dataset |
| EEZ | Maritime/petroleum |
| Boundary dispute reference | Historical/reference |
| Silica City | Planning boundary |

## 8. Implementation Notes for Repo Enrichment

1. **Do not overstate authority.** If the site says Guynode digitized or derived a layer, the metadata should say that clearly.
2. **Do not treat Guynode as the original source when another provider is named.** Use Guynode as the host/compiler and the named provider as the original data source.
3. **Keep caveats visible in the UI.** Sensitive boundary datasets need human-readable caveats, not just hidden metadata.
4. **Use source-specific attribution.** OpenStreetMap, Bureau of Statistics, GECOM, Flanders Marine Institute, LandMark, OilNow, ExxonMobil, Guyana Lands and Surveys Commission, and Ministry of Housing and Water should be credited where applicable.
5. **Separate legal warning from general caveat.** The caveat explains data quality and provenance. The legal-use warning explains what users must not rely on the dataset for.
6. **Mark unconfirmed records.** For datasets where the exact source page was not directly accessible, use `needs-review` and add a `verificationNote` rather than pretending the source was confirmed, because apparently that still has to be said.

## 9. Remaining Gaps

The compiled evidence is enough to enrich many metadata fields, but some records still need direct confirmation before being treated as complete.

| Gap | Affected records |
|---|---|
| Dedicated page not found | `amerindian-villages` |
| Source only partly confirmed | `silica-city-boundary` |
| Exact original archive unclear | `plantations-and-negro-villages-1860` |
| Legal licence of source unclear | dispute paper, some historic maps |
| Geometry currency unclear | most digitized boundaries |

## 10. Recommended Next Step

Use this document as the evidence bank for a repo-side metadata update pass. The practical workflow is:

1. Add global defaults for license, attribution, caveat, and legal-use warning.
2. Apply dataset-pattern templates by category.
3. Override fields with source-specific evidence where the reviewed pages provide it.
4. Keep `needs-review` for records with incomplete source confirmation.
5. Re-run the metadata audit and compare warning reduction.

This should materially reduce the audit’s missing-license, missing-citation, missing-caveat, and sensitive-missing-authority warnings while keeping the metadata honest about uncertainty. Miraculous, really: the software can be improved by not lying to it.
