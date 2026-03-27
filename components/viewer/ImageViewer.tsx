import React, { useState } from 'react';
import { Dataset } from '../../types';
import { safeUrl } from '../../utils/url';

interface ImageViewerProps {
  dataset: Dataset;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ dataset }) => {
  const [imgError, setImgError] = useState(false);

  const src = !imgError && dataset.downloadUrl
    ? safeUrl(dataset.downloadUrl) ?? '/images/dataset-placeholder.jpg'
    : '/images/dataset-placeholder.jpg';

  return (
    <div className="flex flex-col h-full bg-gn-surface dark:bg-gn-surface-dark border-b border-gn-border dark:border-white/10">
      <div className="flex-1 flex items-center justify-center overflow-hidden bg-black/5 dark:bg-black/40 min-h-[240px]">
        <img
          src={src}
          alt={dataset.title}
          onError={() => setImgError(true)}
          className="max-w-full max-h-full object-contain"
        />
      </div>
      <div className="px-4 py-3 flex items-center justify-between gap-4 bg-gn-surface dark:bg-gn-surface-dark border-t border-gn-border dark:border-white/10">
        <div className="min-w-0">
          <p className="text-xs font-bold text-gn-foreground dark:text-gn-foreground-dark truncate">{dataset.title}</p>
          <p className="text-[10px] text-gn-foreground-muted dark:text-gn-foreground-muted-dark truncate">{dataset.source}</p>
        </div>
        {dataset.downloadUrl && safeUrl(dataset.downloadUrl) && (
          <a
            href={safeUrl(dataset.downloadUrl)!}
            download
            className="flex-shrink-0 bg-brand-green-600 hover:bg-brand-green-500 text-white text-xs font-bold px-4 py-2 rounded transition-colors uppercase tracking-widest"
          >
            Download
          </a>
        )}
      </div>
    </div>
  );
};
