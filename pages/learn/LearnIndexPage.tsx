import React, { useEffect, useState } from 'react';
import { ViewState } from '../../types';
import { RouteParams } from '../../utils/routing';

interface LearnPost {
  slug: string;
  title: string;
  category: string;
  difficulty: string;
  readTimeMinutes: number;
  excerpt: string;
}

interface LearnIndexPageProps {
  navigate: (view: ViewState, params?: RouteParams) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  guide:      'bg-brand-green-600/10 text-brand-green-600 dark:bg-nightAccent-green/10 dark:text-nightAccent-green border-brand-green-600/20 dark:border-nightAccent-green/20',
  tutorial:   'bg-bloom-accent/10 text-bloom-accent border-bloom-accent/20',
  concept:    'bg-brand-gold-600/10 text-brand-gold-600 dark:bg-nightAccent-gold/10 dark:text-nightAccent-gold border-brand-gold-600/20 dark:border-nightAccent-gold/20',
  comparison: 'bg-guyana-red/10 text-guyana-red border-guyana-red/20',
};

const PostCard: React.FC<{ post: LearnPost; onClick: () => void }> = ({ post, onClick }) => (
  <button
    onClick={onClick}
    className="text-left w-full bg-gn-elevated dark:bg-gn-elevated-dark border border-gn-border dark:border-gn-border-dark rounded-lg p-5 hover:border-brand-green-600 dark:hover:border-nightAccent-green transition-colors group"
  >
    <div className="flex items-center gap-2 mb-3">
      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${CATEGORY_COLORS[post.category] ?? 'bg-gn-surface dark:bg-gn-surface-dark text-gn-foreground-muted border-gn-border dark:border-gn-border-dark'}`}>
        {post.category}
      </span>
      <span className="text-[10px] text-gn-foreground-muted dark:text-gn-foreground-muted-dark font-mono">
        {post.readTimeMinutes} min read
      </span>
    </div>
    <h3 className="font-bold text-sm text-gn-foreground dark:text-gn-foreground-dark mb-2 group-hover:text-brand-green-600 dark:group-hover:text-nightAccent-green transition-colors">
      {post.title}
    </h3>
    <p className="text-xs text-gn-foreground-muted dark:text-gn-foreground-muted-dark leading-relaxed">
      {post.excerpt}
    </p>
  </button>
);

export const LearnIndexPage: React.FC<LearnIndexPageProps> = ({ navigate }) => {
  const [posts, setPosts] = useState<LearnPost[]>([]);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    fetch('/learn/index.json')
      .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.json(); })
      .then((data: LearnPost[]) => setPosts(data))
      .catch(() => setLoadError(true));
  }, []);

  const goToPost = (slug: string) => navigate('LEARN_POST', { slug });

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const gettingStartedSlugs = ['getting-started-gis-guynode', 'beginner-gis-concepts', 'arcgis-vs-qgis'];
  const tutorialSlugs = ['open-shapefile-qgis', 'open-csv-qgis', 'open-geojson-qgis', 'open-raster-qgis', 'how-to-use-guynode-datasets'];

  const postsBySlug = Object.fromEntries(posts.map(p => [p.slug, p]));

  return (
    <div className="min-h-screen bg-gn-surface dark:bg-gn-surface-dark text-gn-foreground dark:text-gn-foreground-dark transition-colors duration-300">

      {/* HERO */}
      <section className="bg-gn-surface-muted dark:bg-gn-surface-muted-dark border-b border-gn-border dark:border-gn-border-dark py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-green-600 dark:text-nightAccent-green mb-4">
            Guynode Learning Center
          </p>
          <h1 className="text-4xl font-serif font-bold text-gn-foreground dark:text-gn-foreground-dark mb-6 leading-tight">
            Learn GIS with Guynode
          </h1>
          <p className="text-lg text-gn-foreground-muted dark:text-gn-foreground-muted-dark mb-10 leading-relaxed max-w-2xl mx-auto">
            Build practical skills for working with spatial data in Guyana and beyond. Explore beginner guides, software walkthroughs, and step-by-step tutorials designed to help you move from download to map.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => scrollTo('getting-started')}
              className="bg-brand-green-600 hover:bg-brand-green-500 dark:bg-nightAccent-green dark:hover:bg-brand-green-500 text-white font-bold py-3 px-8 rounded transition-colors"
            >
              Start Learning
            </button>
            <button
              onClick={() => scrollTo('tutorials')}
              className="border border-brand-green-600 dark:border-nightAccent-green text-brand-green-600 dark:text-nightAccent-green hover:bg-brand-green-600 hover:text-white dark:hover:bg-nightAccent-green dark:hover:text-gn-foreground-dark font-bold py-3 px-8 rounded transition-colors"
            >
              Explore Tutorials
            </button>
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section className="py-16 px-6 border-b border-gn-border dark:border-gn-border-dark">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-serif font-bold mb-4">A Practical Starting Point for GIS Work</h2>
          <p className="text-gn-foreground-muted dark:text-gn-foreground-muted-dark leading-relaxed text-base">
            Whether you are opening your first shapefile, comparing GIS software, or trying to understand how multiple layers work together, this section is designed to help you build confidence with spatial data. The focus is practical: understand the basics, use Guynode datasets effectively, and develop workflows that can scale from simple map viewing to deeper analysis.
          </p>
        </div>
      </section>

      {/* LEARNING PATHS */}
      <section className="py-16 px-6 bg-gn-surface-muted dark:bg-gn-surface-muted-dark border-b border-gn-border dark:border-gn-border-dark">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-serif font-bold mb-10 text-center">Choose a learning path</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                heading: 'New to GIS',
                body: 'Learn the core ideas behind spatial data, common file types, and the basic tools used to view and analyze them.',
                cta: 'Begin Here',
                slug: 'getting-started-gis-guynode',
              },
              {
                heading: 'Using Guynode Data',
                body: 'Learn how to read a dataset page, download files, open them in GIS software, and understand what the data contains.',
                cta: 'View Workflow',
                slug: 'how-to-use-guynode-datasets',
              },
              {
                heading: 'Software & Setup',
                body: 'Compare ArcGIS and QGIS, then follow step-by-step tutorials for opening common data formats.',
                cta: 'Compare Tools',
                slug: 'arcgis-vs-qgis',
              },
            ].map(path => (
              <div key={path.slug} className="bg-gn-elevated dark:bg-gn-elevated-dark border border-gn-border dark:border-gn-border-dark rounded-lg p-6 flex flex-col gap-4">
                <h3 className="font-bold text-base text-gn-foreground dark:text-gn-foreground-dark">{path.heading}</h3>
                <p className="text-sm text-gn-foreground-muted dark:text-gn-foreground-muted-dark leading-relaxed flex-1">{path.body}</p>
                <button
                  onClick={() => goToPost(path.slug)}
                  className="text-sm font-bold text-brand-green-600 dark:text-nightAccent-green hover:underline text-left"
                >
                  {path.cta} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GETTING STARTED */}
      <section id="getting-started" className="py-16 px-6 border-b border-gn-border dark:border-gn-border-dark">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-serif font-bold mb-3">Getting Started</h2>
          <p className="text-gn-foreground-muted dark:text-gn-foreground-muted-dark mb-10 max-w-2xl">
            New to GIS or returning after a long gap? Start here. These guides explain core concepts, common data types, and the basic tools needed to begin working with Guynode datasets.
          </p>
          {loadError ? (
            <p className="text-red-500 font-mono text-sm">&gt; Failed to load posts.</p>
          ) : posts.length === 0 ? (
            <div className="text-gn-foreground-muted dark:text-gn-foreground-muted-dark font-mono text-sm animate-pulse">&gt; Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {gettingStartedSlugs.map(slug =>
                postsBySlug[slug] ? (
                  <PostCard key={slug} post={postsBySlug[slug]} onClick={() => goToPost(slug)} />
                ) : null
              )}
            </div>
          )}
        </div>
      </section>

      {/* TUTORIALS */}
      <section id="tutorials" className="py-16 px-6 bg-gn-surface-muted dark:bg-gn-surface-muted-dark border-b border-gn-border dark:border-gn-border-dark">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-serif font-bold mb-3">Tutorials</h2>
          <p className="text-gn-foreground-muted dark:text-gn-foreground-muted-dark mb-10 max-w-2xl">
            These practical walkthroughs help you move from downloaded files to working maps. They are designed around the kinds of formats and tasks Guynode users are most likely to encounter.
          </p>
          {loadError ? (
            <p className="text-red-500 font-mono text-sm">&gt; Failed to load posts.</p>
          ) : posts.length === 0 ? (
            <div className="text-gn-foreground-muted dark:text-gn-foreground-muted-dark font-mono text-sm animate-pulse">&gt; Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {tutorialSlugs.map(slug =>
                postsBySlug[slug] ? (
                  <PostCard key={slug} post={postsBySlug[slug]} onClick={() => goToPost(slug)} />
                ) : null
              )}
            </div>
          )}
        </div>
      </section>

      {/* EXTERNAL RESOURCES */}
      <section className="py-16 px-6 border-b border-gn-border dark:border-gn-border-dark">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-serif font-bold mb-3">Go further with trusted resources</h2>
          <p className="text-gn-foreground-muted dark:text-gn-foreground-muted-dark mb-10 max-w-2xl">
            Some topics are best explored through official software documentation. These links are included selectively for users who want to go further.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                title: 'QGIS Official Site',
                url: 'https://qgis.org',
                description: 'Download QGIS and explore official documentation, plugins, and community resources.',
              },
              {
                title: 'ArcGIS Platform',
                url: 'https://www.esri.com',
                description: "Learn more about Esri's geospatial ecosystem, including desktop, web, and organizational GIS tools.",
              },
              {
                title: 'QGIS Documentation',
                url: 'https://docs.qgis.org',
                description: 'Access the official QGIS user manual, tutorials, and training materials.',
              },
            ].map(resource => (
              <a
                key={resource.url}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gn-elevated dark:bg-gn-elevated-dark border border-gn-border dark:border-gn-border-dark rounded-lg p-5 hover:border-brand-green-600 dark:hover:border-nightAccent-green transition-colors group block"
              >
                <h3 className="font-bold text-sm text-gn-foreground dark:text-gn-foreground-dark mb-2 group-hover:text-brand-green-600 dark:group-hover:text-nightAccent-green transition-colors">
                  {resource.title} ↗
                </h3>
                <p className="text-xs text-gn-foreground-muted dark:text-gn-foreground-muted-dark leading-relaxed">
                  {resource.description}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="py-20 px-6 bg-gn-surface-muted dark:bg-gn-surface-muted-dark">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-serif font-bold mb-4">Ready to work with real spatial data?</h2>
          <p className="text-gn-foreground-muted dark:text-gn-foreground-muted-dark mb-8 leading-relaxed">
            Browse Guynode's datasets, open them in your GIS software of choice, and build practical mapping and analysis workflows from the ground up.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('CATALOG')}
              className="bg-brand-green-600 hover:bg-brand-green-500 dark:bg-nightAccent-green dark:hover:bg-brand-green-500 text-white font-bold py-3 px-8 rounded transition-colors"
            >
              Browse Datasets
            </button>
            <button
              onClick={() => scrollTo('tutorials')}
              className="border border-brand-green-600 dark:border-nightAccent-green text-brand-green-600 dark:text-nightAccent-green hover:bg-brand-green-600 hover:text-white dark:hover:bg-nightAccent-green dark:hover:text-gn-foreground-dark font-bold py-3 px-8 rounded transition-colors"
            >
              Open Tutorials
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
