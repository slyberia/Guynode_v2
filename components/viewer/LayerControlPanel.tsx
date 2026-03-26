
import React, { useState } from 'react';

export interface ViewerLayerConfig {
  id: string; // usually URL
  name: string;
  visible: boolean;
  opacity: number;
  isComparison: boolean;
  status: 'IDLE' | 'LOADING' | 'OPTIMIZING' | 'READY' | 'ERROR';
}

interface LayerControlPanelProps {
  layers: ViewerLayerConfig[];
  onToggleVisibility: (id: string) => void;
  onOpacityChange: (id: string, opacity: number) => void;
  fullDatasetMode: boolean;
  onToggleFullMode: () => void;
  comparisonEnabled: boolean;
  onToggleComparison: () => void;
  comparisonDatasets: { id: string, title: string }[];
  selectedComparisonId: string;
  onSelectComparison: (id: string) => void;
}

export const LayerControlPanel: React.FC<LayerControlPanelProps> = ({
  layers,
  onToggleVisibility,
  onOpacityChange,
  fullDatasetMode,
  onToggleFullMode,
  comparisonEnabled,
  onToggleComparison,
  comparisonDatasets,
  selectedComparisonId,
  onSelectComparison
}) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="absolute top-20 right-6 z-[1000] bg-white/90 dark:bg-black/90 text-gn-foreground dark:text-white p-2 rounded border border-gn-border dark:border-white/10 hover:bg-gn-border dark:hover:bg-white/10 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
      </button>
    );
  }

  return (
    <div className="absolute top-20 right-6 z-[1000] bg-white/90 dark:bg-black/90 backdrop-blur border border-gn-border dark:border-white/10 p-4 rounded-lg w-72 shadow-2xl animate-in slide-in-from-right-4">
      <div className="flex justify-between items-center mb-4 border-b border-gn-border dark:border-white/10 pb-2">
        <h4 className="text-[10px] font-bold text-gn-foreground-muted dark:text-gray-400 uppercase tracking-widest">Active Layers</h4>
        <button onClick={() => setIsOpen(false)} className="text-gn-foreground-muted dark:text-gray-500 hover:text-gn-foreground dark:hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div className="space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
        {/* Layer List */}
        <div className="space-y-4">
          {layers.map(layer => (
            <div key={layer.id} className="bg-gn-surface-muted dark:bg-white/5 rounded p-3 border border-gn-border dark:border-white/5">
              <div className="flex items-center justify-between mb-2">
                 <label className="flex items-center gap-2 cursor-pointer w-full">
                   <input 
                     type="checkbox" 
                     checked={layer.visible} 
                     onChange={() => onToggleVisibility(layer.id)}
                     className={`accent-${layer.isComparison ? 'red-500' : 'brand-gold-600 dark:accent-guyana-gold'}`} 
                   />
                   <span className={`text-xs font-bold truncate ${layer.isComparison ? 'text-red-500 dark:text-red-400' : 'text-gn-foreground dark:text-white'}`}>
                     {layer.name}
                   </span>
                 </label>
                 <span className="text-[9px] font-mono">
                   {layer.status === 'LOADING' && <span className="text-blue-500 dark:text-blue-400 animate-pulse">LOAD</span>}
                   {layer.status === 'READY' && <span className="text-brand-green-600 dark:text-green-500">RDY</span>}
                   {layer.status === 'ERROR' && <span className="text-red-500">ERR</span>}
                 </span>
              </div>
              
              {/* Opacity Slider */}
              {layer.visible && (
                <div className="flex items-center gap-2">
                   <span className="text-[9px] text-gn-foreground-muted dark:text-gray-500 w-8">OPAC</span>
                   <input 
                     type="range" 
                     min="0" max="1" step="0.1" 
                     value={layer.opacity}
                     onChange={(e) => onOpacityChange(layer.id, parseFloat(e.target.value))}
                     className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gray-500 dark:accent-gray-400"
                   />
                </div>
              )}
            </div>
          ))}
          
          {layers.length === 0 && (
            <div className="text-xs text-gn-foreground-muted dark:text-gray-500 text-center py-4 italic">No active layers.</div>
          )}
        </div>

        {/* Comparison Controls */}
        <div className="pt-4 border-t border-gn-border dark:border-white/10">
           <div className="flex items-center justify-between mb-3">
             <h4 className="text-[10px] font-bold text-gn-foreground-muted dark:text-gray-400 uppercase">Comparison</h4>
             <label className="relative inline-flex items-center cursor-pointer">
               <input type="checkbox" checked={comparisonEnabled} onChange={onToggleComparison} className="sr-only peer" />
               <div className="w-8 h-4 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-red-500"></div>
             </label>
           </div>
           
           {comparisonEnabled && (
              <select 
                value={selectedComparisonId} 
                onChange={(e) => onSelectComparison(e.target.value)}
                className="w-full bg-white dark:bg-black border border-gn-border dark:border-white/20 rounded text-xs text-gn-foreground dark:text-white p-2 outline-none focus:border-red-500"
              >
                <option value="">Select Dataset...</option>
                {comparisonDatasets.map(d => (
                   <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
           )}
        </div>

        {/* Global Options */}
        <div className="pt-4 border-t border-gn-border dark:border-white/10">
           <h4 className="text-[10px] font-bold text-gn-foreground-muted dark:text-gray-400 uppercase mb-3">Rendering</h4>
           <label className="flex items-center gap-2 cursor-pointer">
             <input 
               type="checkbox" 
               checked={fullDatasetMode} 
               onChange={onToggleFullMode}
               className="accent-brand-green-600 dark:accent-bloom-accent"
             />
             <span className="text-xs text-gn-foreground-muted dark:text-gray-300">Disable Spatial Clipping (Full Load)</span>
           </label>
        </div>
      </div>
    </div>
  );
};
