import React, { useEffect, useState, useMemo } from 'react';
import { ViewState } from '../../types';
import { RouteParams } from '../../utils/routing';

interface Resource {
  id: string;
  title: string;
  resourceType: 'web-map-app' | 'data-portal' | 'commercial-reference' | 'tutorial' | 'manual-review' | 'source-reference' | 'reference';
  url: string;
  description: string;
  relatedDatasets?: string[];
  status: string;
  migrationDecision: string;
  metadataConfidence?: string;
  metadataSource?: string;
  thumbnailType?: string;
}

interface Dataset {
  id: string;
  title: string;
  // ... other fields
}

interface LearnIndexPageProps {
  navigate: (view: ViewState, params?: RouteParams) => void;
}

const RESOURCE_TYPE_COLORS: Record<string, string> = {
  'web-map-app': 'bg-brand-green-600/10 text-brand-green-600 border-brand-green-600/20 dark:bg-gn-accent-dark/10 dark:text-gn-accent-dark dark:border-gn-accent-dark/20',
  'data-portal': 'bg-gn-accent-blue/10 text-gn-accent-blue border-gn-accent-blue/20 dark:bg-gn-accent-blue/10 dark:text-gn-accent-blue dark:border-gn-accent-blue/20',
  'commercial-reference': 'bg-guyana-red/10 text-guyana-red border-guyana-red/20 dark:bg-guyana-red/10 dark:text-guyana-red dark:border-guyana-red/20',
  'tutorial': 'bg-brand-gold-600/10 text-brand-gold-600 border-brand-gold-600/20 dark:bg-gn-accent-gold/10 dark:text-gn-accent-gold dark:border-gn-accent-gold/20',
  'source-reference': 'bg-gn-foreground-muted/10 text-gn-foreground-muted border-gn-foreground-muted/20 dark:bg-gn-foreground-muted-dark/10 dark:text-gn-foreground-muted-dark dark:border-gn-foreground-muted-dark/20',
  'reference': 'bg-gn-surface-muted dark:bg-gn-surface-muted-dark text-gn-foreground dark:text-gn-foreground-dark border-gn-border dark:border-gn-border-dark',
  'manual-review': 'bg-gn-surface-muted dark:bg-gn-surface-muted-dark text-gn-foreground dark:text-gn-foreground-dark border-gn-border dark:border-gn-border-dark'
};

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  'web-map-app': 'Web Map & App',
  'data-portal': 'Data Portal',
  'commercial-reference': 'Commercial Reference',
  'tutorial': 'Tutorial',
  'source-reference': 'Source Reference',
  'reference': 'Legacy Reference',
  'manual-review': 'Other Resource'
};

const THUMBNAIL_ICONS: Record<string, string> = {
  'data-portal': '🗄️',
  'tutorial': '📚',
  'source-reference': '🔗',
  'reference': '📁',
  'web-map-app': '🗺️',
  'commercial-reference': '🛒'
};

