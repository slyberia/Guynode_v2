
import React, { useState } from 'react';
import { Dataset } from '../../types';
import { generateDeveloperDocSnippet } from '../../utils/developerDocs';

interface Props {
  dataset: Dataset;
}

export const DatasetEndpointPanel: React.FC<Props> = ({ dataset }) => {
  const [activeTab, setActiveTab] = useState<'js' | 'py' | 'cli'>('js');
  const [copied, setCopied] = useState(false);

  const url = dataset.geojsonUrl || dataset.downloadUrl || 'https://api.guynode.com/v1/datasets/' + dataset.id;

  const snippets = {
    js: `// Load ${dataset.title} into Leaflet
fetch('${url}')
  .then(response => response.json())
  .then(data => {
    L.geoJSON(data, {
      style: { color: '#FFC20E', weight: 2 }
    }).addTo(map);
  });`,
    py: `# Load ${dataset.title} with GeoPandas
import geopandas as gpd

url = "${url}"
gdf = gpd.read_file(url)
print(gdf.head())`,
    cli: `# Download ${dataset.title}
curl -L -o ${dataset.id}.${dataset.format.toLowerCase()} "${url}"`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopySummary = () => {
     navigator.clipboard.writeText(generateDeveloperDocSnippet(dataset));
     alert('Summary copied to clipboard');
  }

  return (
    <div className="bg-black/50 border border-white/10 rounded-lg p-4 mt-4 animate-in fade-in slide-in-from-top-2">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Integration Snippets
        </h4>
        <button onClick={handleCopySummary} className="text-[10px] text-gray-500 hover:text-white underline">
            Copy Dev Summary
        </button>
      </div>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-white/10 pb-2">
        {(['js', 'py', 'cli'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-xs font-bold px-3 py-1 rounded transition-colors ${
              activeTab === tab 
                ? 'bg-bloom-accent text-white' 
                : 'text-gray-500 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab === 'js' ? 'JavaScript' : tab === 'py' ? 'Python' : 'CLI'}
          </button>
        ))}
      </div>

      {/* Code Area */}
      <div className="relative group">
        <pre className="bg-black border border-white/10 rounded p-4 text-xs font-mono text-gray-300 overflow-x-auto">
          {snippets[activeTab]}
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded transition-colors opacity-0 group-hover:opacity-100"
        >
          {copied ? 'COPIED!' : 'COPY CODE'}
        </button>
      </div>

      <div className="mt-2 text-[10px] text-gray-500 font-mono">
        Endpoint: <span className="text-gray-400">{url}</span>
      </div>
    </div>
  );
};
