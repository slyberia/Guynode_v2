export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface LogEntry {
  id: string;
  date: string; // ISO date string
  title: string;
  summary: string; // internal summary
  details: string; // internal narrative
  affectedFiles: string[];
  tags: string[];
  riskLevel?: RiskLevel;
  promptsUsed?: string[];
  version?: string;
  publicSummary: string; // safe, public-facing description
  isPublic: boolean;
}

export const logEntries: LogEntry[] = [
  {
    id: "2025-12-02-admin-access-gateway",
    date: "2025-12-02",
    title: "Admin Access Gateway and Triage Prompt Library",
    summary: "Implemented a gated Admin Dashboard and initial Triage Prompt Library to formalize internal diagnostic workflows.",
    details: [
      "• Created AdminAccessPage with a password gate ('guylegend') and URL bypass (?adminOverride=1) for dev convenience.",
      "• Redirected the 'Partner Access' nav button to the new Admin gateway.",
      "• Established the TriagePromptLibraryPage as a central repository for standard diagnostic prompt bundles.",
      "• Updated App.tsx routing to support 'ADMIN_ACCESS' and 'TRIAGE_PROMPT_LIBRARY' view states."
    ].join("\n"),
    affectedFiles: [
      "/components/admin/AdminAccessPage.tsx",
      "/components/admin/TriagePromptLibraryPage.tsx",
      "/components/Navigation.tsx",
      "/App.tsx",
      "/data/logEntries.ts"
    ],
    tags: ["admin", "security", "workflow", "triage"],
    riskLevel: "MEDIUM",
    promptsUsed: [
      "Task 1 — Admin Access Flow",
      "Task 3 — Triage Prompt Library"
    ],
    version: "0.3.1",
    publicSummary: "Enhanced internal administrative tools to support better maintenance and system diagnostics.",
    isPublic: true
  },
  {
    id: "2025-12-02-blog-module-1",
    date: "2025-12-02",
    title: "Blog System - Module 1 (Data & Content Model)",
    summary: "Established the foundational data model, types, and utility helpers for the new Blog system.",
    details: [
      "• Created shared TypeScript interfaces for BlogPost, BlogCategory, and BlogArchiveBucket in /data/blogTypes.ts.",
      "• Implemented a static content source in /data/blogPosts.ts with 5 seed posts relevant to GuyNode themes.",
      "• Added a utility library /utils/blogHelpers.ts for robust data fetching (by slug, category, date buckets).",
      "• This module provides the backend-agnostic data layer required for the upcoming UI implementation."
    ].join("\n"),
    affectedFiles: [
      "/data/blogTypes.ts",
      "/data/blogPosts.ts",
      "/utils/blogHelpers.ts"
    ],
    tags: ["blog", "architecture", "data-model"],
    riskLevel: "LOW",
    promptsUsed: [
      "Module 1 – Data & Content Model"
    ],
    version: "0.3.0",
    publicSummary: "Laid the groundwork for the new GuyNode Blog, including the data structure and initial content set.",
    isPublic: true
  },
  {
    id: "2025-12-01-catalog-map-preview",
    date: "2025-12-01",
    title: "Catalog Page - Embedded Map Preview and Filtering",
    summary:
      "Implemented an enhanced Data Catalog layout with Leaflet map preview, category filtering, and refined dark-mode styling.",
    details: [
      "• Refactored the Catalog page layout into a two-column structure: dataset list (left) and details + map preview (right).",
      "• Integrated Leaflet for dataset-level GeoJSON preview, with a toggle to show/hide the map panel and basic error handling.",
      "• Added category chip filtering and improved dataset metadata display (status, format, updated date, authority).",
      "• Ensured Tailwind-based responsive behavior and alignment with the terminal-style aesthetic."
    ].join("\n"),
    affectedFiles: [
      "/components/Catalog.tsx",
      "/components/CatalogMapPreview.tsx",
      "/data/datasets.ts"
    ],
    tags: ["catalog", "map-preview", "ui", "leaflet"],
    riskLevel: "MEDIUM",
    promptsUsed: [
      "Gemini: Enhance Data Catalog with Leaflet map preview and category filtering."
    ],
    version: "0.2.0",
    publicSummary:
      "Improved the Data Catalog with a cleaner layout, better metadata display, and an optional map preview so users can quickly visualize a layer before downloading.",
    isPublic: true
  },
  {
    id: "2025-12-01-logging-protocol",
    date: "2025-12-01",
    title: "Introduced Guynode Studio Logging Protocol and Log Pages",
    summary:
      "Defined the Logging Mandate (L-1), created a shared LogEntry type, and added internal and public-facing log views.",
    details: [
      "• Added the L-1 Logging Mandate to the Guynode Studio Protocol, defining how changes and reasoning are captured.",
      "• Created a strongly typed LogEntry interface and a shared /data/logEntries.ts source of truth.",
      "• Planned two views: an internal Log page for full entries (details, prompts, risk) and a public Changelog using filtered, visitor-safe summaries.",
      "• Ensured all future logging-related components follow the same React + TSX + Tailwind conventions."
    ].join("\n"),
    affectedFiles: [
      "/data/logEntries.ts",
      "/components/InternalLogPage.tsx",
      "/components/ChangelogPage.tsx"
    ],
    tags: ["logging", "protocol", "changelog", "meta"],
    riskLevel: "LOW",
    promptsUsed: [
      "Gemini: Integrate Logging Mandate and design Log + Changelog pages."
    ],
    version: "0.2.1",
    publicSummary:
      "Added the foundation for an internal development log and a public changelog so visitors and collaborators can see how Guynode evolves over time.",
    isPublic: true
  }
];

export const getLogEntriesByIds = (ids: string[]): LogEntry[] => {
  if (!ids || ids.length === 0) return [];
  const validIds = new Set(ids);
  return logEntries
    .filter((entry) => validIds.has(entry.id))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
};