const ResourceModal: React.FC<{ 
  resource: Resource | null, 
  datasetsMap: Record<string, string>, 
  onClose: () => void 
}> = ({ resource, datasetsMap, onClose }) => {
  
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!resource) return null;

  const icon = THUMBNAIL_ICONS[resource.thumbnailType || resource.resourceType] || '📄';
  const relatedCount = resource.relatedDatasets?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-gn-surface dark:bg-gn-surface-dark border border-gn-border dark:border-gn-border-dark rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header / Thumbnail Area */}
        <div className="h-40 sm:h-48 bg-gn-surface-muted dark:bg-gn-surface-muted-dark flex flex-col items-center justify-center border-b border-gn-border dark:border-gn-border-dark relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 transition-colors text-gn-foreground dark:text-gn-foreground-dark font-bold"
            aria-label="Close modal"
          >
            ×
          </button>
          <div className="text-6xl mb-2">{icon}</div>
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${RESOURCE_TYPE_COLORS[resource.resourceType] || RESOURCE_TYPE_COLORS['reference']}`}>
            {RESOURCE_TYPE_LABELS[resource.resourceType] || resource.resourceType}
          </span>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <h2 className="text-2xl font-bold text-gn-foreground dark:text-gn-foreground-dark mb-4">{resource.title}</h2>
          <p className="text-gn-foreground-muted dark:text-gn-foreground-muted-dark leading-relaxed mb-6">
            {resource.description}
          </p>

          {relatedCount > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gn-foreground dark:text-gn-foreground-dark uppercase tracking-wider mb-3">Related Datasets ({relatedCount})</h3>
              <ul className="space-y-2">
                {resource.relatedDatasets!.map(id => (
                  <li key={id} className="text-sm flex items-start gap-2">
                    <span className="text-brand-green-600 dark:text-gn-accent-dark mt-0.5">↳</span>
                    <span className="text-gn-foreground-muted dark:text-gn-foreground-muted-dark">{datasetsMap[id] || id}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {resource.metadataSource && (
            <div className="mt-4 pt-4 border-t border-gn-border dark:border-gn-border-dark text-xs text-gn-foreground-muted/60 dark:text-gn-foreground-muted-dark/60">
              <p>Metadata Confidence: <span className="uppercase">{resource.metadataConfidence}</span></p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gn-border dark:border-gn-border-dark bg-gn-surface-muted/30 dark:bg-gn-surface-muted-dark/30 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded text-sm font-bold text-gn-foreground-muted dark:text-gn-foreground-muted-dark hover:text-gn-foreground dark:hover:text-gn-foreground-dark transition-colors"
          >
            Cancel
          </button>
          <a 
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 rounded text-sm font-bold bg-brand-green-600 hover:bg-brand-green-500 dark:bg-gn-accent-dark dark:hover:bg-gn-accent-green text-white transition-colors"
          >
            Visit Resource ↗
          </a>
        </div>
      </div>
    </div>
  );
};

export const LearnIndexPage: React.FC<LearnIndexPageProps> = ({ navigate }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [datasetsMap, setDatasetsMap] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/data/resources.json').then(r => r.json()),
      fetch('/data/datasets.json').then(r => r.json())
    ])
    .then(([resData, dsData]) => {
      setResources(resData);
      
      const map: Record<string, string> = {};
      dsData.forEach((d: Dataset) => {
        map[d.id] = d.title;
      });
      setDatasetsMap(map);
    })
    .catch((err) => {
      console.error("Failed to fetch resources or datasets", err);
      setLoadError(true);
    });
  }, []);

  // Curated order for resource types
  const curatedOrder = ['data-portal', 'tutorial', 'web-map-app', 'source-reference', 'commercial-reference', 'reference', 'manual-review'];
  const resourceTypes = Array.from(new Set(resources.map(r => r.resourceType)))
    .sort((a, b) => {
      const idxA = curatedOrder.indexOf(a);
      const idxB = curatedOrder.indexOf(b);
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

  const filteredResources = useMemo(() => {
    return resources.filter(r => {
      const matchesFilter = activeFilter === 'all' || r.resourceType === activeFilter;
      if (!matchesFilter) return false;
      
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.url.toLowerCase().includes(q) ||
          (RESOURCE_TYPE_LABELS[r.resourceType] || r.resourceType).toLowerCase().includes(q)
        );
      }
      
      return true;
    }).sort((a, b) => a.title.localeCompare(b.title));
  }, [resources, activeFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-gn-surface dark:bg-gn-surface-dark text-gn-foreground dark:text-gn-foreground-dark transition-colors duration-300">
      
      {/* Modal */}
      <ResourceModal 
        resource={selectedResource} 
        datasetsMap={datasetsMap} 
        onClose={() => setSelectedResource(null)} 
      />

      {/* HERO */}
      <section className="bg-gn-surface-muted dark:bg-gn-surface-muted-dark border-b border-gn-border dark:border-gn-border-dark py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-green-600 dark:text-gn-accent-dark mb-4">
            Guynode External Directory
          </p>
          <h1 className="text-4xl font-serif font-bold text-gn-foreground dark:text-gn-foreground-dark mb-6 leading-tight">
            GIS Resources
          </h1>
          <div className="text-lg text-gn-foreground-muted dark:text-gn-foreground-muted-dark mb-10 leading-relaxed max-w-3xl mx-auto space-y-4">
            <p>
              While Guynode's <strong>Data Catalog</strong> hosts internal, downloadable spatial files, this page serves as an index for valuable <em>external</em> context. 
            </p>
            <p className="text-base">
              Use this directory to discover official government <strong>Data Portals</strong>, authoritative <strong>Source References</strong>, and educational <strong>Tutorials</strong> that complement our spatial catalog and aid in topographical analysis of Guyana.
            </p>
          </div>
          
          <div className="max-w-xl mx-auto relative text-left">
            <input 
              type="text" 
              placeholder="Search resources by title, description, or domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gn-surface dark:bg-gn-surface-dark border-2 border-gn-border dark:border-gn-border-dark rounded-full py-4 pl-6 pr-12 focus:outline-none focus:border-brand-green-600 dark:focus:border-gn-accent-dark transition-colors text-gn-foreground dark:text-gn-foreground-dark"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gn-foreground-muted hover:text-gn-foreground w-8 h-8 flex items-center justify-center rounded-full bg-gn-surface-muted dark:bg-gn-surface-muted-dark transition-colors"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </section>

      {/* RESOURCES BROWSER */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-10 pb-6 border-b border-gn-border dark:border-gn-border-dark">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-colors border ${activeFilter === 'all' ? 'bg-brand-green-600 border-brand-green-600 text-white dark:bg-gn-accent-dark dark:border-gn-accent-dark dark:text-gn-foreground-dark' : 'bg-transparent border-gn-border text-gn-foreground-muted hover:border-brand-green-600 dark:border-gn-border-dark dark:text-gn-foreground-muted-dark dark:hover:border-gn-accent-dark'}`}
            >
              All Resources ({resources.length})
            </button>
            {resourceTypes.map(type => (
              <button
                key={type}
                onClick={() => setActiveFilter(type)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-colors border ${activeFilter === type ? 'bg-brand-green-600 border-brand-green-600 text-white dark:bg-gn-accent-dark dark:border-gn-accent-dark dark:text-gn-foreground-dark' : 'bg-transparent border-gn-border text-gn-foreground-muted hover:border-brand-green-600 dark:border-gn-border-dark dark:text-gn-foreground-muted-dark dark:hover:border-gn-accent-dark'}`}
              >
                {RESOURCE_TYPE_LABELS[type] || type} ({resources.filter(r => r.resourceType === type).length})
              </button>
            ))}
          </div>

          {/* Grid */}
          {loadError ? (
            <p className="text-red-500 font-mono text-sm">&gt; Failed to load resources.</p>
          ) : resources.length === 0 ? (
            <div className="text-gn-foreground-muted dark:text-gn-foreground-muted-dark font-mono text-sm animate-pulse">&gt; Loading...</div>
          ) : filteredResources.length === 0 ? (
             <div className="text-center py-20">
               <p className="text-gn-foreground-muted dark:text-gn-foreground-muted-dark">No resources found matching "{searchQuery}"</p>
               <button onClick={() => setSearchQuery('')} className="mt-4 text-brand-green-600 dark:text-gn-accent-dark hover:underline font-bold">Clear search</button>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map(resource => (
                <button
                  key={resource.id}
                  onClick={() => setSelectedResource(resource)}
                  className="text-left w-full bg-gn-elevated dark:bg-gn-elevated-dark border border-gn-border dark:border-gn-border-dark rounded-lg p-5 hover:border-brand-green-600 dark:hover:border-gn-accent-dark transition-colors group block h-full flex flex-col focus:outline-none focus:ring-2 focus:ring-brand-green-600/50"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${RESOURCE_TYPE_COLORS[resource.resourceType] || RESOURCE_TYPE_COLORS['reference']}`}>
                      {RESOURCE_TYPE_LABELS[resource.resourceType] || resource.resourceType}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-gn-foreground dark:text-gn-foreground-dark mb-2 group-hover:text-brand-green-600 dark:group-hover:text-gn-accent-dark transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-xs text-gn-foreground-muted dark:text-gn-foreground-muted-dark leading-relaxed flex-1 line-clamp-3">
                    {resource.description}
                  </p>
                  {resource.relatedDatasets && resource.relatedDatasets.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gn-border dark:border-gn-border-dark">
                      <span className="text-[10px] text-gn-foreground-muted">Related to {resource.relatedDatasets.length} datasets</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="py-20 px-6 bg-gn-surface-muted dark:bg-gn-surface-muted-dark border-t border-gn-border dark:border-gn-border-dark">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-serif font-bold mb-4">Looking for local datasets?</h2>
          <p className="text-gn-foreground-muted dark:text-gn-foreground-muted-dark mb-8 leading-relaxed">
            While these external resources provide great context, Guynode's primary mission is hosting downloadable data files in the Data Catalog.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => navigate('CATALOG')}
              className="bg-brand-green-600 hover:bg-brand-green-500 dark:bg-gn-accent-dark dark:hover:bg-gn-accent-green text-white font-bold py-3 px-8 rounded transition-colors"
            >
              Browse Data Catalog
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
