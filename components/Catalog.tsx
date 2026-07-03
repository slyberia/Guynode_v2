
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Dataset, SearchResult, DatasetAsset } from '../types';
import { MockDatasetPreviewService } from '../services/dataPipeline';
import {
  CatalogFilterState,
  EMPTY_FILTER_STATE,
  applyCatalogFilters,
  canonicalizeTag,
  deriveCategoryFacets,
  deriveTagFacets,
  reconcileFilterState,
} from '../utils/catalogFilter';
import { loadGeojsonOnDemand } from '../utils/geojsonLoader';
import { CatalogCard } from './CatalogCard';
import { DatasetTrustPanel } from './DatasetTrustPanel';
import { ImageViewer } from './viewer/ImageViewer';
import { PdfViewer } from './viewer/PdfViewer';
import { TableViewer } from './viewer/TableViewer';
import { RasterOverlayViewer } from './viewer/RasterOverlayViewer';
import { safeUrl } from '../utils/url';
import { isGisPreviewable, isInlinePreviewable, hasRenderableGeojson, ENABLE_RUNTIME_SHAPEFILE_PREVIEW } from '../utils/previewCapability';
import { loadShapefile } from '../utils/shapefileLoader';

declare global {
  interface Window {
    L: typeof import('leaflet');
  }
}

interface CatalogProps {
  onOpenMap?: (dataset: Dataset) => void;
  // Controlled filter state (source of truth lives in App/URL for deep-linking).
  filters: CatalogFilterState;
  onFiltersChange: (next: CatalogFilterState) => void;
}

