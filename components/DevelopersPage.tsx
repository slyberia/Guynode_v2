
import React from 'react';
import { DevelopersDatasetTable } from './developers/DevelopersDatasetTable';

export const DevelopersPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gn-surface dark:bg-gn-surface-dark text-gn-foreground dark:text-gn-foreground-dark pt-20 px-6 pb-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-20">
        
        {/* Header */}
        <header className="max-w-3xl">
          <span className="text-guyana-gold font-mono text-xs uppercase tracking-widest mb-2 block">Developer Resources</span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-gn-foreground dark:text-gn-foreground-dark mb-6">
            Build with GuyNode
          </h1>
          <p className="text-xl text-gn-foreground-muted dark:text-gn-foreground-muted-dark leading-relaxed">
            Programmatic access to Guyana's National Spatial Data Infrastructure. 
            Integrate verified datasets directly into your applications, analysis workflows, or GIS platforms via our open static API.
          </p>
        </header>

        {/* Architecture Overview */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-gn-surface-muted dark:bg-gn-surface-muted-dark border border-gn-border dark:border-gn-border-dark rounded-xl p-8">
           <div>
              <h2 className="text-2xl font-bold text-gn-foreground dark:text-gn-foreground-dark mb-4">Architecture Overview</h2>
              <p className="text-gn-foreground-muted dark:text-gray-300 leading-relaxed mb-4">
                GuyNode operates as a <strong>Static Geospatial Hub</strong>. This means we do not gate data behind complex authentication flows or rate-limited REST APIs.
              </p>
              <p className="text-gn-foreground-muted dark:text-gray-300 leading-relaxed">
                Datasets are served as optimized, static files (GeoJSON, CSV) via a global CDN. This ensures high availability, low latency, and ease of integration for any client-side or server-side language.
              </p>
           </div>
           <div className="flex flex-col justify-center space-y-4">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-gn-elevated dark:bg-black border border-gn-border dark:border-white/10 rounded flex items-center justify-center font-mono text-xs text-gn-foreground-muted dark:text-gray-500">Your App</div>
                 <div className="flex-1 h-0.5 bg-gn-border dark:bg-white/20 relative">
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[9px] bg-gn-surface-muted dark:bg-black px-1 text-gn-foreground-muted dark:text-gray-500">HTTP GET</div>
                 </div>
                 <div className="w-12 h-12 bg-gn-accent-blue/20 border border-gn-accent-blue/50 rounded flex items-center justify-center font-mono text-xs text-gn-accent-blue">CDN</div>
              </div>
              <div className="text-xs text-gn-foreground-muted dark:text-gray-500 text-center font-mono">
                 Direct File Access • No Auth Headers • CORS Enabled
              </div>
           </div>
        </section>

        {/* Dataset Endpoints */}
        <section>
          <div className="flex items-center gap-4 mb-8">
             <h2 className="text-2xl font-bold text-gn-foreground dark:text-gn-foreground-dark">Dataset Endpoints</h2>
             <div className="h-px bg-gn-border dark:bg-gn-border-dark flex-1"></div>
          </div>
          <DevelopersDatasetTable />
        </section>

        {/* Integration Guides */}
        <section>
           <div className="flex items-center gap-4 mb-8">
             <h2 className="text-2xl font-bold text-gn-foreground dark:text-gn-foreground-dark">Integration Guides</h2>
             <div className="h-px bg-gn-border dark:bg-gn-border-dark flex-1"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* Leaflet */}
             <div className="bg-gn-elevated dark:bg-gn-elevated-dark border border-gn-border dark:border-gn-border-dark rounded-lg p-6 hover:border-gn-foreground-muted dark:hover:border-white/30 transition-colors">
               <div className="w-10 h-10 bg-green-500/20 text-green-400 rounded-lg flex items-center justify-center mb-4 text-xl">🗺️</div>
               <h3 className="font-bold text-gn-foreground dark:text-gn-foreground-dark mb-2">Web Mapping (Leaflet/Mapbox)</h3>
               <p className="text-sm text-gn-foreground-muted dark:text-gray-400 mb-4">
                 Consume GeoJSON endpoints directly via fetch or vector tile services. All endpoints support CORS.
               </p>
               <div className="text-xs bg-gn-surface dark:bg-black p-2 rounded text-gn-foreground-muted dark:text-gray-300 font-mono border border-gn-border dark:border-white/5">
                 L.geoJSON(data).addTo(map);
               </div>
             </div>
             
             {/* Python */}
             <div className="bg-gn-elevated dark:bg-gn-elevated-dark border border-gn-border dark:border-gn-border-dark rounded-lg p-6 hover:border-gn-foreground-muted dark:hover:border-white/30 transition-colors">
               <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center mb-4 text-xl">🐍</div>
               <h3 className="font-bold text-gn-foreground dark:text-gn-foreground-dark mb-2">Python & Data Science</h3>
               <p className="text-sm text-gn-foreground-muted dark:text-gray-400 mb-4">
                 Streamline analysis with GeoPandas. Direct read support allows for reproducible notebooks without local file management.
               </p>
               <div className="text-xs bg-gn-surface dark:bg-black p-2 rounded text-gn-foreground-muted dark:text-gray-300 font-mono border border-gn-border dark:border-white/5">
                 gdf = gpd.read_file(url)
               </div>
             </div>

             {/* QGIS */}
             <div className="bg-gn-elevated dark:bg-gn-elevated-dark border border-gn-border dark:border-gn-border-dark rounded-lg p-6 hover:border-gn-foreground-muted dark:hover:border-white/30 transition-colors">
               <div className="w-10 h-10 bg-orange-500/20 text-orange-400 rounded-lg flex items-center justify-center mb-4 text-xl">🖥️</div>
               <h3 className="font-bold text-gn-foreground dark:text-gn-foreground-dark mb-2">Desktop GIS (QGIS/ArcGIS)</h3>
               <p className="text-sm text-gn-foreground-muted dark:text-gray-400 mb-4">
                 Add layers via "Add Vector Layer" &gt; "Protocol (HTTPS)". Copy the GeoJSON URL from the table above.
               </p>
               <div className="text-xs bg-gn-surface dark:bg-black p-2 rounded text-gn-foreground-muted dark:text-gray-300 font-mono border border-gn-border dark:border-white/5">
                 Source Type: Protocol
               </div>
             </div>
          </div>
        </section>

        {/* Metadata & Standards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
           <div>
              <h2 className="text-2xl font-bold text-gn-foreground dark:text-gn-foreground-dark mb-6">Metadata & Standards</h2>
              <div className="space-y-4 text-gn-foreground-muted dark:text-gray-300">
                <p>
                  Guynode enforces strict metadata standards to ensure interoperability across the ecosystem.
                </p>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <span className="text-guyana-gold font-bold">CRS</span>
                    <span className="text-gn-foreground-muted dark:text-gray-400">All GeoJSON outputs are transformed to <span className="text-gn-foreground dark:text-white font-mono">WGS84 (EPSG:4326)</span>.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-guyana-gold font-bold">Encoding</span>
                    <span className="text-gn-foreground-muted dark:text-gray-400">UTF-8 character encoding is mandatory for all attribute tables.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-guyana-gold font-bold">Topology</span>
                    <span className="text-gn-foreground-muted dark:text-gray-400">Boundaries are simplified for web performance. High-precision files available on request.</span>
                  </li>
                </ul>
              </div>
           </div>
           
           <div className="bg-gn-surface-muted dark:bg-white/5 border border-gn-border dark:border-white/10 rounded-lg p-6">
              <h3 className="text-sm font-bold text-gn-foreground-muted dark:text-gray-500 uppercase tracking-widest mb-4">Example Metadata Object</h3>
              <pre className="text-xs font-mono text-gn-foreground dark:text-gray-300 overflow-x-auto">
{`{
  "type": "Feature",
  "properties": {
    "region_id": "GY-10",
    "region_name": "Upper Demerara-Berbice",
    "population_2012": 39992,
    "last_updated": "2024-01-15T00:00:00Z"
  },
  "geometry": { ... }
}`}
              </pre>
           </div>
        </section>

        {/* Future Roadmap (New) */}
        <section className="bg-gn-surface-muted dark:bg-white/5 border border-gn-border dark:border-white/10 rounded-xl p-8">
           <h3 className="text-xl font-bold text-gn-foreground dark:text-gn-foreground-dark mb-4 flex items-center gap-2">
             Future Capabilities <span className="text-xs font-normal text-gn-foreground-muted dark:text-gray-400 bg-gn-surface dark:bg-black px-2 py-1 rounded uppercase tracking-wide border border-gn-border dark:border-white/10">Planned</span>
           </h3>
           <p className="text-gn-foreground-muted dark:text-gray-300 mb-6 max-w-2xl">
             We are continuously improving the developer experience. The following features are on our exploration roadmap for future iterations:
           </p>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex gap-3">
                 <div className="w-1 h-full bg-blue-500 rounded-full"></div>
                 <div>
                    <h4 className="font-bold text-gn-foreground dark:text-white text-sm">Vector Tiles (MVT)</h4>
                    <p className="text-xs text-gn-foreground-muted dark:text-gray-400 mt-1">
                      Serving heavy layers (e.g. detailed hydrology) as Mapbox Vector Tiles for better client-side performance.
                    </p>
                 </div>
              </div>
              <div className="flex gap-3">
                 <div className="w-1 h-full bg-purple-500 rounded-full"></div>
                 <div>
                    <h4 className="font-bold text-gn-foreground dark:text-white text-sm">Advanced Place Finder</h4>
                    <p className="text-xs text-gn-foreground-muted dark:text-gray-400 mt-1">
                      Expanded gazetteer support for locating informal settlements and historic place names.
                    </p>
                 </div>
              </div>
              <div className="flex gap-3">
                 <div className="w-1 h-full bg-green-500 rounded-full"></div>
                 <div>
                    <h4 className="font-bold text-gn-foreground dark:text-white text-sm">OGC Standards</h4>
                    <p className="text-xs text-gn-foreground-muted dark:text-gray-400 mt-1">
                      Evaluation of WMS/WFS endpoints for direct integration with legacy enterprise GIS software.
                    </p>
                 </div>
              </div>
           </div>
        </section>

        {/* Contribution & License */}
        <section className="border-t border-gn-border dark:border-white/10 pt-12 pb-12">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             <div>
               <h3 className="text-xl font-bold text-gn-foreground dark:text-gn-foreground-dark mb-4">Technical Contributions</h3>
               <p className="text-gn-foreground-muted dark:text-gray-400 mb-4">
                 We welcome submissions from the GIS community. If you maintain a high-value dataset for Guyana, we can host it.
               </p>
               <ul className="text-sm text-gn-foreground-muted dark:text-gray-500 space-y-1 mb-6">
                 <li>• Accepted Formats: GeoJSON, Shapefile (zipped), KML</li>
                 <li>• Metadata Required: Source, Year, License</li>
               </ul>
               <button className="text-gn-accent-blue hover:text-gn-foreground dark:hover:text-white font-bold text-sm">
                 View Submission Guidelines →
               </button>
             </div>

             <div>
               <h3 className="text-xl font-bold text-gn-foreground dark:text-gn-foreground-dark mb-4">Licensing & Usage</h3>
               <p className="text-gn-foreground-muted dark:text-gray-400 text-sm mb-4 leading-relaxed">
                 Unless otherwise noted, data on Guynode is <strong>Public Domain</strong> or Open Data (CC-BY). 
                 We aggregate from official sources (GLSC, Bureau of Statistics) and global open repositories (OSM).
               </p>
               <p className="text-gn-foreground-muted dark:text-gray-400 text-sm leading-relaxed">
                 <strong>Disclaimer:</strong> While we validate data integrity, Guynode is not the legal authority for land disputes. 
                 Use official survey plans for legal boundaries.
               </p>
             </div>
           </div>
        </section>

      </div>
    </div>
  );
};
