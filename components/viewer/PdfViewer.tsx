import React, { useState } from 'react';
import { Dataset } from '../../types';
import { safeUrl } from '../../utils/url';

interface PdfViewerProps {
  dataset: Dataset;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ dataset }) => {
  const [loadError, setLoadError] = useState(false);
  const url = dataset.downloadUrl ? safeUrl(dataset.downloadUrl) : null;

  return (
    <div className="flex flex-col h-full bg-gn-surface dark:bg-gn-surface-dark border-b border-gn-border dark:border-white/10">
      {/* PDF Embed */}
      <div className="flex-1 min-h-[600px]">
        {url && !loadError ? (
          <iframe
            src={url}
            title={dataset.title}
            className="w-full h-full min-h-[600px] border-none"
            onError={() => setLoadError(true)}
          />
        ) : (
          <div className="w-full min-h-[600px] flex flex-col items-center justify-center gap-4 bg-gn-surface-muted dark:bg-gn-surface-muted-dark text-gn-foreground-muted dark:text-gn-foreground-muted-dark font-mono text-sm p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10,9 9,9 8,9"/>
            </svg>
            <p>&gt; PDF preview unavailable in this browser.</p>
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-green-600 dark:text-gn-accent-gold underline hover:no-underline"
              >
                Open PDF directly →
              </a>
            )}
          </div>
        )}
      </div>

      {/* Caption bar */}
      <div className="px-4 py-3 flex items-center justify-between gap-4 bg-gn-surface-muted dark:bg-gn-surface-muted-dark border-t border-gn-border dark:border-white/10">
        <div className="min-w-0">
          <p className="text-xs font-bold text-gn-foreground dark:text-gn-foreground-dark truncate">{dataset.title}</p>
          <p className="text-[10px] text-gn-foreground-muted dark:text-gn-foreground-muted-dark truncate">{dataset.source}</p>
        </div>
        {url && (
          <a
            href={url}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded bg-brand-green-600 hover:bg-brand-green-500 dark:bg-gn-accent-secondary dark:hover:bg-blue-600 text-white transition-colors uppercase tracking-widest"
          >
            Download PDF
          </a>
        )}
      </div>
    </div>
  );
};
