
import React from 'react';
import { ViewState } from '../../types';
import { RouteParams } from '../../utils/routing';
import { useCatalog } from '../../context/CatalogContext';
import { Helmet } from 'react-helmet-async';

interface MetaManagerProps {
  view: ViewState;
  params: RouteParams;
}

const DEFAULT_DESC = "Guynode is a static, zero-tracking spatial data archive. No accounts, no data harvesting, no AI runtime.";

export const MetaManager: React.FC<MetaManagerProps> = ({ view, params }) => {
  const { datasets, blogPosts } = useCatalog();

  let pageName = 'Home';
  let description = DEFAULT_DESC;
  const baseUrl = 'https://guynode.com';
  let canonicalUrl = baseUrl;
  let noIndex = false;

  switch (view) {
    case 'HOME':
      pageName = 'Home';
      canonicalUrl = `${baseUrl}/`;
      break;
    case 'CATALOG':
      pageName = 'Data Catalog';
      canonicalUrl = `${baseUrl}/?view=CATALOG`;
      break;
    case 'MAP':
      pageName = 'GIS Viewer';
      canonicalUrl = `${baseUrl}/?view=MAP`;
      if (params.datasetId && datasets) {
        const ds = datasets.find(d => d.id === params.datasetId);
        if (ds) {
          pageName = ds.title;
          description = `View ${ds.title} on the Guynode interactive map. Source: ${ds.source}.`;
          canonicalUrl = `${baseUrl}/?view=CATALOG`; // Canonical points to catalog for datasets
          noIndex = true;
        }
      }
      break;
    case 'DOCS':
      pageName = 'Developers';
      canonicalUrl = `${baseUrl}/?view=DOCS`;
      break;
    case 'ANALYSIS':
      pageName = 'Analysis';
      canonicalUrl = `${baseUrl}/?view=ANALYSIS`;
      break;
    case 'ABOUT':
      pageName = 'About';
      canonicalUrl = `${baseUrl}/?view=ABOUT`;
      break;
    case 'SUPPORT':
      pageName = 'Support & Legal';
      canonicalUrl = `${baseUrl}/?view=SUPPORT`;
      break;
    case 'REPORT_ISSUE':
      pageName = 'Report Issue';
      canonicalUrl = `${baseUrl}/?view=REPORT_ISSUE`;
      break;
    case 'BLOG_INDEX':
      pageName = 'Resources';
      canonicalUrl = `${baseUrl}/?view=BLOG_INDEX`;
      break;
    case 'BLOG_POST':
      if (params.slug && blogPosts) {
        const post = blogPosts.find(p => p.slug === params.slug);
        if (post) {
          pageName = post.title;
          description = post.excerpt;
          canonicalUrl = `${baseUrl}/?view=BLOG_POST&slug=${params.slug}`;
        } else {
          pageName = 'Resource';
          canonicalUrl = `${baseUrl}/?view=BLOG_INDEX`;
        }
      } else {
        pageName = 'Resource';
        canonicalUrl = `${baseUrl}/?view=BLOG_INDEX`;
      }
      break;
    case 'LOCATOR':
      pageName = 'Locator';
      canonicalUrl = `${baseUrl}/?view=LOCATOR`;
      break;
    case 'INTERNAL_LOG':
      pageName = 'Internal Log';
      noIndex = true;
      break;
    case 'CHANGELOG':
      pageName = 'Changelog';
      canonicalUrl = `${baseUrl}/?view=CHANGELOG`;
      break;
    case 'BLOG_CATEGORY':
      pageName = 'Resource Category';
      canonicalUrl = `${baseUrl}/?view=BLOG_INDEX`;
      break;
    case 'BLOG_ARCHIVE':
      pageName = 'Resource Archive';
      canonicalUrl = `${baseUrl}/?view=BLOG_INDEX`;
      break;
    case 'BLOG_SEARCH':
      pageName = 'Resource Search';
      canonicalUrl = `${baseUrl}/?view=BLOG_INDEX`;
      break;
    case 'LEARN_INDEX':
      pageName = 'Learn';
      canonicalUrl = `${baseUrl}/?view=LEARN`;
      break;
    case 'LEARN_POST':
      if (params.slug) {
        pageName = `Learn — ${params.slug
          .split('-')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')}`;
        canonicalUrl = `${baseUrl}/?view=LEARN_POST&slug=${params.slug}`;
      } else {
        pageName = 'Learn';
        canonicalUrl = `${baseUrl}/?view=LEARN`;
      }
      break;
    default:
      pageName = 'Page Not Found';
      noIndex = true;
      break;
  }

  const title = `Guynode | ${pageName}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noIndex && <meta name="robots" content="noindex" />}
    </Helmet>
  );
};
