
import React, { useState, useEffect, useRef } from 'react';
import { Dataset, SearchResult, DataCategory, DatasetAsset } from '../types';
import { MockDatasetPreviewService } from '../services/dataPipeline';
import { SearchEngine } from '../services/searchEngine';
import { GLOBAL_GEOJSON_DB } from '../data/geoJsonData';
import { CatalogCard } from './CatalogCard';
import { ImageViewer } from './viewer/ImageViewer';
import { safeUrl } from '../utils/url';

declare global {
  interface Window {
    L: typeof import('leaflet');
  }
}

interface CatalogProps {
  onOpenMap?: (dataset: Dataset) => void;
  initialSearchQuery?: string;
}

export const Catalog: React.FC<CatalogProps> = ({ onOpenMap, initialSearchQuery }) => {
  // Data State
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [activeCategory, setActiveCategory] = useState<DataCategory | 'ALL'>('ALL');

  // Update search query if prop changes
  useEffect(() => {
    setSearchQuery(initialSearchQuery || '');
  }, [initialSearchQuery]);

  // Selection & Detail State
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [previewData, setPreviewData] = useState<import('../types').PreviewRow[] | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  // Map State
  const [showMap, setShowMap] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null);

  // Leaflet Map Logic
  useEffect(() => {
    if (!showMap || !selectedDataset) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      return;
    }

    const geoJsonData = selectedDataset.geojsonUrl ? GLOBAL_GEOJSON_DB[selectedDataset.geojsonUrl] : null;

    if (mapContainerRef.current && geoJsonData && window.L) {
      if (!mapInstanceRef.current) {
        const L = window.L;
        mapInstanceRef.current = L.map(mapContainerRef.current, {
          attributionControl: false,
          zoomControl: false
        });
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19
        }).addTo(mapInstanceRef.current);
      }

      const map = mapInstanceRef.current;
      
      // Clear existing layers
      map.eachLayer((layer: import('leaflet').Layer) => {
        if (!(layer as { _url?: string })._url) map.removeLayer(layer);
      });

      const styleConfig = selectedDataset.style || {};
      const defaultStyle = { color: "#FFC20E", weight: 2, fillOpacity: 0.2 };

      try {
        const layer = window.L.geoJSON(geoJsonData, {
          style: { ...defaultStyle, ...styleConfig }
        }).addTo(map);
        map.fitBounds(layer.getBounds(), { padding: [20, 20] });
      } catch (e) {
        console.error("Map Render Error", e);
      }
      
      setTimeout(() => { map.invalidateSize() }, 100);
    }
  }, [showMap, selectedDataset]);
  
  // Initial Data Ingestion (Section 7)
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await MockDatasetPreviewService.validateCatalog();
        setDatasets(data);
        // Initial filter
        if (data.length > 0) setSelectedDataset(data[0]);
      } catch (err) {
        console.error("Ingestion Pipeline Failed", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Search & Filter Logic (Section 8)
  useEffect(() => {
    // 1. Full text search
    let results = SearchEngine.search(datasets, searchQuery);
    
    // 2. Category Filter
    if (activeCategory !== 'ALL') {
      results = results.filter(r => r.item.category === activeCategory);
    }

    setFilteredResults(results);
  }, [searchQuery, activeCategory, datasets]);

  // Extraction Logic on Selection
  useEffect(() => {
    setShowMap(false);
    if (selectedDataset) {
      const fetchPreview = async () => {
        setLoadingPreview(true);
        setPreviewData(null);
        try {
          const extracted = await MockDatasetPreviewService.generateMockPreview(selectedDataset);
          setPreviewData(extracted);
        } catch (e) {
          console.error("Extraction Failed", e);
        } finally {
          setLoadingPreview(false);
        }
      };
      fetchPreview();
    }
  }, [selectedDataset]);

  // Feature Flags
  const ENABLE_SHAPEFILE_PREVIEW = false;

  const handleAssetAction = (asset: DatasetAsset, action: 'view' | 'download') => {
    try {
      const url = safeUrl(asset.storagePath || asset.originalUrl);

      if (!url) {
        console.error("handleAssetAction: Invalid or missing URL", asset);
        alert("Action blocked: Invalid resource URL detected.");
        return;
      }

      if (action === 'download') {
        const link = document.createElement('a');
        link.href = url;
        link.download = asset.label;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (action === 'view') {
        if (asset.type === 'pdf' || asset.type === 'image') {
          const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
          if (newWindow) {
            newWindow.opener = null;
          }
        } else if (asset.type === 'geojson' && onOpenMap && selectedDataset) {
          // Special case: if viewing a GeoJSON asset, try to open the main dataset in map
          onOpenMap(selectedDataset);
        } else if (asset.type === 'shapefile') {
          // Fallback if the UI button is somehow enabled
          console.warn("Shapefile viewing requires offline GIS software.");
        }
      }
    } catch (error) {
      console.error("handleAssetAction error:", error);
      alert("An unexpected error occurred while processing this action.");
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-black pt-4 pb-12 flex flex-col h-screen overflow-hidden transition-colors duration-300">
      {/* Header Bar */}
      <div className="px-6 pb-4 border-b border-cream-300 dark:border-nightBorder-600 bg-cream-100 dark:bg-black z-10 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-serif font-bold text-ink-900 dark:text-white tracking-tight">Data Catalog</h2>
            <div className="text-[10px] text-ink-500 dark:text-gray-500 font-mono mt-1">
              Guynode Spatial Data Archive • Public Release
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <input 
              type="text" 
              placeholder="> SEARCH DATASETS..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-cream-200 dark:bg-nightBg-800 border border-cream-300 dark:border-nightBorder-600 rounded-sm px-4 py-2 text-sm text-ink-900 dark:text-nightAccent-gold font-mono focus:border-brand-green-500 dark:focus:border-bloom-accent outline-none w-80 uppercase placeholder-ink-500 dark:placeholder-gray-600" 
            />
            {/* Place Finder Stub */}
            <div className="text-[9px] text-ink-500 dark:text-gray-600 font-mono flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
               Place Finder (Geocoding) coming in v4.2
            </div>
          </div>
        </div>
        
        {/* Category Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button 
            onClick={() => setActiveCategory('ALL')}
            className={`px-4 py-1 rounded-full text-xs font-bold border transition-colors ${activeCategory === 'ALL' ? 'bg-ink-900 text-cream-100 border-ink-900 dark:bg-white dark:text-black dark:border-white' : 'text-ink-500 border-cream-300 hover:border-ink-900 dark:text-gray-400 dark:border-white/20 dark:hover:border-white'}`}
          >
            ALL
          </button>
          {['Boundaries', 'Demographics', 'Environment', 'Economy', 'Infrastructure', 'Reference', 'Administrative Boundaries', 'Planning and Development'].map(cat => (
             <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1 rounded-full text-xs font-bold border transition-colors whitespace-nowrap ${activeCategory === cat ? 'bg-brand-green-600 text-white border-brand-green-600 dark:bg-nightAccent-green dark:text-white dark:border-nightAccent-green' : 'text-ink-500 border-cream-300 hover:border-brand-green-600 dark:text-gray-400 dark:border-white/20 dark:hover:border-white'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Pane: Dataset List */}
        <div className="w-1/3 border-r border-cream-300 dark:border-nightBorder-600 overflow-y-auto bg-cream-100 dark:bg-black custom-scrollbar transition-colors duration-300">
          {loading ? (
             <div className="p-8 text-center font-mono text-ink-500 dark:text-gray-500 animate-pulse">&gt; INITIALIZING PIPELINE...</div>
          ) : (
            <div className="divide-y divide-cream-300 dark:divide-white/5">
              {filteredResults.map(({ item }) => (
                <CatalogCard 
                  key={item.id}
                  dataset={item}
                  isSelected={selectedDataset?.id === item.id}
                  onClick={() => setSelectedDataset(item)}
                />
              ))}
              {filteredResults.length === 0 && (
                <div className="p-8 text-center text-ink-500 dark:text-gray-600 text-sm">No datasets found matching query.</div>
              )}
            </div>
          )}
        </div>

        {/* Right Pane: Detail & Extraction View */}
        <div className="w-2/3 bg-cream-200 dark:bg-nightBg-800 flex flex-col overflow-hidden relative transition-colors duration-300">
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
          
          {selectedDataset ? (
            <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
              {/* Dataset Metadata Header */}
              <div className="p-6 border-b border-cream-300 dark:border-white/10 bg-cream-100/50 dark:bg-bloom-card/50">
                <div className="flex justify-between items-start mb-4">
                  <h1 className="text-2xl font-bold text-ink-900 dark:text-white max-w-2xl">{selectedDataset.title}</h1>
                  <div className="flex gap-2">
                    
                    {/* Map Toggle Button */}
                    {((selectedDataset.geojsonUrl || selectedDataset.arcGisEmbedUrl || selectedDataset.viewerType === 'image') && selectedDataset.viewerType !== 'none') ? (
                      <button 
                        onClick={() => setShowMap(!showMap)}
                        className={`text-xs font-bold px-4 py-2 rounded transition-colors uppercase tracking-widest border ${showMap ? 'bg-ink-900 text-white border-ink-900 dark:bg-white dark:text-black dark:border-white' : 'bg-transparent text-ink-900 border-ink-900/20 hover:border-ink-900 dark:text-white dark:border-white/20 dark:hover:border-white'}`}
                      >
                        {showMap ? 'Hide Preview' : 'Preview'}
                      </button>
                    ) : (
                      <button disabled className="text-xs font-bold px-4 py-2 rounded border border-cream-300 text-ink-500 dark:border-white/5 dark:text-gray-600 uppercase tracking-widest cursor-not-allowed">
                        No Map Preview
                      </button>
                    )}

                    {/* Preview in GIS Viewer */}
                     {(selectedDataset.geojsonUrl || selectedDataset.arcGisEmbedUrl) && selectedDataset.viewerType !== 'none' && onOpenMap && (
                      <button 
                        disabled
                        className="bg-gray-200 text-gray-400 border border-gray-300 dark:bg-white/5 dark:text-white/30 dark:border-white/5 text-xs font-bold px-4 py-2 rounded transition-colors uppercase tracking-widest opacity-50 cursor-not-allowed"
                      >
                        Preview in GIS Viewer (Coming Soon)
                      </button>
                    )}

                    {/* Download Data Button */}
                    {selectedDataset.downloadUrl && safeUrl(selectedDataset.downloadUrl) ? (
                      <a
                        href={safeUrl(selectedDataset.downloadUrl)!}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.preventDefault();
                          const url = safeUrl(selectedDataset.downloadUrl!);
                          if (!url) return;
                          if (window.confirm("By downloading this dataset, you agree to the Guynode Data License. Attribution is required. Proceed?")) {
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = '';
                            link.target = '_blank';
                            link.rel = 'noopener noreferrer';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }
                        }}
                        className="bg-brand-green-600 hover:bg-brand-green-500 dark:bg-nightAccent-blue dark:hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded transition-colors uppercase tracking-widest inline-flex items-center"
                      >
                        Download Data
                      </a>
                    ) : (
                      <button
                        disabled
                        className="bg-gray-200 text-gray-400 border border-gray-300 dark:bg-white/5 dark:text-white/30 dark:border-white/5 text-xs font-bold px-4 py-2 rounded transition-colors uppercase tracking-widest opacity-50 cursor-not-allowed"
                      >
                        Download Data
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Assets List */}
                {selectedDataset.assets && selectedDataset.assets.length > 0 && (
                  <div className="mb-6 bg-white/50 dark:bg-black/20 rounded-lg p-4 border border-cream-300 dark:border-white/10">
                    <h3 className="text-xs font-bold text-ink-500 dark:text-gray-400 uppercase tracking-widest mb-3">Available Files & Formats</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedDataset.assets.map((asset) => (
                        <div key={asset.id} className="flex items-center justify-between bg-white dark:bg-white/5 p-2 rounded border border-cream-200 dark:border-white/5">
                           <div className="flex items-center gap-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white uppercase ${asset.type === 'pdf' ? 'bg-red-500' : asset.type === 'shapefile' ? 'bg-brand-gold-600' : 'bg-brand-green-600'}`}>
                                {asset.type}
                              </span>
                              <span className="text-sm font-medium text-ink-900 dark:text-gray-200">{asset.label}</span>
                           </div>
                           <div className="flex gap-2">
                              {asset.type === 'shapefile' && !ENABLE_SHAPEFILE_PREVIEW ? (
                                <span className="text-[10px] font-mono text-brand-gold-600 dark:text-nightAccent-gold border border-brand-gold-600/30 dark:border-nightAccent-gold/30 px-2 py-1 rounded bg-brand-gold-600/10 dark:bg-nightAccent-gold/10 cursor-help" title="Viewing requires offline GIS software. Conversion pipeline coming in v4.2.">
                                  REQUIRES GIS SOFTWARE
                                </span>
                              ) : asset.isViewable && (
                                <button 
                                  onClick={() => handleAssetAction(asset, 'view')}
                                  className="text-xs text-ink-700 dark:text-gray-300 hover:text-brand-green-600 dark:hover:text-white font-bold px-2 py-1"
                                >
                                  View
                                </button>
                              )}
                              {asset.isDownloadable && (
                                <button 
                                  onClick={() => {
                                    if (window.confirm("By downloading this dataset, you agree to the Guynode Data License. Attribution is required. Proceed with download?")) {
                                      handleAssetAction(asset, 'download');
                                    }
                                  }}
                                  className="text-xs bg-brand-green-600 hover:bg-brand-green-500 text-white px-3 py-1 rounded font-bold transition-colors"
                                >
                                  Download
                                </button>
                              )}
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <p className="text-ink-700 dark:text-gray-300 text-sm mb-6 max-w-3xl leading-relaxed">{selectedDataset.description}</p>
                
                {selectedDataset.tags && (
                  <div className="flex gap-2 mb-6">
                    {selectedDataset.tags.map(tag => (
                      <span key={tag} className="text-[10px] bg-cream-200 dark:bg-white/10 px-2 py-1 rounded text-ink-500 dark:text-gray-400 font-mono">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="grid grid-cols-4 gap-4 text-xs font-mono border-t border-cream-300 dark:border-white/5 pt-4">
                  <div>
                    <div className="text-ink-500 dark:text-gray-500 mb-1">SOURCE AUTHORITY</div>
                    <div className="text-brand-gold-600 dark:text-nightAccent-gold">{selectedDataset.source}</div>
                  </div>
                  <div>
                    <div className="text-ink-500 dark:text-gray-500 mb-1">LAST UPDATED</div>
                    <div className="text-ink-900 dark:text-white">{selectedDataset.lastUpdated}</div>
                  </div>
                  <div>
                    <div className="text-ink-500 dark:text-gray-500 mb-1">SIZE</div>
                    <div className="text-ink-900 dark:text-white">{selectedDataset.size}</div>
                  </div>
                  <div>
                    <div className="text-ink-500 dark:text-gray-500 mb-1">INTEGRITY HASH</div>
                    <div className="text-ink-700 dark:text-gray-600 truncate">a1b2-c3d4-e5f6</div>
                  </div>
                </div>
              </div>

              {/* Map Preview Module */}
              {showMap && ((selectedDataset.geojsonUrl || selectedDataset.arcGisEmbedUrl || selectedDataset.viewerType === 'image') && selectedDataset.viewerType !== 'none') && (
                <div className="border-b border-cream-300 dark:border-white/10 bg-black relative animate-in fade-in slide-in-from-top-4 duration-300 h-80">
                  {selectedDataset.viewerType === 'image' ? (
                    <ImageViewer dataset={selectedDataset} />
                  ) : selectedDataset.viewerType === 'arcgis' && selectedDataset.arcGisEmbedUrl ? (
                    <iframe
                      src={selectedDataset.arcGisEmbedUrl}
                      className="w-full h-full border-none"
                      title="ArcGIS Web Map Preview"
                    />
                  ) : selectedDataset.geojsonUrl && GLOBAL_GEOJSON_DB[selectedDataset.geojsonUrl] ? (
                    <>
                      <div className="absolute top-2 left-2 z-[400] bg-white/90 dark:bg-black/80 px-2 py-1 rounded border border-cream-300 dark:border-white/10">
                        <span className="text-[10px] text-brand-green-600 dark:text-nightAccent-gold font-mono">LIVE PREVIEW • {selectedDataset.format}</span>
                      </div>
                      <div ref={mapContainerRef} className="w-full h-full bg-[#121212]"></div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-cream-200 dark:bg-nightBg-800 flex items-center justify-center text-red-500 font-mono text-xs p-4">
                      &gt; ERROR: DATA_SOURCE_MISSING ({selectedDataset.geojsonUrl})<br/>
                      &gt; PLEASE CONTACT ADMINISTRATOR
                    </div>
                  )}
                </div>
              )}

              {/* Extraction Preview Pane */}
              <div className="flex-1 flex flex-col min-h-[300px]">
                <div className="px-6 py-3 bg-cream-300 dark:bg-black/40 border-b border-cream-300 dark:border-white/10 flex items-center justify-between">
                  <span className="text-xs font-bold text-ink-500 dark:text-gray-400 uppercase tracking-widest">Data Extraction Preview</span>
                  <div className="flex gap-2">
                     <div className="w-2 h-2 rounded-full bg-red-500"></div>
                     <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                     <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-auto p-6 bg-white dark:bg-black">
                  {loadingPreview ? (
                     <div className="h-full flex flex-col items-center justify-center text-ink-500 dark:text-gray-500 font-mono text-xs">
                        <div className="w-8 h-8 border-2 border-brand-green-600 dark:border-bloom-accent border-t-transparent rounded-full animate-spin mb-4"></div>
                        &gt; DECRYPTING STREAM...<br/>
                        &gt; PARSING {selectedDataset.format}...
                     </div>
                  ) : (
                    <div className="font-mono text-xs">
                      {previewData && previewData.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-cream-300 dark:border-white/20 text-brand-green-600 dark:text-nightAccent-gold">
                              {Object.keys(previewData[0]).map(key => (
                                <th key={key} className="py-2 px-4 uppercase">{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-cream-200 dark:divide-white/5 text-ink-700 dark:text-gray-300">
                            {previewData.map((row, idx) => (
                              <tr key={idx} className="hover:bg-cream-100 dark:hover:bg-white/5">
                                {Object.values(row).map((val: unknown, i) => (
                                  <td key={i} className="py-2 px-4 truncate max-w-xs">{String(val)}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-red-500 dark:text-red-400">&gt; ERROR: PREVIEW_UNAVAILABLE</div>
                      )}
                      <div className="mt-4 text-ink-500 dark:text-gray-600 italic">
                        &gt; End of preview. Full dataset contains {selectedDataset.size} of data.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state flex flex-col items-center justify-center h-full text-gray-500 text-sm font-mono">
              <svg className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              Select a dataset from the catalog to view its details, metadata, and download links.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
