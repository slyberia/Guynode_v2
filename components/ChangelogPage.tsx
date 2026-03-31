
import React from 'react';
import { logEntries } from '../data/logEntries';

export const ChangelogPage: React.FC = () => {
  const publicEntries = logEntries
    .filter((entry) => entry.isPublic)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div className="min-h-screen bg-gn-surface dark:bg-gn-surface-dark text-gn-foreground dark:text-gn-foreground-dark transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <header className="space-y-4 border-b border-gn-border dark:border-gn-border-dark pb-8">
          <h1 className="text-3xl font-serif font-bold tracking-tight text-gn-foreground dark:text-gn-foreground-dark">
            Changelog
          </h1>
          <p className="text-gn-foreground-muted dark:text-gn-foreground-muted-dark">
            High-level updates to the GuyNode Data Portal. This view focuses on
            user-visible improvements and major structural milestones.
          </p>
        </header>

        <div className="space-y-6">
          {publicEntries.map((entry) => (
            <article
              key={entry.id}
              className="group border border-gn-border dark:border-gn-border-dark rounded-xl bg-gn-elevated dark:bg-gn-elevated-dark p-6 hover:border-gn-foreground-muted dark:hover:border-white/20 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-guyana-gold">
                      {entry.date}
                    </span>
                    {entry.version && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gn-surface dark:bg-white/10 text-gn-foreground dark:text-white border border-gn-border dark:border-white/10">
                        v{entry.version}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-gn-foreground dark:text-white group-hover:text-gn-accent-blue transition-colors">
                    {entry.title}
                  </h2>
                </div>
              </div>

              <p className="text-sm text-gn-foreground-muted dark:text-gray-300 leading-relaxed mb-4">
                {entry.publicSummary}
              </p>

              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider bg-gn-surface dark:bg-black/50 text-gn-foreground-muted dark:text-gray-500 border border-gn-border dark:border-white/5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}

          {publicEntries.length === 0 && (
            <div className="p-8 text-center text-gn-foreground-muted dark:text-gray-500 border border-gn-border dark:border-white/10 rounded-lg border-dashed">
              No public changelog entries are available yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
