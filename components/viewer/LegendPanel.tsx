
import React from 'react';
import { LegendItem } from '../../utils/legendUtils';

interface LegendPanelProps {
  entries: { datasetTitle: string, items: LegendItem[] }[];
}

export const LegendPanel: React.FC<LegendPanelProps> = ({ entries }) => {
  if (entries.length === 0) return null;

  return (
    <div className="absolute bottom-8 right-6 z-[1000] bg-white/90 dark:bg-black/90 backdrop-blur border border-gn-border dark:border-white/10 p-4 rounded-lg shadow-xl w-64 max-h-60 overflow-y-auto custom-scrollbar animate-in slide-in-from-bottom-4">
      <h4 className="text-[10px] font-bold text-gn-foreground-muted dark:text-gray-400 uppercase tracking-widest mb-3 border-b border-gn-border dark:border-white/10 pb-2">
        Map Legend
      </h4>
      <div className="space-y-4">
        {entries.map((entry, idx) => (
          <div key={idx}>
            <h5 className="text-xs font-bold text-gn-foreground dark:text-white mb-2 truncate">{entry.datasetTitle}</h5>
            <div className="space-y-2">
              {entry.items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-4 h-4 flex items-center justify-center">
                    {item.type === 'fill' && (
                      <div 
                        className="w-3 h-3 border border-gn-border dark:border-white/20" 
                        style={{ backgroundColor: item.color, opacity: 0.6 }} 
                      />
                    )}
                    {item.type === 'line' && (
                      <div 
                        className="w-full h-0.5" 
                        style={{ backgroundColor: item.color }} 
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-gn-foreground-muted dark:text-gray-300">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
