import React from 'react';
import { Dataset } from '../types';
import { safeUrl } from '../utils/url';

/**
 * DatasetTrustPanel
 *
 * Surfaces the provenance / trust metadata enriched in Phase 1 (Prompt 1.6):
 * authorityLevel, sourceType, attribution, sourceUrl, caveats,
 * knownLimitations, and legalUseWarning. Renders only fields the record
 * actually carries — no fabricated values. Free-text fields are rendered as
 * text (never HTML), so no sanitizer pass is required.
 */

const AUTHORITY_LABELS: Record<string, string> = {
  official: 'Official',
  'reference-only': 'Reference only',
  'indicative-only': 'Indicative only',
  'needs-review': 'Needs review',
  unknown: 'Unknown',
};

const Chip: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-1 rounded border border-cream-300 dark:border-white/10 bg-white/60 dark:bg-white/5 text-ink-700 dark:text-gray-300">
    <span className="text-ink-500 dark:text-gray-500">{label}:</span> {value}
  </span>
);

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col sm:flex-row sm:gap-2 text-sm">
    <span className="font-bold text-ink-500 dark:text-gray-400 sm:w-32 shrink-0">{label}</span>
    <span className="text-ink-800 dark:text-gray-200 break-words">{children}</span>
  </div>
);

export const DatasetTrustPanel: React.FC<{ dataset: Dataset }> = ({ dataset }) => {
  const {
    authorityLevel,
    sourceType,
    attribution,
    sourceUrl,
    license,
    caveats,
    knownLimitations,
    legalUseWarning,
  } = dataset;

  const sourceHref = sourceUrl ? safeUrl(sourceUrl) : null;
  const hasCaveats = Array.isArray(caveats) && caveats.length > 0;
  const hasLimitations = Array.isArray(knownLimitations) && knownLimitations.length > 0;

  return (
    <div className="mb-6 bg-white/50 dark:bg-black/20 rounded-lg p-4 border border-cream-300 dark:border-white/10">
      <h3 className="text-xs font-bold text-ink-500 dark:text-gray-400 uppercase tracking-widest mb-3">
        Provenance &amp; Usage
      </h3>

      {/* Legal-use warning — prominent callout, not a footnote. */}
      {legalUseWarning && (
        <div
          role="note"
          className="mb-3 flex gap-2 text-sm rounded border border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200 px-3 py-2"
        >
          <span aria-hidden="true" className="font-bold">⚠</span>
          <span>
            <span className="font-bold uppercase text-[11px] tracking-wider">Legal use:</span>{' '}
            {legalUseWarning}
          </span>
        </div>
      )}

      {(authorityLevel || sourceType) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {authorityLevel && (
            <Chip label="Authority" value={AUTHORITY_LABELS[authorityLevel] ?? authorityLevel} />
          )}
          {sourceType && <Chip label="Source type" value={sourceType} />}
        </div>
      )}

      <div className="flex flex-col gap-1.5 mb-1">
        {/* License: site-level evidence only is NOT a dataset-level license.
            Show an honest "needs review" state rather than implying confirmation. */}
        <Row label="License">
          {license || (
            <span className="text-ink-500 dark:text-gray-500 italic">Not yet confirmed (needs review)</span>
          )}
        </Row>
      </div>

      {(attribution || sourceHref || hasCaveats || hasLimitations) && (
        <details className="mt-3 group">
          <summary className="text-[11px] font-bold text-ink-500 dark:text-gray-400 uppercase tracking-wider mb-2 cursor-pointer hover:text-ink-800 dark:hover:text-gray-200 transition-colors select-none list-none flex items-center gap-1">
            <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            Show Technical Details
          </summary>
          <div className="pl-4 border-l-2 border-cream-300 dark:border-white/10 space-y-3 pt-1">
            <div className="flex flex-col gap-1.5">
              {attribution && <Row label="Attribution">{attribution}</Row>}
              {sourceHref && (
                <Row label="Source page">
                  <a
                    href={sourceHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-green-600 dark:text-gn-accent-secondary underline hover:no-underline break-all"
                  >
                    {sourceUrl}
                  </a>
                </Row>
              )}
            </div>

            {hasCaveats && (
              <div>
                <h4 className="text-[10px] font-bold text-ink-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Caveats
                </h4>
                <ul className="list-disc list-inside text-sm text-ink-800 dark:text-gray-200 space-y-0.5">
                  {caveats!.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {hasLimitations && (
              <div>
                <h4 className="text-[10px] font-bold text-ink-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Known limitations
                </h4>
                <ul className="list-disc list-inside text-sm text-ink-800 dark:text-gray-200 space-y-0.5">
                  {knownLimitations!.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
};
