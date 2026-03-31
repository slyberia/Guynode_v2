
import React from 'react';
import { ViewState, Dataset } from '../types';
import { MapViewer } from './MapViewer';

interface GisViewerPageProps {
  setView: (view: ViewState, params?: import("../utils/routing").RouteParams) => void;
  activeDataset?: Dataset | null;
  theme: 'light' | 'dark';
}

export const GisViewerPage: React.FC<GisViewerPageProps> = ({ setView, activeDataset, theme }) => {

  const renderMapContent = () => {
    const viewerType = activeDataset?.viewerType || 'leaflet';

    if (viewerType === 'none') {
      return (
        <div className="flex items-center justify-center w-full h-full text-gn-foreground dark:text-gn-foreground-dark">
          <div className="text-center p-8 bg-gn-surface-muted dark:bg-white/5 rounded border border-gn-border dark:border-white/10">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gn-foreground-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-xl font-bold mb-2">Interactive Map Not Available</h3>
            <p className="text-sm text-gn-foreground-muted">No interactive map is available for this dataset type. You can still download the asset from the Catalog.</p>
            <button onClick={() => setView('CATALOG')} className="mt-6 px-4 py-2 bg-brand-green-600 hover:bg-brand-green-500 text-white rounded transition-colors font-bold">Return to Catalog</button>
          </div>
        </div>
      );
    }

    // Default to Leaflet MapViewer
    return <MapViewer setView={setView} activeDataset={activeDataset} theme={theme} />;
  };

  return (
    <div className="w-full min-h-[calc(100vh-64px)] bg-gn-surface dark:bg-black p-4 lg:p-8 flex flex-col items-center justify-center transition-colors duration-300">
      
      {/* Outer Frame Card */}
      <div className="w-full max-w-[1600px] h-[85vh] min-h-[600px] bg-gn-elevated dark:bg-gn-elevated-dark border border-gn-border dark:border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col lg:flex-row ring-1 ring-black/5 dark:ring-white/5">
        
        {/* Left Panel: Instructions */}
        <div className="w-full lg:w-80 bg-gn-surface dark:bg-gn-bg-deep border-b lg:border-b-0 lg:border-r border-gn-border dark:border-white/10 flex flex-col flex-shrink-0 transition-colors duration-300">
          
          <div className="p-6 border-b border-gn-border dark:border-white/5">
            <h2 className="text-xl font-serif font-bold text-gn-foreground dark:text-white mb-2">Interactive GIS Viewer</h2>
            <p className="text-sm text-gn-foreground-muted dark:text-gray-400 leading-relaxed">
              Explore Guyana's spatial layers in a high-fidelity environment. This viewer supports vector tiles, temporal analysis, and multi-layer comparison.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-brand-gold-600 dark:text-guyana-gold uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-gold-600 dark:bg-guyana-gold"></span>
                Controls
              </h3>
              
              <ul className="space-y-4">
                <li className="flex gap-3 items-start">
                  <div className="bg-gn-surface-muted dark:bg-white/5 p-1.5 rounded text-gn-foreground-muted dark:text-gray-400 mt-0.5 border border-gn-border dark:border-white/5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9l4-4 4 4"/><path d="M5 15l4 4 4-4"/><path d="M9 5v14"/><path d="M15 9l4-4 4 4"/><path d="M15 15l4 4 4-4"/><path d="M19 5v14"/></svg>
                  </div>
                  <div>
                    <span className="font-bold text-gn-foreground dark:text-white block text-xs mb-0.5">Pan & Move</span>
                    <span className="text-xs text-gn-foreground-muted dark:text-gray-500 leading-tight block">Click and drag anywhere on the map to explore different regions.</span>
                  </div>
                </li>

                <li className="flex gap-3 items-start">
                  <div className="bg-gn-surface-muted dark:bg-white/5 p-1.5 rounded text-gn-foreground-muted dark:text-gray-400 mt-0.5 border border-gn-border dark:border-white/5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                  </div>
                  <div>
                    <span className="font-bold text-gn-foreground dark:text-white block text-xs mb-0.5">Zoom Levels</span>
                    <span className="text-xs text-gn-foreground-muted dark:text-gray-500 leading-tight block">Use your scroll wheel or double-click to view finer details.</span>
                  </div>
                </li>

                <li className="flex gap-3 items-start">
                  <div className="bg-gn-surface-muted dark:bg-white/5 p-1.5 rounded text-gn-foreground-muted dark:text-gray-400 mt-0.5 border border-gn-border dark:border-white/5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                  </div>
                  <div>
                    <span className="font-bold text-gn-foreground dark:text-white block text-xs mb-0.5">Manage Layers</span>
                    <span className="text-xs text-gn-foreground-muted dark:text-gray-500 leading-tight block">Toggle visibility and opacity via the top-right control panel.</span>
                  </div>
                </li>
                
                <li className="flex gap-3 items-start">
                   <div className="bg-gn-surface-muted dark:bg-white/5 p-1.5 rounded text-gn-foreground-muted dark:text-gray-400 mt-0.5 border border-gn-border dark:border-white/5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                   </div>
                   <div>
                     <span className="font-bold text-gn-foreground dark:text-white block text-xs mb-0.5">Metadata</span>
                     <span className="text-xs text-gn-foreground-muted dark:text-gray-500 leading-tight block">Select any feature geometry to inspect its attributes in the sidebar.</span>
                   </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="p-6 border-t border-gn-border dark:border-white/10 bg-gn-surface-muted dark:bg-black/20">
             <div className="bg-brand-green-50 dark:bg-gn-accent-blue/10 border border-brand-green-100 dark:border-gn-accent-blue/20 rounded-lg p-3">
               <div className="flex gap-2 items-start">
                  <span className="text-brand-green-600 dark:text-gn-accent-blue mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/></svg>
                  </span>
                  <p className="text-[11px] text-gn-foreground-muted dark:text-gray-300 leading-relaxed">
                    <strong>Tip:</strong> Need more data? Use the "Add Data Layer" button inside the viewer to browse the Catalog without leaving this screen.
                  </p>
               </div>
             </div>
          </div>
        </div>

        {/* Main Map Container */}
        <div className="flex-1 relative bg-gn-surface-muted dark:bg-black border-l border-gn-border dark:border-white/10">
          {renderMapContent()}
        </div>

      </div>
    </div>
  );
};
