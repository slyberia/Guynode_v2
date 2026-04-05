
import React, { useState, useEffect } from 'react';
import { ViewState, AnalysisEntry } from '../types';
import { useCatalog } from '../context/CatalogContext';
import { MapViewer } from './MapViewer';
import { sanitizeHtml } from '../utils/sanitize';

interface AnalysisDetailPageProps {
  analysisId: string;
  navigate: (view: ViewState, params?: import("../utils/routing").RouteParams) => void;
}

export const AnalysisDetailPage: React.FC<AnalysisDetailPageProps> = ({ analysisId, navigate }) => {
  const [analysis, setAnalysis] = useState<AnalysisEntry | null>(null);
  const { datasets, getAnalysis } = useCatalog();

  // Index datasets into a Map for O(1) lookups
  const datasetMap = React.useMemo(() => {
    const map = new Map();
    datasets.forEach(d => map.set(d.id, d));
    return map;
  }, [datasets]);

  useEffect(() => {
    getAnalysis(analysisId).then(setAnalysis).catch(console.error);
  }, [analysisId, getAnalysis]);

  if (!analysis) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-400">
         Analysis not found.
      </div>
    );
  }

  // Resolve Dataset for Map
  const mapDataset = analysis.mapConfig?.datasetIds 
    ? datasetMap.get(analysis.mapConfig!.datasetIds![0])
    : null;

  return (
    <div className="min-h-screen bg-black text-white pt-20 px-6 pb-20">
      <div className="max-w-5xl mx-auto">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-mono text-gray-500 mb-8">
           <button onClick={() => navigate('HOME')} className="hover:text-white">HOME</button>
           <span>/</span>
           <span className="text-guyana-gold uppercase">{analysis.id}</span>
        </div>

        {/* Header */}
        <header className="mb-12 border-b border-white/10 pb-8">
           <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-gn-accent-blue/10 border border-gn-accent-blue/30 text-gn-accent-blue text-xs font-bold uppercase tracking-wider">
                {analysis.level}
              </span>
              {analysis.tags.map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-mono">
                  #{tag}
                </span>
              ))}
           </div>
           
           <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6 leading-tight">
             {analysis.title}
           </h1>
           
           <div className="flex items-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-white">
                    {analysis.author ? analysis.author[0] : 'G'}
                 </div>
                 <span>{analysis.author}</span>
              </div>
              <span>•</span>
              <span>{new Date(analysis.publishedAt).toLocaleDateString()}</span>
           </div>
        </header>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
           
           {/* Main Content Column */}
           <div className="lg:col-span-8 space-y-12">
              {/* Summary Hero */}
              <div className="text-xl text-gray-300 leading-relaxed font-serif border-l-4 border-guyana-gold pl-6 py-2">
                 {analysis.summary}
              </div>

              {/* Sections Loop */}
              {analysis.sections.map(section => (
                 <section key={section.id} className="space-y-4">
                    <h2 className="text-2xl font-bold text-white">{section.title}</h2>
                    <div
                      className="prose prose-invert prose-lg max-w-none text-gray-400 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.body) }}
                    />
                 </section>
              ))}

              {/* Map Integration */}
              {analysis.mapConfig && (
                 <section className="space-y-4 pt-8 border-t border-white/10">
                    <div className="flex items-center justify-between">
                       <h2 className="text-2xl font-bold text-white">Spatial Context</h2>
                       {mapDataset && (
                          <span className="text-xs font-mono text-gray-500">
                             DATASET: {mapDataset.title}
                          </span>
                       )}
                    </div>
                    
                    <div className="w-full h-[500px] bg-gray-900 border border-white/10 rounded-xl overflow-hidden relative">
                       {/* MapViewer Wrapper */}
                       <div className="absolute inset-0">
                          {mapDataset ? (
                             <MapViewer 
                               setView={navigate} 
                               activeDataset={mapDataset}
                               theme="dark"
                             />
                          ) : (
                             <div className="flex items-center justify-center h-full text-gray-500">
                                Map configuration missing valid dataset ID.
                             </div>
                          )}
                       </div>
                       {/* Overlay Note */}
                       <div className="absolute bottom-4 left-4 bg-black/80 px-4 py-2 rounded border border-white/10 text-xs text-white max-w-md z-[1000]">
                          Interactive View: Use controls to zoom and pan.
                       </div>
                    </div>
                 </section>
              )}

           </div>

           {/* Sidebar Column (Charts & Meta) */}
           <div className="lg:col-span-4 space-y-8">
              
              {/* Charts */}
              {analysis.charts && analysis.charts.map(chart => (
                 <div key={chart.id} className="bg-gn-elevated-dark border border-white/10 rounded-lg p-6">
                    <h3 className="font-bold text-white mb-2">{chart.title}</h3>
                    <p className="text-xs text-gray-400 mb-4">{chart.description}</p>
                    
                    {/* Placeholder Chart Graphic */}
                    <div className="h-40 bg-black/50 border border-white/5 rounded flex items-center justify-center mb-2">
                       <span className="text-xs font-mono text-gray-600 uppercase">
                          [ {chart.type} Chart Placeholder ]
                       </span>
                    </div>
                    
                    {chart.note && <div className="text-[10px] text-gray-500 italic">{chart.note}</div>}
                 </div>
              ))}

              {/* Datasets Used */}
              <div className="bg-white/5 border border-white/5 rounded-lg p-6">
                 <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Datasets Used</h3>
                 <ul className="space-y-3">
                    {analysis.datasetsUsed.map(dsId => {
                       const ds = datasetMap.get(dsId);
                       return ds ? (
                          <li key={ds.id}>
                             <button 
                               onClick={() => navigate('MAP', { datasetId: ds.id })}
                               className="text-sm font-bold text-gn-accent-blue hover:text-white text-left block"
                             >
                               {ds.title}
                             </button>
                             <div className="text-[10px] text-gray-500 mt-0.5">{ds.source}</div>
                          </li>
                       ) : null;
                    })}
                 </ul>
              </div>

           </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-20 pt-12 border-t border-white/10 flex justify-between items-center">
           <button 
             onClick={() => navigate('HOME')}
             className="text-sm font-bold text-gray-400 hover:text-white flex items-center gap-2"
           >
             ← Back to Index
           </button>
           <button 
             onClick={() => navigate('HOME')}
             className="text-sm font-bold text-gray-400 hover:text-white"
           >
             Go Home
           </button>
        </div>

      </div>
    </div>
  );
};
