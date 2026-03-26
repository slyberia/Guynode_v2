
import { ViewState, Dataset, BlogPost } from '../types';
import { RouteParams } from './routing';

export const DEFAULT_TITLE = 'GuyNode — Spatial Data Portal for Guyana';
export const DEFAULT_DESC = 'A centralized spatial data hub for Guyana, featuring a data catalog, GIS viewer, and AI-powered data assistance.';
export const DEFAULT_IMAGE = 'https://guynode.com/og/guynode-og.png';

export const updateMetadata = (view: ViewState, params: RouteParams, datasets: Dataset[], blogPosts: BlogPost[]) => {
  if (typeof document === 'undefined') return;

  let title = DEFAULT_TITLE;
  let description = DEFAULT_DESC;
  const url = window.location.href;
  let type = 'website';
  let image = DEFAULT_IMAGE;

  switch (view) {
    case 'CATALOG':
      title = 'GuyNode Data Catalog — Browse Spatial Datasets';
      description = 'Search and download official geospatial datasets for Guyana. Access boundaries, demographics, and economic data.';
      break;
    case 'MAP':
      title = 'GuyNode GIS Viewer — Interactive Maps';
      description = 'Visualize Guyana\'s spatial data with our advanced mapping engine. Layer multiple datasets for deep insights.';
      if (params.datasetId && datasets) {
        const ds = datasets.find(d => d.id === params.datasetId);
        if (ds) {
          title = `${ds.title} — GIS Viewer`;
          description = `View ${ds.title} on the GuyNode interactive map. Source: ${ds.source}.`;
        }
      }
      break;
    case 'BLOG_INDEX':
      title = 'GuyNode Insights — Blog';
      description = 'Articles, case studies, and engineering updates from the GuyNode team.';
      break;
    case 'BLOG_POST':
      if (params.slug && blogPosts) {
        const post = blogPosts.find(p => p.slug === params.slug);
        if (post) {
          title = `${post.title} — GuyNode Blog`;
          description = post.excerpt;
          type = 'article';
          if (post.heroImageUrl) image = post.heroImageUrl;
        }
      }
      break;
    case 'ABOUT':
      title = 'About GuyNode — Mission & Partners';
      description = 'Bridging the gap in spatial intelligence. Learn about our mission to democratize access to Guyana\'s data.';
      break;
    case 'DOCS':
      title = 'Developer Documentation — GuyNode API';
      break;
    case 'ANALYSIS':
      title = 'Research & Insights — GuyNode';
      break;
  }

  // Update DOM Title
  document.title = title;
  
  // Helper to set meta tag
  const setMeta = (name: string, content: string) => {
    let tag = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(name.startsWith('og:') ? 'property' : 'name', name);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  };

  setMeta('description', description);
  setMeta('og:title', title);
  setMeta('og:description', description);
  setMeta('og:type', type);
  setMeta('og:url', url);
  setMeta('og:image', image);
};
