import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Dataset } from '../../types';
import { safeUrl } from '../../utils/url';

interface RasterOverlayViewerProps {
  dataset: Dataset;
}

/**
 * Overlays a georeferenced image on a Leaflet basemap using its `georeference`
 * bounds. Only rendered for records that actually carry a real georeference (see
 * hasRasterOverlay) — never bbox-draped. Shows an opacity control and a caption
 * stating the georeference status so an approximate registration reads as such.
 */
export const RasterOverlayViewer: React.FC<RasterOverlayViewerProps> = ({ dataset }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const overlayRef = useRef<import('leaflet').ImageOverlay | null>(null);
  const geo = dataset.georeference;
  const [opacity, setOpacity] = useState(geo?.opacityDefault ?? 0.6);

  const imageUrl = dataset.downloadUrl ? safeUrl(dataset.downloadUrl) : null;

  useEffect(() => {
    if (!containerRef.current || !geo || !imageUrl || mapRef.current) return;
    const bounds = L.latLngBounds(geo.bounds[0], geo.bounds[1]);
    const map = L.map(containerRef.current, { attributionControl: false });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
    overlayRef.current = L.imageOverlay(imageUrl, bounds, { opacity }).addTo(map);
    map.fitBounds(bounds);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 100);
    return () => {
      map.remove();
      mapRef.current = null;
      overlayRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageUrl]);

  useEffect(() => {
    overlayRef.current?.setOpacity(opacity);
  }, [opacity]);

  return (
    <div className="flex flex-col h-full bg-gn-surface dark:bg-gn-surface-dark border-b border-gn-border dark:border-white/10">
      <div ref={containerRef} className="flex-1 min-h-[240px] bg-gn-surface-muted dark:bg-black/40" />
      <div className="px-4 py-3 flex items-center justify-between gap-4 bg-gn-surface-muted dark:bg-gn-surface-muted-dark border-t border-gn-border dark:border-white/10">
        <div className="min-w-0">
          <p className="text-xs font-bold text-gn-foreground dark:text-gn-foreground-dark truncate">{dataset.title}</p>
          <p className="text-[10px] text-gn-foreground-muted dark:text-gn-foreground-muted-dark truncate">
            {geo?.georeferenceStatus === 'approximate'
              ? 'Approximate georeference — alignment is indicative, not survey-accurate.'
              : 'Georeferenced overlay.'}
            {geo?.source ? ` Source: ${geo.source}` : ''}
          </p>
        </div>
        <label className="flex items-center gap-2 text-[10px] text-gn-foreground-muted dark:text-gn-foreground-muted-dark flex-shrink-0">
          Opacity
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="accent-brand-green-600 dark:accent-gn-accent-blue"
          />
        </label>
      </div>
    </div>
  );
};
