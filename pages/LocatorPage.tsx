import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ViewState } from '../types';
import { RouteParams } from '../utils/routing';
import { useCatalog } from '../context/CatalogContext';
import { safeUrl } from '../utils/url';
import shp from 'shpjs';

interface LocatorPageProps {
  theme: 'light' | 'dark';
  navigate: (view: ViewState, params?: RouteParams) => void;
}

const LAYER_COLORS = [
  '#2F5F53', '#B8860B', '#1D6B4C', '#CE1126', '#009739',
  '#0C447C', '#7A4A10', '#534AB7',
];

const BASEMAP_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const BASEMAP_DARK  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

type LayerState = 'off' | 'loading' | 'on' | 'error';

interface ManagedLayer {
  id: string;
  title: string;
  downloadUrl: string;
  color: string;
  state: LayerState;
  leafletLayer: import('leaflet').GeoJSON | null;
}

export const LocatorPage: React.FC<LocatorPageProps> = ({ theme }) => {
  const { datasets } = useCatalog();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const baseTileRef = useRef<import('leaflet').TileLayer | null>(null);

  // Build layer list from shapefile datasets
  const shapefileDatasets = React.useMemo(
    () => datasets.filter(d => d.format === 'Shapefile' && d.downloadUrl),
    [datasets]
  );

  const [layers, setLayers] = useState<ManagedLayer[]>([]);

  // Initialise layer list once datasets load
  useEffect(() => {
    setLayers(
      shapefileDatasets.map((d, i) => ({
        id: d.id,
        title: d.title,
        downloadUrl: d.downloadUrl!,
        color: LAYER_COLORS[i % LAYER_COLORS.length],
        state: 'off',
        leafletLayer: null,
      }))
    );
  }, [shapefileDatasets]);

  // Initialise Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return; // already initialised

    const map = L.map(mapContainerRef.current, {
      center: [4.86, -58.93],
      zoom: 7,
      zoomControl: true,
      attributionControl: true,
    });

    const tileUrl = theme === 'dark' ? BASEMAP_DARK : BASEMAP_LIGHT;
    const tile = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution: '© <a href="https://carto.com/">CartoDB</a>',
    }).addTo(map);

    baseTileRef.current = tile;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      baseTileRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap basemap when theme changes
  useEffect(() => {
    const map = mapRef.current;
    const tile = baseTileRef.current;
    if (!map || !tile) return;

    const newUrl = theme === 'dark' ? BASEMAP_DARK : BASEMAP_LIGHT;
    tile.setUrl(newUrl);
  }, [theme]);

  const toggleLayer = useCallback(async (layerId: string) => {
    const map = mapRef.current;
    if (!map) return;

    setLayers(prev => {
      const layer = prev.find(l => l.id === layerId);
      if (!layer) return prev;

      // Turn OFF
      if (layer.state === 'on' && layer.leafletLayer) {
        map.removeLayer(layer.leafletLayer);
        return prev.map(l =>
          l.id === layerId ? { ...l, state: 'off', leafletLayer: null } : l
        );
      }

      // Start loading
      if (layer.state === 'off') {
        return prev.map(l =>
          l.id === layerId ? { ...l, state: 'loading' } : l
        );
      }

      return prev;
    });

    // Fetch & parse outside setState
    setLayers(prev => {
      const layer = prev.find(l => l.id === layerId);
      if (!layer || layer.state !== 'loading') return prev;
      return prev; // actual fetch happens below
    });

    // Do the async fetch after marking loading
    const layerSnap = layers.find(l => l.id === layerId);
    if (!layerSnap || layerSnap.state !== 'off') return;

    const url = safeUrl(layerSnap.downloadUrl);
    if (!url) {
      setLayers(prev =>
        prev.map(l => l.id === layerId ? { ...l, state: 'error' } : l)
      );
      return;
    }

    try {
      const geojson = await shp(url);
      const featureCollection = Array.isArray(geojson) ? geojson[0] : geojson;

      const leafletLayer = L.geoJSON(featureCollection, {
        style: {
          color: layerSnap.color,
          weight: 1.5,
          fillOpacity: 0.15,
          fillColor: layerSnap.color,
        },
        onEachFeature: (feature, featureLayer) => {
          if (!feature.properties) return;
          const rows = Object.entries(feature.properties)
            .map(([k, v]) => `<tr><td style="padding:2px 6px;font-weight:bold">${k}</td><td style="padding:2px 6px">${v ?? '—'}</td></tr>`)
            .join('');
          featureLayer.bindPopup(
            `<table style="font-size:11px;font-family:monospace;border-collapse:collapse">${rows}</table>`,
            { maxHeight: 200 }
          );
        },
      }).addTo(map);

      setLayers(prev =>
        prev.map(l =>
          l.id === layerId ? { ...l, state: 'on', leafletLayer } : l
        )
      );
    } catch {
      setLayers(prev =>
        prev.map(l => l.id === layerId ? { ...l, state: 'error' } : l)
      );
    }
  }, [layers]);

  return (
    <div className="flex h-screen overflow-hidden bg-gn-surface dark:bg-gn-surface-dark">
      {/* Layer Sidebar */}
      <aside className="w-72 flex-shrink-0 flex flex-col border-r border-gn-border dark:border-gn-border-dark bg-gn-surface-muted dark:bg-gn-surface-muted-dark overflow-hidden">
        <div className="px-4 py-3 border-b border-gn-border dark:border-gn-border-dark">
          <h2 className="text-sm font-bold text-gn-foreground dark:text-gn-foreground-dark uppercase tracking-widest">
            Dataset Layers
          </h2>
          <p className="text-[10px] text-gn-foreground-muted dark:text-gn-foreground-muted-dark mt-0.5 font-mono">
            Toggle shapefile layers on the map
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {layers.length === 0 ? (
            <div className="p-4 text-xs text-gn-foreground-muted dark:text-gn-foreground-muted-dark font-mono animate-pulse">
              &gt; Loading layers...
            </div>
          ) : (
            layers.map(layer => (
              <div
                key={layer.id}
                className="flex items-center gap-3 px-4 py-2.5 border-b border-gn-border/50 dark:border-white/5 hover:bg-gn-surface dark:hover:bg-white/5 transition-colors"
              >
                {/* Color swatch */}
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0 border border-black/10"
                  style={{ backgroundColor: layer.color }}
                />

                {/* Toggle checkbox */}
                <label className="flex items-center gap-2 flex-1 cursor-pointer min-w-0">
                  <input
                    type="checkbox"
                    checked={layer.state === 'on'}
                    disabled={layer.state === 'loading'}
                    onChange={() => toggleLayer(layer.id)}
                    className="accent-brand-green-600 dark:accent-gn-accent-gold w-3.5 h-3.5 flex-shrink-0"
                  />
                  <span className="text-xs text-gn-foreground dark:text-gn-foreground-dark truncate leading-snug">
                    {layer.title}
                  </span>
                </label>

                {/* State indicator */}
                <div className="flex-shrink-0 w-4 text-right">
                  {layer.state === 'loading' && (
                    <div className="w-3 h-3 border border-brand-green-600 dark:border-gn-accent-gold border-t-transparent rounded-full animate-spin" />
                  )}
                  {layer.state === 'error' && (
                    <span className="text-red-500 text-[10px] font-bold" title="Load failed">✕</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-gn-border dark:border-gn-border-dark text-[9px] text-gn-foreground-muted dark:text-gn-foreground-muted-dark font-mono">
          Shapefile layers loaded on demand from GCS
        </div>
      </aside>

      {/* Map */}
      <div ref={mapContainerRef} className="flex-1 z-0" />
    </div>
  );
};
