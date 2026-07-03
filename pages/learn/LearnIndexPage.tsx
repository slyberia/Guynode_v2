import React, { useEffect, useState } from 'react';
import { ViewState } from '../../types';
import { RouteParams } from '../../utils/routing';

interface Resource {
  id: string;
  title: string;
  resourceType: 'web-map-app' | 'data-portal' | 'commercial-reference' | 'tutorial' | 'manual-review' | 'source-reference';
  url: string;
  description: string;
  relatedDatasets?: string[];
  status: string;
  migrationDecision: string;
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
  'manual-review': 'bg-gn-surface-muted dark:bg-gn-surface-muted-dark text-gn-foreground dark:text-gn-foreground-dark border-gn-border dark:border-gn-border-dark'
};

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  'web-map-app': 'Web Map & App',
  'data-portal': 'Data Portal',
  'commercial-reference': 'Commercial Reference',
  'tutorial': 'Tutorial',
  'source-reference': 'Source Reference',
  'manual-review': 'Other Resource'
};

const ResourceCard: React.FC<{ resource: Resource }> = ({ resource }) => (
  <a
    href={resource.url}
    target="_blank"
    rel="noopener noreferrer"
    className="text-left w-full bg-gn-elevated dark:bg-gn-elevated-dark border border-gn-border dark:border-gn-border-dark rounded-lg p-5 hover:border-brand-green-600 dark:hover:border-gn-accent-dark transition-colors group block h-full flex flex-col"
  >
    <div className="flex items-center gap-2 mb-3">
      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${RESOURCE_TYPE_COLORS[resource.resourceType] || RESOURCE_TYPE_COLORS['manual-review']}`}>
        {RESOURCE_TYPE_LABELS[resource.resourceType] || resource.resourceType}
      </span>
    </div>
    <h3 className="font-bold text-sm text-gn-foreground dark:text-gn-foreground-dark mb-2 group-hover:text-brand-green-600 dark:group-hover:text-gn-accent-dark transition-colors">
      {resource.title} ↗
    </h3>
    <p className="text-xs text-gn-foreground-muted dark:text-gn-foreground-muted-dark leading-relaxed flex-1">
      {resource.description}
    </p>
    {resource.relatedDatasets && resource.relatedDatasets.length > 0 && (
      <div className="mt-4 pt-3 border-t border-gn-border dark:border-gn-border-dark">
        <span className="text-[10px] text-gn-foreground-muted">Related to {resource.relatedDatasets.length} datasets</span>
      </div>
    )}
  </a>
);

export const LearnIndexPage: React.FC<LearnIndexPageProps> = ({ navigate }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    fetch('/data/resources.json')
      .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.json(); })
      .then((data: Resource[]) => setResources(data))
      .catch(() => setLoadError(true));
  }, []);

  const resourceTypes = Array.from(new Set(resources.map(r => r.resourceType))).sort();

  const filteredResources = activeFilter === 'all' 
    ? resources 
    : resources.filter(r => r.resourceType === activeFilter);

  return (
    <div className="min-h-screen bg-gn-surface dark:bg-gn-surface-dark text-gn-foreground dark:text-gn-foreground-dark transition-colors duration-300">

      {/* HERO */}
      <section className="bg-gn-surface-muted dark:bg-gn-surface-muted-dark border-b border-gn-border dark:border-gn-border-dark py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-green-600 dark:text-gn-accent-dark mb-4">
            Guynode External Directory
          </p>
          <h1 className="text-4xl font-serif font-bold text-gn-foreground dark:text-gn-foreground-dark mb-6 leading-tight">
            GIS Resources & Portals
          </h1>
          <p className="text-lg text-gn-foreground-muted dark:text-gn-foreground-muted-dark mb-10 leading-relaxed max-w-2xl mx-auto">
            Explore web maps, external data portals, and interactive tools that provide additional context to Guynode's spatial catalog.
          </p>
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map(resource => (
                <ResourceCard key={resource.id} resource={resource} />
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
            While these external resources provide great context, Guynode's primary mission is hosting downloadable data files.
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
