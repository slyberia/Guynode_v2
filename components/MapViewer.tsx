
import React, { useEffect, useRef, useState } from 'react';
import { ViewState, Dataset } from '../types';
import { useCatalog } from '../context/CatalogContext';
import { loadGeojsonOnDemand, loadWithWorker } from '../utils/geojsonLoader';
import { clipToViewBounds, BoundingBox } from '../utils/spatialUtils';
import { getComparisonStyle } from '../utils/viewerComparison';
import { loadTemporalLayer, getAvailableYears } from '../utils/timelineLoader';
import { computeGeojsonStats, GeoStats } from '../utils/geojsonValidator';

// New Components
import { LayerControlPanel, ViewerLayerConfig } from './viewer/LayerControlPanel';
import { ViewerSidebar } from './viewer/ViewerSidebar';
import { LegendPanel } from './viewer/LegendPanel';
import { getLegendEntriesForDataset } from '../utils/legendUtils';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';


const DefaultIcon = L.icon({
    iconUrl: icon,
    iconRetinaUrl: iconRetina,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

import { RouteParams } from '../utils/routing';

declare global {
  interface Window {
    L: typeof import('leaflet');
  }
}

interface MapViewerProps {
  setView: (view: ViewState, params?: RouteParams) => void;
  activeDataset?: Dataset | null;
  theme: 'light' | 'dark';
}

// Unified Viewer State
interface ViewerState {
  primaryDatasetId: string | null;
  comparisonDatasetId: string | null;
  temporalYear: number | null;
  fullDatasetMode: boolean;
  loadingStatus: 'IDLE' | 'LOADING' | 'ERROR';
  errorMessage: string | null;
}

export const MapViewer: React.FC<MapViewerProps> = ({  activeDataset, theme }) => {
  const { datasets } = useCatalog();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import('leaflet').Map | null>(null);
  const layerGroupRef = useRef<import('leaflet').LayerGroup | null>(null);
  const tileLayerRef = useRef<import('leaflet').TileLayer | null>(null);
  const georasterRef = useRef<{
    parseGeoraster: typeof import('georaster').default;
    GeoRasterLayer: typeof import('georaster-layer-for-leaflet').default;
  } | null>(null);

  // 1. Consolidated Viewer State
  const [viewerState, setViewerState] = useState<ViewerState>({
    primaryDatasetId: activeDataset?.id || null,
    comparisonDatasetId: null,
    temporalYear: null,
    fullDatasetMode: false,
    loadingStatus: 'IDLE',
    errorMessage: null
  });

  // Layer Configuration State
  const [layers, setLayers] = useState<ViewerLayerConfig[]>([]);
  // Cached Data Storage (Ref to avoid re-renders on massive data)
  const dataCacheRef = useRef<Map<string, GeoJSON.FeatureCollection>>(new Map());
  
  // Refs for Event Handlers (Fixes Stale Closures)
  const viewerStateRef = useRef(viewerState);
  const layersRef = useRef(layers);

  // Sync refs with state
  useEffect(() => {
    viewerStateRef.current = viewerState;
    layersRef.current = layers;
  }, [viewerState, layers]);
  
  // Metadata & Stats State
  const [activeStats, setActiveStats] = useState<GeoStats | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // 4. Layer Synchronization Logic
  const syncLayersWithState = React.useCallback((pId: string | null, cId: string | null, _year: number | null) => {
    setLayers(prev => {
      const newLayers: ViewerLayerConfig[] = [];

      // Primary Layer
      if (pId) {
        const pData = datasets.find(d => d.id === pId);
        if (pData && pData.geojsonUrl) {
           const existing = prev.find(l => l.id === pData.geojsonUrl && !l.isComparison);
           newLayers.push({
             id: pData.geojsonUrl,
             name: pData.title,
             visible: existing ? existing.visible : true,
             opacity: existing ? existing.opacity : 1,
             isComparison: false,
             status: existing ? existing.status : 'IDLE' // Will trigger load if IDLE
           });
        }
      }

      // Comparison Layer
      if (cId) {
        const cData = datasets.find(d => d.id === cId);
        if (cData && cData.geojsonUrl) {
           const existing = prev.find(l => l.id === cData.geojsonUrl && l.isComparison);
           newLayers.push({
             id: cData.geojsonUrl,
             name: `[CMP] ${cData.title}`,
             visible: existing ? existing.visible : true,
             opacity: existing ? existing.opacity : 0.8,
             isComparison: true,
             status: existing ? existing.status : 'IDLE'
           });
        }
      }
      return newLayers;
    });
  }, [datasets]);


// 6. Rendering Logic (Leaflet)
  // Accepts explicit state to handle calls from stale closures
  const renderLayers = React.useCallback((currentLayers: ViewerLayerConfig[], stateOverride?: ViewerState) => {
    if (!layerGroupRef.current || !window.L) return;
    const L = window.L;
    const currentState = stateOverride || viewerState;

    layerGroupRef.current.clearLayers();

    // Index datasets by geojsonUrl to avoid O(L*D) lookup inside loop
    const datasetUrlMap = new Map();
    datasets.forEach(d => {
      if (d.geojsonUrl) datasetUrlMap.set(d.geojsonUrl, d);
    });

    currentLayers.forEach(layer => {
      if (layer.visible && layer.status === 'READY') {
        const key = layer.id + (layer.isComparison ? '_cmp' : '');
        const fullData = dataCacheRef.current.get(key);
        if (!fullData) return;

        // Progressive Clipping
        const bounds = getMapBounds(mapInstanceRef.current);
        const dataToRender = currentState.fullDatasetMode ? fullData : clipToViewBounds(fullData, bounds);

        // Styling
        // Resolve dataset to get style config from Central Contract
        const dataset = datasetUrlMap.get(layer.id);
        const configStyle = dataset?.style || {};

        const isGeoTiff = layer.id.toLowerCase().endsWith('.tif') || layer.id.toLowerCase().endsWith('.tiff');

        if (isGeoTiff) {
          if (!georasterRef.current) return;
          const rasterLayer = new georasterRef.current.GeoRasterLayer({
            georaster: fullData,
            opacity: layer.opacity,
            resolution: 128
          });
          rasterLayer.addTo(layerGroupRef.current);

          // Fit bounds to raster data on first render
          if (mapInstanceRef.current && !layer.isComparison) {
             const bounds = L.latLngBounds(
               [fullData.ymin, fullData.xmin],
               [fullData.ymax, fullData.xmax]
             );
             mapInstanceRef.current.fitBounds(bounds);
          }
        } else {
          let style: import('leaflet').PathOptions = {
            color: configStyle.color || "#3b82f6",
            weight: configStyle.weight || 2,
            fillOpacity: (configStyle.fillOpacity || 0.2) * layer.opacity,
            opacity: layer.opacity,
            dashArray: configStyle.dashArray || undefined
          };

          if (layer.isComparison) {
             style = {
               ...getComparisonStyle({} as unknown as Dataset), // Passing a dummy to get the style
               fillOpacity: 0.1 * layer.opacity,
               opacity: layer.opacity
             };
          }

          L.geoJSON(dataToRender, {
            style: style,
            onEachFeature: (f: GeoJSON.Feature, l: import('leaflet').Layer) => {
               if (f.properties) {
                 l.bindPopup(`<b>${layer.name}</b><br/>${Object.keys(f.properties).map(k => `${k}: ${f.properties![k]}`).join('<br/>')}`);
               }
            }
          }).addTo(layerGroupRef.current);
        }
      }
    });
  }, [datasets, viewerState]);

  // Helper: Bounds
  const getMapBounds = (map: import('leaflet').Map): BoundingBox => {
    const b = map.getBounds();
    return { minLat: b.getSouth(), maxLat: b.getNorth(), minLng: b.getWest(), maxLng: b.getEast() };
  };


  const handleMapMove = React.useCallback(() => {
    const currentVs = viewerStateRef.current;
    if (currentVs.fullDatasetMode) return;
    renderLayers(layersRef.current, currentVs);
  }, [renderLayers]);


  // 2. Map Initialization
  useEffect(() => {
    const initTimer = setInterval(() => {
      if (window.L && mapContainerRef.current && !mapInstanceRef.current) {
        clearInterval(initTimer);
        const map = window.L.map(mapContainerRef.current, {
           zoomControl: false,
           attributionControl: true
        }).setView([5.5, -58.8], 7);

        // Initial Tile Layer
        const basemapUrl = theme === 'dark' 
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

        const tileLayer = window.L.tileLayer(basemapUrl, {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap &copy; CartoDB'
        }).addTo(map);
        
        tileLayerRef.current = tileLayer;

        layerGroupRef.current = window.L.layerGroup().addTo(map);
        mapInstanceRef.current = map;

        // Progressive Loading Hook
        map.on('moveend', handleMapMove);
        
        // Initial Sync with props
        if (activeDataset) {
          syncLayersWithState(activeDataset.id, null, null);
        }

        // CRITICAL FIX: Invalidate size after layout settles to prevent clipping errors
        // and force an initial move event to render data if already loaded.
        setTimeout(() => {
           map.invalidateSize();
           map.fire('moveend');
        }, 250);
      }
    }, 100);
    return () => clearInterval(initTimer);
  }, [activeDataset, handleMapMove, syncLayersWithState, theme]);

  // 2.5 Theme Switching Effect
  useEffect(() => {
    if (mapInstanceRef.current && window.L && tileLayerRef.current) {
      const map = mapInstanceRef.current;
      
      // Remove old layer
      map.removeLayer(tileLayerRef.current);
      
      // Add new layer
      const basemapUrl = theme === 'dark' 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
        
      const newTileLayer = window.L.tileLayer(basemapUrl, {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap &copy; CartoDB'
      }).addTo(map);
      
      // Ensure basemap is at the bottom
      newTileLayer.bringToBack();
      
      tileLayerRef.current = newTileLayer;
    }
  }, [theme]);

  // 3. React to Prop Changes (Deep Linking)
  useEffect(() => {
    if (activeDataset && activeDataset.id !== viewerState.primaryDatasetId) {
      setViewerState(prev => ({
         ...prev,
         primaryDatasetId: activeDataset.id,
         loadingStatus: 'LOADING',
         errorMessage: null
      }));
      
      // Initialize Timeline if needed
      if (activeDataset.temporalLayers) {
        const years = getAvailableYears(activeDataset.temporalLayers);
        setAvailableYears(years);
        const defaultYear = years[years.length - 1];
        setViewerState(prev => ({ ...prev, temporalYear: defaultYear }));
      } else {
        setAvailableYears([]);
        setViewerState(prev => ({ ...prev, temporalYear: null }));
      }

      syncLayersWithState(activeDataset.id, viewerState.comparisonDatasetId, viewerState.temporalYear);
    }
  }, [activeDataset, syncLayersWithState, viewerState.comparisonDatasetId, viewerState.primaryDatasetId, viewerState.temporalYear]);

  // 5. Data Loading Pipeline (The Robust Engine)
  useEffect(() => {
    const processLayers = async () => {
      if (!mapInstanceRef.current) return;

      const updatedLayers = [...layers];
      let needsRender = false;

      for (let i = 0; i < updatedLayers.length; i++) {
        const layer = updatedLayers[i];
        
        if (layer.visible && layer.status === 'IDLE') {
           updatedLayers[i].status = 'LOADING';
           setLayers([...updatedLayers]); // Show spinner

           try {
             let loadedData;
             const isGeoTiff = layer.id.toLowerCase().endsWith('.tif') || layer.id.toLowerCase().endsWith('.tiff');

             if (isGeoTiff) {
               const response = await fetch(layer.id);
               if (!response.ok) throw new Error(`Failed to fetch GeoTIFF from ${layer.id}`);
               const arrayBuffer = await response.arrayBuffer();
               if (!georasterRef.current) {
                 const [{ default: pgr }, { default: GRL }] = await Promise.all([
                   import('georaster'),
                   import('georaster-layer-for-leaflet')
                 ]);
                 georasterRef.current = { parseGeoraster: pgr, GeoRasterLayer: GRL };
               }
               loadedData = await georasterRef.current.parseGeoraster(arrayBuffer);
             } else {
               // A. Timeline Handling (Intercept Primary URL)
               const pData = datasets.find(d => d.id === viewerState.primaryDatasetId);
               if (!layer.isComparison && pData && pData.temporalLayers && viewerState.temporalYear) {
                   loadedData = await loadTemporalLayer(pData.temporalLayers, viewerState.temporalYear);
               }
               // B. Standard Load
               else {
                 if (layer.name.includes("Mining")) {
                   updatedLayers[i].status = 'OPTIMIZING';
                   setLayers([...updatedLayers]);
                   loadedData = await loadWithWorker(layer.id);
                 } else {
                   loadedData = await loadGeojsonOnDemand(layer.id);
                 }
               }
             }

             if (loadedData) {
               dataCacheRef.current.set(layer.id + (layer.isComparison ? '_cmp' : ''), loadedData);
               updatedLayers[i].status = 'READY';
               
               // Compute Stats for primary only (only for geojson)
               if (!layer.isComparison && !isGeoTiff) {
                 setActiveStats(computeGeojsonStats(loadedData));
               } else if (!layer.isComparison && isGeoTiff) {
                 setActiveStats(null); // Or some raster stats if available
               }
             } else {
               throw new Error("No data returned");
             }

           } catch (err) {
             console.error("Layer Load Error:", err);
             updatedLayers[i].status = 'ERROR';
             if (!layer.isComparison) {
               setViewerState(prev => ({ ...prev, errorMessage: "Failed to load primary dataset." }));
             }
           }
           needsRender = true;
        }
      }

      if (needsRender) {
        setLayers(updatedLayers);
        renderLayers(updatedLayers, viewerState);
      }
    };

    processLayers();
  }, [layers, viewerState.temporalYear, renderLayers, viewerState, datasets]);

  // 7. Event Handlers
  // Use Refs to access fresh state from within stable Leaflet event listeners
  const handleToggleVisibility = (id: string) => {
    setLayers(prev => {
      const updated = prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l);
      renderLayers(updated, viewerStateRef.current);
      return updated;
    });
  };

  const handleOpacityChange = (id: string, opacity: number) => {
    setLayers(prev => {
      const updated = prev.map(l => l.id === id ? { ...l, opacity } : l);
      renderLayers(updated, viewerStateRef.current);
      return updated;
    });
  };

  const handleComparisonToggle = () => {
    const currentVs = viewerStateRef.current;
    if (currentVs.comparisonDatasetId) {
       // Disable
       setViewerState(prev => ({ ...prev, comparisonDatasetId: null }));
       setLayers(prev => {
         const updated = prev.filter(l => !l.isComparison);
         renderLayers(updated, { ...currentVs, comparisonDatasetId: null });
         return updated;
       });
       
       // Update URL
       updateUrl(currentVs.primaryDatasetId, null);
    } else {
       // Enable (wait for selection)
       setViewerState(prev => ({ ...prev, comparisonDatasetId: 'PENDING' }));
    }
  };

  const handleComparisonSelect = (id: string) => {
     const currentVs = viewerStateRef.current;
     setViewerState(prev => ({ ...prev, comparisonDatasetId: id }));
     syncLayersWithState(currentVs.primaryDatasetId, id, currentVs.temporalYear);
     updateUrl(currentVs.primaryDatasetId, id);
  };

  const updateUrl = (pId: string | null, _cId: string | null) => {
     // NOTE: In a real app we'd push to history. 
     // Here we just ensure we don't break the back button flow handled by App.tsx
     // App.tsx handles URL -> State. Here we just update internal state mostly.
     // To strictly follow protocol, we should use setView to update URL.
     if (pId) {
        // Construct params
        // setView('MAP', { datasetId: pId ... }) 
        // We skip complex deep linking for comparison in this iteration to stay within complexity limits
     }
  };

  // Resolve Legend Entries
  const legendEntries = layers
    .filter(l => l.visible && l.status === 'READY')
    .map(l => {
       const dataset = datasets.find(d => d.geojsonUrl === l.id);
       return dataset ? { datasetTitle: l.name, items: getLegendEntriesForDataset(dataset, l.isComparison) } : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  return (
    <div className="relative w-full h-full flex flex-col bg-gn-surface dark:bg-bloom-dark transition-colors duration-300">
      {/* Map Toolbar */}
      <div className="h-14 bg-gn-elevated dark:bg-black border-b border-gn-border dark:border-white/10 flex items-center justify-between px-6 z-10 transition-colors duration-300">
        <div className="flex items-center gap-4">
          <h2 className="text-gn-foreground dark:text-white font-serif font-bold tracking-wide">GIS VIEWER <span className="text-brand-gold-600 dark:text-guyana-gold text-xs font-mono ml-2">v4.1 (Contract Aligned)</span></h2>
          {viewerState.loadingStatus === 'LOADING' && <span className="text-xs text-blue-500 dark:text-blue-400 animate-pulse font-mono">LOADING DATA...</span>}
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setView('CATALOG')}
            className="text-xs bg-gn-surface-muted dark:bg-white/5 hover:bg-gn-border dark:hover:bg-white/10 text-gn-foreground dark:text-white px-3 py-1.5 rounded border border-gn-border dark:border-white/10 transition-colors"
          >
            Add Data Layer
          </button>
          <button 
            onClick={() => setView('HOME')}
            className="text-xs bg-brand-green-600 dark:bg-bloom-accent hover:bg-brand-green-500 dark:hover:bg-blue-600 text-white px-3 py-1.5 rounded font-bold transition-colors"
          >
            Exit Viewer
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 relative">
         <div id="map" ref={mapContainerRef} className="w-full h-full bg-gray-100 dark:bg-[#121212]" />
         
         {/* Error Toast */}
         {viewerState.errorMessage && (
            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-900/90 text-white px-6 py-3 rounded-full shadow-2xl z-[2000] border border-red-500/50 flex items-center gap-3">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
               <span className="text-sm font-bold">{viewerState.errorMessage}</span>
               <button onClick={() => setViewerState(p => ({...p, errorMessage: null}))} className="ml-2 hover:text-red-200">✕</button>
            </div>
         )}

         {/* NEW: Layer Control Panel */}
         <LayerControlPanel
            layers={layers}
            onToggleVisibility={handleToggleVisibility}
            onOpacityChange={handleOpacityChange}
            fullDatasetMode={viewerState.fullDatasetMode}
            onToggleFullMode={() => {
               setViewerState(p => ({ ...p, fullDatasetMode: !p.fullDatasetMode }));
               // Trigger re-render of current layers
               setTimeout(() => renderLayers(layers, viewerState), 0);
            }}
            comparisonEnabled={!!viewerState.comparisonDatasetId}
            onToggleComparison={handleComparisonToggle}
             comparisonDatasets={datasets.filter(d => d.id !== viewerState.primaryDatasetId && d.geojsonUrl)}
            selectedComparisonId={viewerState.comparisonDatasetId === 'PENDING' ? '' : viewerState.comparisonDatasetId || ''}
            onSelectComparison={handleComparisonSelect}
         />

         {/* NEW: Metadata Sidebar */}
         <ViewerSidebar
            dataset={activeDataset || null}
            quickStats={activeStats}
            onClose={() => { /* Optional collapse logic */ }}
            onViewCatalog={(_id) => setView('CATALOG')}
         />

         {/* NEW: Legend Panel */}
         <LegendPanel entries={legendEntries} />

         {/* Timeline Control (Existing Logic Integrated) */}
         {availableYears.length > 0 && viewerState.temporalYear !== null && (
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-[1000] bg-white/90 dark:bg-black/90 backdrop-blur border border-gn-border dark:border-white/10 p-4 rounded-xl w-80 shadow-2xl animate-in slide-in-from-bottom-4">
               <div className="flex justify-between items-center mb-2">
                 <span className="text-xs font-bold text-brand-gold-600 dark:text-guyana-gold uppercase">Time Travel</span>
                 <span className="text-lg font-bold text-gn-foreground dark:text-white font-mono">{viewerState.temporalYear}</span>
               </div>
               <input 
                 type="range" 
                 min={availableYears[0]} 
                 max={availableYears[availableYears.length - 1]} 
                 step={1}
                 value={viewerState.temporalYear}
                 onChange={(e) => {
                    setViewerState(p => ({ ...p, temporalYear: parseInt(e.target.value) }));
                    // Trigger layer sync will happen via useEffect dependency
                 }}
                 className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-green-600 dark:accent-bloom-accent"
               />
            </div>
         )}
         
         {/* Attribution Footer */}
         <div className="absolute bottom-1 left-1 z-[500] pointer-events-none">
            <div className="bg-white/50 dark:bg-black/50 px-2 py-1 rounded text-[9px] text-gn-foreground-muted dark:text-gray-500 backdrop-blur-sm">
               Sources: Guyana Lands & Surveys • Bureau of Statistics • OpenStreetMap
            </div>
         </div>
      </div>
    </div>
  );
};
