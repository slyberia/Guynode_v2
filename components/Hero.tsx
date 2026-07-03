import React, { useEffect, useState } from 'react';

interface HeroProps {
  setView?: (v: import('../types').ViewState) => void;
}

const Hero: React.FC<HeroProps> = () => {
  const [metrics, setMetrics] = useState({ datasets: 0, vector: 0, raster: 0 });

  useEffect(() => {
    fetch('/data/datasets.json')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const vectorCount = data.filter(d => ['geojson', 'shapefile', 'kml'].includes((d.format || '').toLowerCase())).length;
          const rasterCount = data.filter(d => ['geotiff'].includes((d.format || '').toLowerCase())).length;
          setMetrics({ datasets: data.length, vector: vectorCount, raster: rasterCount });
        }
      })
      .catch(err => console.error('Failed to load metrics:', err));
  }, []);
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 flex flex-col lg:flex-row items-center gap-12">
      
      {/* Left Column: Typography */}
      <div className="lg:w-1/2">
        <h1 className="text-5xl lg:text-6xl font-serif font-bold tracking-tight text-gray-900 leading-tight mb-6">
          Guyana's data in<br />full focus.<br />
          Built for decision<br />makers.
        </h1>
        <p className="text-lg text-gray-700 mb-8 max-w-lg leading-relaxed">
          Guynode is a hub for high-quality spatial data on Guyana — built for students, researchers, public agencies, businesses, and curious citizens who need reliable maps and datasets they can reuse with attribution.
        </p>
        <div className="flex gap-4">
          <a href="/?view=viewer" className="bg-[#2F5F53] dark:bg-[#1D6B4C] text-white px-6 py-3 rounded-md font-medium hover:opacity-90 transition-colors shadow-sm flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
            Map Viewer
          </a>
          <a href="/?view=catalog" className="bg-white border border-gray-300 text-gray-900 px-6 py-3 rounded-md font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
            Data Catalog
          </a>
        </div>
      </div>

      {/* Right Column: Terminal Widget */}
      <div className="lg:w-1/2 w-full">
        <div className="bg-[#FDFBF7] border-2 border-gray-200 rounded-xl shadow-xl overflow-hidden">
          
          {/* Mac Window Header */}
          <div className="bg-[#F3EFE6] px-4 py-3 flex items-center border-b-2 border-gray-200">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="ml-6 text-xs text-gray-500 font-mono tracking-wider">GuyNode_Analytics_Terminal.exe</span>
          </div>

          {/* Terminal Body */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-5 gap-4">
            
            {/* Image Placeholder */}
            <div className="md:col-span-3 h-72 rounded-lg border border-gray-300 relative overflow-hidden">
              <img src="/images/GuyNode_Analytics_Terminal.jpg" alt="GuyNode Analytics Terminal" className="w-full h-full object-cover" />

              {/* Terminal overlay box */}
              <div className="absolute bottom-4 left-4 bg-white/95 px-4 py-3 rounded border border-gray-200 text-xs font-mono text-gray-700 shadow-md">
                &gt; INITIALIZING CATALOG...<br/>
                &gt; CATALOG: {metrics.datasets > 0 ? 'LOADED' : 'LOADING'}<br/>
                &gt; TOTAL_RECORDS: {metrics.datasets > 0 ? metrics.datasets : '...'}
              </div>
            </div>

            {/* Right Side Stats */}
            <div className="md:col-span-2 flex flex-col justify-between gap-4">
              <div className="border border-gray-200 p-4 rounded-lg bg-white shadow-sm">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Datasets</div>
                <div className="text-2xl text-teal-700 font-bold">{metrics.datasets > 0 ? metrics.datasets : '...'}</div>
              </div>
              <div className="border border-gray-200 p-4 rounded-lg bg-white shadow-sm">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Vector Layers</div>
                <div className="text-2xl text-teal-700 font-bold">{metrics.datasets > 0 ? metrics.vector : '...'}</div>
              </div>
              <div className="border border-gray-200 p-4 rounded-lg bg-white shadow-sm">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Raster Layers</div>
                <div className="text-2xl text-yellow-600 font-bold">{metrics.datasets > 0 ? metrics.raster : '...'}</div>
              </div>
            </div>

          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Hero;