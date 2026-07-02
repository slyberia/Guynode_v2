import React, { useEffect, useState } from 'react';
import { Dataset, TablePreview } from '../../types';
import { safeUrl } from '../../utils/url';

interface TableViewerProps {
  dataset: Dataset;
}

/**
 * Renders a bounded tabular preview (extracted offline to /data/tables/*.json)
 * for CSV/XLSX datasets. Fetches the local preview JSON — same-origin, so no
 * CORS dependency on the remote source file.
 */
export const TableViewer: React.FC<TableViewerProps> = ({ dataset }) => {
  const [loaded, setLoaded] = useState<{ url: string; preview: TablePreview } | null>(null);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const url = dataset.tablePreviewUrl ? safeUrl(dataset.tablePreviewUrl) : null;

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: TablePreview) => {
        if (!cancelled) setLoaded({ url, preview: data });
      })
      .catch(() => {
        if (!cancelled) setFailedUrl(url);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  // Derived (avoids resetting state synchronously when the dataset changes).
  const preview = loaded && loaded.url === url ? loaded.preview : null;
  const error = !url || failedUrl === url;

  const downloadUrl = dataset.downloadUrl ? safeUrl(dataset.downloadUrl) : null;

  return (
    <div className="flex flex-col h-full bg-gn-surface dark:bg-gn-surface-dark border-b border-gn-border dark:border-white/10">
      <div className="flex-1 overflow-auto min-h-[240px]">
        {error ? (
          <div className="w-full h-full flex items-center justify-center p-6 text-center text-gn-foreground-muted dark:text-gn-foreground-muted-dark font-mono text-xs">
            Table preview unavailable for this dataset.
          </div>
        ) : !preview ? (
          <div className="w-full h-full flex items-center justify-center p-6 text-gn-foreground-muted dark:text-gn-foreground-muted-dark font-mono text-xs animate-pulse">
            &gt; Loading table preview…
          </div>
        ) : (
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead className="sticky top-0">
              <tr className="bg-gn-surface-muted dark:bg-black/40 text-brand-green-600 dark:text-gn-accent-gold">
                {preview.columns.map((col, i) => (
                  <th key={i} className="py-2 px-4 border-b border-gn-border dark:border-white/20 uppercase whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gn-border dark:divide-white/5 text-gn-foreground dark:text-gray-300">
              {preview.rows.map((row, r) => (
                <tr key={r} className="hover:bg-gn-surface-muted dark:hover:bg-white/5">
                  {preview.columns.map((_, c) => (
                    <td key={c} className="py-1.5 px-4 truncate max-w-xs">{row[c] === null ? '' : String(row[c])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Caption / provenance bar */}
      <div className="px-4 py-3 flex items-center justify-between gap-4 bg-gn-surface-muted dark:bg-gn-surface-muted-dark border-t border-gn-border dark:border-white/10">
        <div className="min-w-0">
          <p className="text-xs font-bold text-gn-foreground dark:text-gn-foreground-dark truncate">{dataset.title}</p>
          <p className="text-[10px] text-gn-foreground-muted dark:text-gn-foreground-muted-dark truncate">
            {preview
              ? `Showing ${preview.previewRows} of ${preview.totalRows} rows${preview.truncated ? ' — download for the full dataset' : ''}`
              : dataset.source}
          </p>
        </div>
        {downloadUrl && (
          <a
            href={downloadUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded bg-brand-green-600 hover:bg-brand-green-500 dark:bg-gn-accent-secondary dark:hover:bg-blue-600 text-white transition-colors uppercase tracking-widest"
          >
            Download
          </a>
        )}
      </div>
    </div>
  );
};
