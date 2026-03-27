
import React, { useState, useMemo } from 'react';
import { ViewState } from '../types';
import { useCatalog } from '../context/CatalogContext';

import { RouteParams } from '../utils/routing';

interface AnalysisPageProps {
  navigate: (view: ViewState, params?: RouteParams) => void;
}

export const AnalysisPage: React.FC<AnalysisPageProps> = ({ navigate }) => {
  const { analyses, loading, error } = useCatalog();
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');

  const filteredEntries = useMemo(() => {
    return analyses.filter(entry => {
      const matchSearch = entry.title.toLowerCase().includes(search.toLowerCase()) ||
                          entry.summary.toLowerCase().includes(search.toLowerCase());
      const matchLevel = levelFilter === 'ALL' || entry.level === levelFilter;
      return matchSearch && matchLevel;
    });
  }, [search, levelFilter, analyses]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'policy-brief': return 'text-guyana-gold border-guyana-gold/30 bg-guyana-gold/10';
      case 'technical': return 'text-bloom-accent border-bloom-accent/30 bg-bloom-accent/10';
      case 'overview': return 'text-green-400 border-green-500/30 bg-green-500/10';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gn-surface dark:bg-gn-surface-dark flex items-center justify-center text-gn-foreground dark:text-gn-foreground-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-brand-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-mono text-sm">Loading analyses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gn-surface dark:bg-gn-surface-dark flex items-center justify-center text-gn-foreground dark:text-gn-foreground-dark p-6">
        <div className="bg-red-900/10 border border-red-500/30 rounded p-6 max-w-md text-center">
          <h2 className="text-red-500 font-bold mb-2">Failed to Load Analyses</h2>
          <p className="text-sm mb-4">{error}</p>
          <button
            onClick={() => navigate('HOME')}
            className="bg-brand-green-600 hover:bg-brand-green-500 text-white font-bold py-2 px-6 rounded transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="min-h-screen bg-gn-surface dark:bg-gn-surface-dark flex items-center justify-center text-gn-foreground dark:text-gn-foreground-dark p-6">
        <div className="text-center">
           <h1 className="text-3xl font-serif font-bold mb-4">Analysis & Reports</h1>
           <p className="text-gn-foreground-muted dark:text-gn-foreground-muted-dark mb-8">
             Check back later for new analyses derived from the GuyNode data lake.
           </p>
           <button
             onClick={() => navigate('HOME')}
             className="bg-brand-green-600 hover:bg-brand-green-500 text-white font-bold py-2 px-6 rounded transition-colors"
           >
             Return to Dashboard
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gn-surface dark:bg-gn-surface-dark text-gn-foreground dark:text-gn-foreground-dark pt-20 px-6 pb-20">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="border-b border-gn-border dark:border-gn-border-dark pb-8">
           <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Analysis & Reports</h1>
           <p className="text-xl text-gn-foreground-muted dark:text-gn-foreground-muted-dark max-w-3xl leading-relaxed">
             Official data-driven insights derived from the GuyNode catalog. 
             Explore spatial studies on agriculture, urban planning, and environmental monitoring.
           </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div className="flex gap-2">
            <button 
              onClick={() => setLevelFilter('ALL')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${levelFilter === 'ALL' ? 'bg-gn-surface-elevated dark:bg-gn-surface-elevated-dark text-gn-foreground dark:text-gn-foreground-dark border-gn-border dark:border-gn-border-dark' : 'text-gn-foreground-muted dark:text-gn-foreground-muted-dark border-gn-border dark:border-gn-border-dark hover:text-gn-foreground dark:hover:text-gn-foreground-dark'}`}
            >
              All Levels
            </button>
            {['overview', 'technical', 'policy-brief'].map(l => (
               <button 
                 key={l}
                 onClick={() => setLevelFilter(l)}
                 className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors uppercase ${levelFilter === l ? 'bg-bloom-accent text-white border-bloom-accent' : 'text-gn-foreground-muted dark:text-gn-foreground-muted-dark border-gn-border dark:border-gn-border-dark hover:text-gn-foreground dark:hover:text-gn-foreground-dark'}`}
               >
                 {l}
               </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
             <input 
               type="text" 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               placeholder="Search analysis..."
               className="w-full bg-gn-surface-muted dark:bg-gn-surface-muted-dark border border-gn-border dark:border-gn-border-dark rounded px-4 py-2 text-sm text-gn-foreground dark:text-gn-foreground-dark focus:outline-none focus:border-guyana-gold"
             />
             <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-500 pointer-events-none">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
             </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEntries.map(entry => (
            <div key={entry.id} className="group bg-gn-surface-elevated dark:bg-gn-surface-elevated-dark border border-gn-border dark:border-gn-border-dark rounded-xl overflow-hidden hover:border-gn-foreground-muted transition-all flex flex-col h-full">
               {entry.heroImageUrl && (
                 <div className="h-48 overflow-hidden relative">
                    <img src={entry.heroImageUrl} alt={entry.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                    <div className="absolute top-4 left-4">
                       <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider backdrop-blur-md ${getLevelColor(entry.level)}`}>
                         {entry.level}
                       </span>
                    </div>
                 </div>
               )}
               
               <div className="p-6 flex flex-col flex-1">
                  <div className="flex gap-2 mb-3 flex-wrap">
                     {entry.tags.map(tag => (
                       <span key={tag} className="text-[10px] text-gn-foreground-muted dark:text-gn-foreground-muted-dark font-mono">#{tag}</span>
                     ))}
                  </div>
                  
                  <h3 className="text-xl font-bold text-gn-foreground dark:text-gn-foreground-dark mb-3 group-hover:text-guyana-gold transition-colors leading-tight">
                    {entry.title}
                  </h3>
                  
                  <p className="text-sm text-gn-foreground-muted dark:text-gn-foreground-muted-dark mb-6 line-clamp-3 flex-grow leading-relaxed">
                    {entry.summary}
                  </p>
                  
                  <div className="flex items-center justify-between border-t border-gn-border dark:border-gn-border-dark pt-4 mt-auto">
                     <span className="text-xs text-gn-foreground-muted dark:text-gn-foreground-muted-dark font-bold">{new Date(entry.publishedAt).toLocaleDateString()}</span>
                     <button 
                       onClick={() => navigate('ANALYSIS', { analysisId: entry.slug })}
                       className="text-xs font-bold text-gn-foreground dark:text-gn-foreground-dark bg-gn-surface-muted dark:bg-gn-surface-muted-dark hover:bg-gn-surface dark:hover:bg-gn-surface-dark px-4 py-2 rounded transition-colors"
                     >
                       View Report
                     </button>
                  </div>
               </div>
            </div>
          ))}
          
          {filteredEntries.length === 0 && (
             <div className="col-span-full py-20 text-center text-gn-foreground-muted dark:text-gn-foreground-muted-dark border border-gn-border dark:border-gn-border-dark border-dashed rounded-lg">
                No analyses found matching your criteria.
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
