
import React, { useState } from 'react';
import { Dataset } from '../../types';
import { GeoStats } from '../../utils/geojsonValidator';

interface ViewerSidebarProps {
  dataset: Dataset | null;
  quickStats: GeoStats | null;
  onClose?: () => void;
  onViewCatalog: (id: string) => void;
}

export const ViewerSidebar: React.FC<ViewerSidebarProps> = ({ dataset, quickStats, onViewCatalog }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!dataset) return null;

  if (!isOpen) {
    return (
       <button 
         onClick={() => setIsOpen(true)}
         className="absolute top-20 left-6 z-[1000] bg-white/90 dark:bg-black/90 text-gn-foreground dark:text-white p-2 rounded border border-gn-border dark:border-white/10 hover:bg-gn-border dark:hover:bg-white/10 transition-colors animate-in fade-in"
       >
         <span className="text-xs font-bold writing-vertical-rl rotate-180 py-2">METADATA</span>
       </button>
    );
  }

  return (
    <div className="absolute top-20 left-6 z-[1000] bg-white/90 dark:bg-black/90 backdrop-blur border border-gn-border dark:border-white/10 rounded-lg w-80 shadow-2xl flex flex-col max-h-[80vh] animate-in slide-in-from-left-4">
      
      {/* Header */}
      <div className="p-4 border-b border-gn-border dark:border-white/10 flex justify-between items-start">
         <div>
            <span className="text-[10px] font-bold text-brand-gold-600 dark:text-guyana-gold uppercase tracking-widest">{dataset.category}</span>
            <h3 className="text-lg font-serif font-bold text-gn-foreground dark:text-white leading-tight mt-1">{dataset.title}</h3>
         </div>
         <button onClick={() => setIsOpen(false)} className="text-gn-foreground-muted dark:text-gray-500 hover:text-gn-foreground dark:hover:text-white">✕</button>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto custom-scrollbar space-y-6">
        
        {/* Description */}
        <div>
           <p className="text-xs text-gn-foreground-muted dark:text-gray-300 leading-relaxed">{dataset.description}</p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-gn-surface-muted dark:bg-white/5 rounded p-2 border border-gn-border dark:border-white/5">
              <div className="text-[9px] text-gn-foreground-muted dark:text-gray-500 uppercase mb-1">Source</div>
              <div className="text-xs text-gn-foreground dark:text-white font-semibold truncate" title={dataset.source}>{dataset.source}</div>
           </div>
           <div className="bg-gn-surface-muted dark:bg-white/5 rounded p-2 border border-gn-border dark:border-white/5">
              <div className="text-[9px] text-gn-foreground-muted dark:text-gray-500 uppercase mb-1">Updated</div>
              <div className="text-xs text-gn-foreground dark:text-white font-semibold">{new Date(dataset.lastUpdated).toLocaleDateString()}</div>
           </div>
           <div className="bg-gn-surface-muted dark:bg-white/5 rounded p-2 border border-gn-border dark:border-white/5">
              <div className="text-[9px] text-gn-foreground-muted dark:text-gray-500 uppercase mb-1">Format</div>
              <div className="text-xs text-gn-foreground dark:text-white font-semibold">{dataset.format}</div>
           </div>
           <div className="bg-gn-surface-muted dark:bg-white/5 rounded p-2 border border-gn-border dark:border-white/5">
              <div className="text-[9px] text-gn-foreground-muted dark:text-gray-500 uppercase mb-1">Size</div>
              <div className="text-xs text-gn-foreground dark:text-white font-semibold">{dataset.size}</div>
           </div>
        </div>

        {/* Live Stats */}
        {quickStats && (
           <div className="border-t border-gn-border dark:border-white/10 pt-4">
              <h4 className="text-[10px] font-bold text-gn-foreground-muted dark:text-gray-400 uppercase mb-2">Live Layer Stats</h4>
              <div className="flex gap-4">
                 <div className="text-center">
                    <div className="text-lg font-mono text-brand-green-600 dark:text-bloom-accent font-bold">{quickStats.featureCount}</div>
                    <div className="text-[9px] text-gn-foreground-muted dark:text-gray-500">FEATURES</div>
                 </div>
                 <div className="text-center">
                    <div className="text-lg font-mono text-gn-foreground dark:text-white font-bold">{quickStats.geometryTypes.length}</div>
                    <div className="text-[9px] text-gn-foreground-muted dark:text-gray-500">TYPES</div>
                 </div>
                 <div className="text-center">
                    <div className={`text-lg font-mono font-bold ${quickStats.performanceRisk === 'LOW' ? 'text-brand-green-600 dark:text-green-500' : 'text-brand-gold-600 dark:text-yellow-500'}`}>
                       {quickStats.performanceRisk}
                    </div>
                    <div className="text-[9px] text-gn-foreground-muted dark:text-gray-500">RISK</div>
                 </div>
              </div>
           </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
           <button 
             onClick={() => onViewCatalog(dataset.id)}
             className="w-full bg-gn-surface-muted dark:bg-white/5 hover:bg-gn-border dark:hover:bg-white/10 border border-gn-border dark:border-white/10 text-gn-foreground dark:text-white text-xs font-bold py-2 rounded transition-colors"
           >
             View in Catalog
           </button>
        </div>
      </div>
    </div>
  );
};
