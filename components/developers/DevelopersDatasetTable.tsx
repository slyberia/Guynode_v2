
import React, { useState, useMemo } from 'react';
import { DatasetEndpointPanel } from './DatasetEndpointPanel';
import { useCatalog } from '../../context/CatalogContext';

export const DevelopersDatasetTable: React.FC = () => {
  const { datasets } = useCatalog();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return datasets.filter(d => {
      const matchSearch = d.title.toLowerCase().includes(search.toLowerCase()) || 
                          d.id.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === 'ALL' || d.category === category;
      return matchSearch && matchCat;
    });
  }, [search, category, datasets]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
           <button 
             onClick={() => setCategory('ALL')}
             className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${category === 'ALL' ? 'bg-white text-black border-white' : 'text-gray-400 border-white/20'}`}
           >
             ALL
           </button>
           {['Boundaries', 'Demographics', 'Environment', 'Economy', 'Infrastructure', 'Reference', 'Administrative Boundaries', 'Planning and Development'].map(c => (
             <button 
               key={c}
               onClick={() => setCategory(c)}
               className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors whitespace-nowrap ${category === c ? 'bg-bloom-accent text-white border-bloom-accent' : 'text-gray-400 border-white/20'}`}
             >
               {c}
             </button>
           ))}
        </div>
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter datasets..."
          className="bg-black/50 border border-white/20 rounded px-4 py-2 text-sm text-white focus:border-guyana-gold outline-none w-full md:w-64"
        />
      </div>

      {/* Table */}
      <div className="border border-white/10 rounded-lg overflow-hidden bg-bloom-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 border-b border-white/10 text-gray-400 text-xs uppercase font-bold">
              <tr>
                <th className="px-6 py-4">Dataset Name</th>
                <th className="px-6 py-4">Format</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(d => (
                <React.Fragment key={d.id}>
                  <tr className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{d.title}</div>
                      <div className="text-xs text-gray-500 font-mono mt-1">ID: {d.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-white/10 px-2 py-1 rounded text-xs font-mono text-gray-300">
                        {d.format}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{d.category}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                        className={`text-xs font-bold px-3 py-1.5 rounded transition-colors border ${expandedId === d.id ? 'bg-bloom-accent border-bloom-accent text-white' : 'border-white/20 text-gray-400 hover:text-white hover:border-white'}`}
                      >
                        {expandedId === d.id ? 'Hide Code' : 'View Code'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === d.id && (
                    <tr>
                      <td colSpan={4} className="px-6 pb-6 pt-0 bg-white/5 border-b border-white/5">
                        <DatasetEndpointPanel dataset={d} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">
                    No datasets match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
