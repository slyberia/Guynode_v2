import React, { useState } from "react";
import { logEntries, LogEntry } from "../data/logEntries";

const riskBadgeClasses: Record<string, string> = {
  LOW: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/40",
  MEDIUM: "bg-yellow-500/10 text-yellow-300 border border-yellow-500/40",
  HIGH: "bg-red-500/10 text-red-400 border border-red-500/40",
};

const InternalLogPage: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sortedEntries = [...logEntries].sort((a, b) =>
    a.date < b.date ? 1 : -1
  );

  const handleToggle = (id: string) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const renderRiskBadge = (entry: LogEntry) => {
    if (!entry.riskLevel) return null;
    const cls = riskBadgeClasses[entry.riskLevel] ?? "";
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}
      >
        {entry.riskLevel} RISK
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <header className="space-y-2 border-b border-white/10 pb-6">
          <h1 className="text-2xl font-bold font-serif tracking-tight text-white">
            Internal Development Log
          </h1>
          <p className="text-sm text-gray-400">
            Chronological record of structural changes, design decisions, and
            AI-assisted iterations for the GuyNode Data Portal.
          </p>
          <div className="inline-block bg-white/5 border border-white/10 rounded px-3 py-1 mt-2">
            <p className="text-xs text-gray-500 font-mono">
              INTERNAL VIEW • PORTFOLIO ARTIFACT
            </p>
          </div>
        </header>

        <div className="space-y-4">
          {sortedEntries.map((entry) => {
            const isExpanded = expandedId === entry.id;
            return (
              <article
                key={entry.id}
                className="border border-white/10 rounded-xl bg-bloom-card/50 hover:border-white/20 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => handleToggle(entry.id)}
                  className="w-full text-left px-4 py-3 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-guyana-gold">
                        {entry.date}
                      </span>
                      {renderRiskBadge(entry)}
                      {entry.isPublic && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white border border-white/10">
                          PUBLIC
                        </span>
                      )}
                    </div>
                    <h2 className="text-sm sm:text-base font-bold text-white">
                      {entry.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-400 line-clamp-2">
                      {entry.summary}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {entry.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-black/50 text-gray-500 border border-white/5"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-1 flex-shrink-0 text-xs text-gray-500">
                    {isExpanded ? "▲" : "▼"}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-white/10 text-sm space-y-6">
                    <section className="space-y-2">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Implementation Details
                      </h3>
                      <div className="whitespace-pre-wrap text-xs text-gray-300 bg-black/40 border border-white/10 rounded-lg p-3 font-mono leading-relaxed">
                        {entry.details}
                      </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <section className="space-y-2">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                          Affected Files
                        </h3>
                        <ul className="text-xs text-guyana-gold space-y-1 font-mono bg-black/40 border border-white/10 rounded-lg p-3">
                          {entry.affectedFiles.map((file) => (
                            <li key={file} className="break-all">• {file}</li>
                          ))}
                        </ul>
                      </section>

                      {entry.promptsUsed && entry.promptsUsed.length > 0 && (
                        <section className="space-y-2">
                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                            AI Prompts
                          </h3>
                          <ul className="text-xs text-gray-300 space-y-1 bg-black/40 border border-white/10 rounded-lg p-3">
                            {entry.promptsUsed.map((p) => (
                              <li key={p}>• {p}</li>
                            ))}
                          </ul>
                        </section>
                      )}
                    </div>

                    <section className="space-y-2">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Public Summary
                      </h3>
                      <p className="text-xs text-gray-300 bg-white/5 border border-white/10 rounded-lg p-3 italic">
                        "{entry.publicSummary}"
                      </p>
                    </section>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InternalLogPage;