export const Catalog: React.FC<CatalogProps> = ({ onOpenMap, filters, onFiltersChange }) => {
  // Data State
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);

  // How many curated tag chips to surface before the "more" affordance.
  const TAG_FACET_LIMIT = 12;
  const [showAllTags, setShowAllTags] = useState(false);

  // Facets derived from the loaded data — never a chip that matches zero records.
  const categoryFacets = useMemo(() => deriveCategoryFacets(datasets), [datasets]);
  const tagFacets = useMemo(
    () => deriveTagFacets(datasets, { limit: showAllTags ? undefined : TAG_FACET_LIMIT, include: filters.tags }),
    [datasets, showAllTags, filters.tags]
  );

  // Combined filter step: search AND category AND (tag OR tag …).
  const filteredResults: SearchResult[] = useMemo(
    () => applyCatalogFilters(datasets, filters),
    [datasets, filters]
  );

  // Filter mutators — all route through the controlled callback so the URL stays
  // in sync (shareable + restored on back/forward).
  const setSearchQuery = (searchQuery: string) => onFiltersChange({ ...filters, searchQuery });
  const setActiveCategory = (category: string) => onFiltersChange({ ...filters, category });
  const toggleTag = (tag: string) => {
    const canon = canonicalizeTag(tag);
    const has = filters.tags.some((t) => canonicalizeTag(t) === canon);
    const tags = has
      ? filters.tags.filter((t) => canonicalizeTag(t) !== canon)
      : [...filters.tags, canon];
    onFiltersChange({ ...filters, tags });
  };
  const clearFilters = () => onFiltersChange(EMPTY_FILTER_STATE);

  // Drop filter values the loaded data can't back (stale bookmarked category/tag),
  // so a shared URL never shows an empty catalog behind a dead chip.
  useEffect(() => {
    if (datasets.length === 0) return;
    const reconciled = reconcileFilterState(filters, datasets);
    if (
      reconciled.category !== filters.category ||
      reconciled.tags.length !== filters.tags.length ||
      reconciled.tags.some((t, i) => t !== filters.tags[i])
    ) {
      onFiltersChange(reconciled);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasets]);

  // Selection & Detail State
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);

  
  // Map State
  const [showMap, setShowMap] = useState(false);
  // For map-table records, which face of the inline preview is showing.
  const [mapTableView, setMapTableView] = useState<'map' | 'table'>('map');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null);

  // Leaflet Map Logic — fetches real GeoJSON on demand (inline demo or a
  // converted file from /public/data); renders nothing if the record has no
  // resolvable geometry.
  useEffect(() => {
    const tableFace = selectedDataset?.viewerType === 'map-table' && mapTableView === 'table';
    const hasGeo = hasRenderableGeojson(selectedDataset);
    const hasShape = selectedDataset?.format === 'Shapefile' && selectedDataset?.downloadUrl;
    if (!showMap || tableFace || !selectedDataset || !(hasGeo || hasShape)) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      return;
    }

    let cancelled = false;
    const dataset = selectedDataset;

    const dataPromise = (dataset.format === 'Shapefile' && dataset.downloadUrl)
      ? loadShapefile(dataset.downloadUrl)
      : loadGeojsonOnDemand(dataset.geojsonUrl!);

    dataPromise
      .then((geoJsonData) => {
        if (cancelled || !mapContainerRef.current || !geoJsonData || !window.L) return;
        const L = window.L;

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = L.map(mapContainerRef.current, {
            attributionControl: false,
            zoomControl: false
          });
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
          }).addTo(mapInstanceRef.current);
        }

        const map = mapInstanceRef.current;

        // Clear existing vector layers (keep the tile basemap).
        map.eachLayer((layer: import('leaflet').Layer) => {
          if (!(layer as { _url?: string })._url) map.removeLayer(layer);
        });

        const styleConfig = dataset.style || {};
        const defaultStyle = { color: "#FFC20E", weight: 2, fillOpacity: 0.2 };

        try {
          const mergedStyle = { ...defaultStyle, ...styleConfig };
          const layer = L.geoJSON(geoJsonData, {
            style: mergedStyle,
            pointToLayer: (_f, latlng) =>
              L.circleMarker(latlng, {
                radius: 4,
                color: mergedStyle.color,
                weight: 1,
                fillColor: mergedStyle.color,
                fillOpacity: 0.7,
              }),
          }).addTo(map);
          map.fitBounds(layer.getBounds(), { padding: [20, 20] });
        } catch (e) {
          console.error("Map Render Error", e);
        }

        setTimeout(() => { map.invalidateSize() }, 100);
      })
      .catch((e) => console.error("Inline preview load failed", e));

    return () => { cancelled = true; };
  }, [showMap, selectedDataset, mapTableView]);
  
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

  // Reset states on selection
  useEffect(() => {
    setShowMap(false);
    setMapTableView('map');
  }, [selectedDataset]);

  // Feature Flags from previewCapability used below

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
      <div className="px-6 pb-4 border-b border-cream-300 dark:border-gn-border-dark bg-cream-100 dark:bg-black z-10 space-y-4">
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
              value={filters.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-cream-200 dark:bg-gn-surface-muted-dark border border-cream-300 dark:border-gn-border-dark rounded-sm px-4 py-2 text-sm text-ink-900 dark:text-gn-accent-gold font-mono focus:border-brand-green-500 dark:focus:border-gn-accent-blue outline-none w-80 uppercase placeholder-ink-500 dark:placeholder-gray-600"
            />
            {/* Place Finder Stub */}
            <div className="text-[9px] text-ink-500 dark:text-gray-600 font-mono flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
               Place Finder (Geocoding) coming in v4.2
            </div>
          </div>
        </div>
        
        {/* Category Chips — derived from the loaded data; every chip has a real
            count and yields >= 1 result (no dead filters). */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveCategory('ALL')}
            className={`px-4 py-1 rounded-full text-xs font-bold border transition-colors whitespace-nowrap ${filters.category === 'ALL' ? 'bg-ink-900 text-cream-100 border-ink-900 dark:bg-white dark:text-black dark:border-white' : 'text-ink-500 border-cream-300 hover:border-ink-900 dark:text-gray-400 dark:border-white/20 dark:hover:border-white'}`}
          >
            ALL ({datasets.length})
          </button>
          {categoryFacets.map(({ value, count }) => (
            <button
              key={value}
              onClick={() => setActiveCategory(value)}
              className={`px-4 py-1 rounded-full text-xs font-bold border transition-colors whitespace-nowrap ${filters.category === value ? 'bg-brand-green-600 text-white border-brand-green-600 dark:bg-gn-accent-dark dark:text-white dark:border-gn-accent-dark' : 'text-ink-500 border-cream-300 hover:border-brand-green-600 dark:text-gray-400 dark:border-white/20 dark:hover:border-white'}`}
            >
              {value} ({count})
            </button>
          ))}
        </div>

        {/* Tag Facet — curated tags derived from the data (format-duplicate noise
            excluded). Multi-select; results match ANY selected tag (OR). */}
        {tagFacets.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink-500 dark:text-gray-500 mr-1">Tags</span>
            {tagFacets.map(({ value, count }) => {
              const active = filters.tags.some((t) => canonicalizeTag(t) === canonicalizeTag(value));
              return (
                <button
                  key={value}
                  onClick={() => toggleTag(value)}
                  aria-pressed={active}
                  className={`text-[10px] font-mono px-2 py-1 rounded border transition-colors ${active ? 'bg-brand-gold-600 text-white border-brand-gold-600 dark:bg-gn-accent-gold dark:text-black dark:border-gn-accent-gold' : 'bg-cream-200 text-ink-500 border-cream-300 hover:border-brand-gold-600 dark:bg-white/10 dark:text-gray-400 dark:border-white/10 dark:hover:border-gn-accent-gold'}`}
                >
                  #{value} <span className="opacity-60">{count}</span>
                </button>
              );
            })}
            <button
              onClick={() => setShowAllTags((v) => !v)}
              className="text-[10px] font-mono px-2 py-1 rounded text-brand-green-600 dark:text-gn-accent-blue hover:underline"
            >
              {showAllTags ? 'less' : 'more…'}
            </button>
          </div>
        )}

        {/* Result count + active-filter summary. Combining rule stated so results
            are explainable: AND across facet types, OR within tags. */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
          <span className="text-ink-700 dark:text-gray-300 font-bold">
            {filteredResults.length} of {datasets.length} datasets
          </span>
          {(filters.category !== 'ALL' || filters.tags.length > 0 || filters.searchQuery.trim()) && (
            <>
              <span className="text-ink-500 dark:text-gray-600">•</span>
              {filters.searchQuery.trim() && (
                <span className="text-ink-500 dark:text-gray-500">“{filters.searchQuery.trim()}”</span>
              )}
              {filters.category !== 'ALL' && (
                <button
                  onClick={() => setActiveCategory('ALL')}
                  className="inline-flex items-center gap-1 bg-brand-green-600/10 text-brand-green-600 dark:bg-gn-accent-gold/10 dark:text-gn-accent-gold px-2 py-0.5 rounded"
                >
                  {filters.category} <span aria-hidden>✕</span>
                </button>
              )}
              {filters.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="inline-flex items-center gap-1 bg-brand-gold-600/10 text-brand-gold-600 dark:bg-gn-accent-gold/10 dark:text-gn-accent-gold px-2 py-0.5 rounded"
                >
                  #{tag} <span aria-hidden>✕</span>
                </button>
              ))}
              <button onClick={clearFilters} className="text-ink-500 dark:text-gray-500 hover:text-ink-900 dark:hover:text-white underline">
                clear all
              </button>
              <span className="text-ink-400 dark:text-gray-600 hidden sm:inline">matches search ∧ category ∧ any selected tag</span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Pane: Dataset List */}
        <div className="w-1/3 border-r border-cream-300 dark:border-gn-border-dark overflow-y-auto bg-cream-100 dark:bg-black custom-scrollbar transition-colors duration-300">
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
                <div className="p-8 text-center text-ink-500 dark:text-gray-500 text-sm space-y-3">
                  <p>
                    No datasets match{' '}
                    {filters.searchQuery.trim() && <>“{filters.searchQuery.trim()}”</>}
                    {filters.category !== 'ALL' && <> in <span className="font-bold">{filters.category}</span></>}
                    {filters.tags.length > 0 && (
                      <> tagged {filters.tags.map((t) => `#${t}`).join(' or ')}</>
                    )}
                    .
                  </p>
                  <button
                    onClick={clearFilters}
                    className="text-xs font-bold uppercase tracking-widest px-4 py-2 rounded border border-ink-900/20 text-ink-900 hover:border-ink-900 dark:border-white/20 dark:text-white dark:hover:border-white transition-colors"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Pane: Detail & Extraction View */}
        <div className="w-2/3 bg-cream-200 dark:bg-gn-surface-muted-dark flex flex-col overflow-hidden relative transition-colors duration-300">
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
          
          {selectedDataset ? (
            <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
              {/* Dataset Metadata Header */}
              <div className="p-6 border-b border-cream-300 dark:border-white/10 bg-cream-100/50 dark:bg-gn-elevated-dark/50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-ink-900 dark:text-white max-w-2xl">{selectedDataset.title}</h1>
                    {selectedDataset.legalUseWarning && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded border border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200 text-[10px] font-mono font-bold uppercase tracking-wider">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        Indicative Data Only
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    
                    {/* Inline Preview Toggle — GIS previews plus tabular previews */}
                    {isInlinePreviewable(selectedDataset) ? (
                      <button
                        onClick={() => setShowMap(!showMap)}
                        className={`text-xs font-bold px-4 py-2 rounded transition-colors uppercase tracking-widest border ${showMap ? 'bg-ink-900 text-white border-ink-900 dark:bg-white dark:text-black dark:border-white' : 'bg-transparent text-ink-900 border-ink-900/20 hover:border-ink-900 dark:text-white dark:border-white/20 dark:hover:border-white'}`}
                      >
                        {showMap ? 'Hide Preview' : 'Preview'}
                      </button>
                    ) : (
                      <button disabled title="No inline preview available for this dataset" className="text-xs font-bold px-4 py-2 rounded border border-cream-300 text-ink-500 dark:border-white/5 dark:text-gray-600 uppercase tracking-widest cursor-not-allowed">
                        No Preview
                      </button>
                    )}

                    {/* Preview in GIS Viewer — enabled only when the handoff can render something */}
                    {onOpenMap && (
                      isGisPreviewable(selectedDataset) ? (
                        <button
                          onClick={() => onOpenMap(selectedDataset)}
                          className="bg-ink-900 hover:bg-ink-700 text-white border border-ink-900 dark:bg-white dark:text-black dark:border-white dark:hover:bg-gray-200 text-xs font-bold px-4 py-2 rounded transition-colors uppercase tracking-widest"
                        >
                          Preview in GIS Viewer
                        </button>
                      ) : (
                        <button
                          disabled
                          title="No interactive preview — download to use in GIS software"
                          className="bg-gray-200 text-gray-400 border border-gray-300 dark:bg-white/5 dark:text-white/30 dark:border-white/5 text-xs font-bold px-4 py-2 rounded uppercase tracking-widest cursor-not-allowed"
                        >
                          No Interactive Preview
                        </button>
                      )
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
                        className="bg-brand-green-600 hover:bg-brand-green-500 dark:bg-gn-accent-secondary dark:hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded transition-colors uppercase tracking-widest inline-flex items-center"
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
                              {asset.type === 'shapefile' && !ENABLE_RUNTIME_SHAPEFILE_PREVIEW ? (
                                <span className="text-[10px] font-mono text-brand-gold-600 dark:text-gn-accent-gold border border-brand-gold-600/30 dark:border-gn-accent-gold/30 px-2 py-1 rounded bg-brand-gold-600/10 dark:bg-gn-accent-gold/10 cursor-help" title="Viewing requires offline GIS software. Conversion pipeline coming in v4.2.">
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

                {/* Provenance & usage — surfaces enriched trust metadata (Prompt 1.6). */}
                <DatasetTrustPanel dataset={selectedDataset} />

                {selectedDataset.tags && selectedDataset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {selectedDataset.tags.map(tag => {
                      const active = filters.tags.some((t) => canonicalizeTag(t) === canonicalizeTag(tag));
                      return (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          aria-pressed={active}
                          title={active ? `Remove filter #${tag}` : `Filter catalog by #${tag}`}
                          className={`text-[10px] px-2 py-1 rounded font-mono transition-colors ${active ? 'bg-brand-gold-600 text-white dark:bg-gn-accent-gold dark:text-black' : 'bg-cream-200 text-ink-500 hover:text-ink-900 dark:bg-white/10 dark:text-gray-400 dark:hover:text-white'}`}
                        >
                          #{tag}
                        </button>
                      );
                    })}
                  </div>
                )}
                
                <div className="grid grid-cols-4 gap-4 text-xs font-mono border-t border-cream-300 dark:border-white/5 pt-4">
                  <div>
                    <div className="text-ink-500 dark:text-gray-500 mb-1">SOURCE AUTHORITY</div>
                    <div className="text-brand-gold-600 dark:text-gn-accent-gold">{selectedDataset.source}</div>
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
                    <div className="text-ink-500 dark:text-gray-500 mb-1">FILE CHECKSUM</div>
                    {(() => {
                      // Show a REAL computed checksum only; never a placeholder trust signal.
                      const dist = (selectedDataset.distributions || []).find(
                        (d) => d.checksum && !/^0+$/.test(d.checksum.replace(/^[a-z0-9]+:/i, ''))
                      );
                      return dist?.checksum ? (
                        <div className="text-ink-700 dark:text-gray-400 truncate" title={dist.checksum}>{dist.checksum.slice(0, 20)}…</div>
                      ) : (
                        <div className="text-ink-500 dark:text-gray-600 italic">Not computed</div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Inline Preview Module — renders for capability-checked records */}
              {showMap && isInlinePreviewable(selectedDataset) && (
                <div className="border-b border-cream-300 dark:border-white/10 bg-black relative animate-in fade-in slide-in-from-top-4 duration-300 h-80">
                  {selectedDataset.viewerType === 'map-table' ? (
                    <div className="relative w-full h-full">
                      {/* Map / Table face toggle (points + tabular preview) */}
                      <div className="absolute top-2 right-2 z-[500] flex rounded overflow-hidden border border-cream-300 dark:border-white/10 text-[10px] font-bold uppercase tracking-widest">
                        {(['map', 'table'] as const).map((face) => (
                          <button
                            key={face}
                            onClick={() => setMapTableView(face)}
                            className={`px-3 py-1 transition-colors ${mapTableView === face ? 'bg-ink-900 text-white dark:bg-white dark:text-black' : 'bg-white/90 text-ink-700 dark:bg-black/80 dark:text-gray-300 hover:text-brand-green-600 dark:hover:text-white'}`}
                          >
                            {face}
                          </button>
                        ))}
                      </div>
                      {mapTableView === 'table' ? (
                        selectedDataset.tablePreviewUrl ? (
                          <TableViewer dataset={selectedDataset} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-ink-500 dark:text-gray-400 font-mono text-xs">No table preview available.</div>
                        )
                      ) : (
                        <>
                          <div className="absolute top-2 left-2 z-[400] bg-white/90 dark:bg-black/80 px-2 py-1 rounded border border-cream-300 dark:border-white/10">
                            <span className="text-[10px] text-brand-green-600 dark:text-gn-accent-gold font-mono">LIVE PREVIEW • POINTS</span>
                          </div>
                          <div ref={mapContainerRef} className="w-full h-full bg-[#121212]"></div>
                        </>
                      )}
                    </div>
                  ) : selectedDataset.viewerType === 'table' ? (
                    <TableViewer dataset={selectedDataset} />
                  ) : selectedDataset.viewerType === 'map-raster' ? (
                    <RasterOverlayViewer dataset={selectedDataset} />
                  ) : selectedDataset.viewerType === 'image' ? (
                    <ImageViewer dataset={selectedDataset} />
                  ) : selectedDataset.viewerType === 'pdf' ? (
                    <PdfViewer dataset={selectedDataset} />
                  ) : selectedDataset.viewerType === 'arcgis' && selectedDataset.arcGisEmbedUrl ? (
                    <iframe
                      src={selectedDataset.arcGisEmbedUrl}
                      className="w-full h-full border-none"
                      title="ArcGIS Web Map Preview"
                    />
                  ) : hasRenderableGeojson(selectedDataset) ? (
                    <>
                      <div className="absolute top-2 left-2 z-[400] bg-white/90 dark:bg-black/80 px-2 py-1 rounded border border-cream-300 dark:border-white/10">
                        <span className="text-[10px] text-brand-green-600 dark:text-gn-accent-gold font-mono">LIVE PREVIEW • {selectedDataset.format}</span>
                      </div>
                      <div ref={mapContainerRef} className="w-full h-full bg-[#121212]"></div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-cream-200 dark:bg-gn-surface-muted-dark flex items-center justify-center text-ink-500 dark:text-gray-400 font-mono text-xs p-4 text-center">
                      No inline preview available for this dataset.
                    </div>
                  )}
                </div>
              )}

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
