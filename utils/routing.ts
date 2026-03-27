
import { ViewState } from '../types';

export interface RouteParams {
  slug?: string;
  category?: string;
  year?: string;
  month?: string;
  datasetId?: string;
  analysisId?: string;
  searchQuery?: string;
  adminSection?: string;
  supportSection?: string; // New param for Support page anchors
}

const LEGACY_PATHS: Record<string, ViewState> = {
  '/catalog.html': 'CATALOG',
  '/map.html': 'MAP',
  '/about.html': 'ABOUT',
  '/blog.html': 'BLOG_INDEX',
  '/resources.html': 'BLOG_INDEX',
  '/developers.html': 'DOCS',
  '/analysis.html': 'ANALYSIS',
  '/support.html': 'SUPPORT',
  '/report.html': 'REPORT_ISSUE'
};

/**
 * Parses the current browser URL query string into a ViewState and Params object.
 */
export const getViewFromUrl = (search: string, pathname: string = window.location.pathname): { view: ViewState, params: RouteParams, legacyRedirect?: boolean } => {
  const params = new URLSearchParams(search);
  let viewParam = params.get('view')?.toUpperCase();
  let legacyRedirect = false;

  if (!viewParam && LEGACY_PATHS[pathname]) {
    viewParam = LEGACY_PATHS[pathname];
    legacyRedirect = true;
  }
  
  const routeParams: RouteParams = {
    slug: params.get('slug') || undefined,
    category: params.get('category') || undefined,
    year: params.get('year') || undefined,
    month: params.get('month') || undefined,
    datasetId: params.get('datasetId') || undefined,
    analysisId: params.get('analysisId') || undefined,
    searchQuery: params.get('q') || undefined,
    adminSection: params.get('section') || undefined,
    supportSection: params.get('section') || undefined // Map generic 'section' param to supportSection as well
  };

  let view: ViewState = 'HOME';

  if (viewParam) {
    switch (viewParam) {
      case 'HOME': view = 'HOME'; break;
      case 'CATALOG': view = 'CATALOG'; break;
      case 'MAP': view = 'MAP'; break;
      case 'DOCS': view = 'DOCS'; break;
      case 'ANALYSIS': view = 'ANALYSIS'; break;
      case 'ABOUT': view = 'ABOUT'; break;
      case 'SUPPORT': view = 'SUPPORT'; break;
      case 'REPORT_ISSUE': view = 'REPORT_ISSUE'; break;
      case 'INTERNAL_LOG': view = 'INTERNAL_LOG'; break;
      case 'CHANGELOG': view = 'CHANGELOG'; break;
      case 'LOCATOR': view = 'LOCATOR'; break;
      
      // Blog / Resources Mapping
      case 'BLOG':
      case 'RESOURCES': view = 'BLOG_INDEX'; break;
      case 'BLOG_POST':
      case 'RESOURCES_POST': view = 'BLOG_POST'; break;
      case 'BLOG_CATEGORY':
      case 'RESOURCES_CATEGORY': view = 'BLOG_CATEGORY'; break;
      case 'BLOG_ARCHIVE':
      case 'RESOURCES_ARCHIVE': view = 'BLOG_ARCHIVE'; break;
      case 'BLOG_SEARCH':
      case 'RESOURCES_SEARCH': view = 'BLOG_SEARCH'; break;
      
      default: view = 'HOME';
    }
  }

  return { view, params: routeParams, legacyRedirect };
};

/**
 * Validates the route and provides a fallback if parameters are invalid.
 */
export const sanitizeRoute = (view: ViewState, params: RouteParams): { view: ViewState, params: RouteParams, redirected: boolean } => {
  let safeView = view;
  const safeParams = { ...params };
  let redirected = false;

  // 1. Sanitize Viewer
  if (safeView === 'MAP' && safeParams.datasetId) {
    // Validation is deferred since we use async fetching.
  }

  // 2. Sanitize Blog Post
  if (safeView === 'BLOG_POST') {
     if (!safeParams.slug) {
        safeView = 'BLOG_INDEX';
        redirected = true;
     }
  }

  // 4. Sanitize Analysis Detail
  if (safeView === 'ANALYSIS' && safeParams.analysisId) {
      // With dynamic fetching, validation happens on component mount
  }

  return { view: safeView, params: safeParams, redirected };
};

/**
 * Constructs a URL query string based on the target ViewState and parameters.
 */
export const getUrlForView = (view: ViewState, params?: RouteParams): string => {
  const sp = new URLSearchParams();

  let viewParam = 'home';
  switch (view) {
    case 'HOME': viewParam = 'home'; break;
    case 'CATALOG': viewParam = 'catalog'; break;
    case 'MAP': viewParam = 'map'; break;
    case 'DOCS': viewParam = 'docs'; break;
    case 'ANALYSIS': viewParam = 'analysis'; break;
    case 'ABOUT': viewParam = 'about'; break;
    case 'SUPPORT': viewParam = 'support'; break;
    case 'REPORT_ISSUE': viewParam = 'report_issue'; break;
    case 'INTERNAL_LOG': viewParam = 'internal_log'; break;
    case 'CHANGELOG': viewParam = 'changelog'; break;
    case 'LOCATOR': viewParam = 'locator'; break;
    
    case 'BLOG_INDEX': viewParam = 'resources'; break;
    case 'BLOG_POST': viewParam = 'resources_post'; break;
    case 'BLOG_CATEGORY': viewParam = 'resources_category'; break;
    case 'BLOG_ARCHIVE': viewParam = 'resources_archive'; break;
    case 'BLOG_SEARCH': viewParam = 'resources_search'; break;
    default: viewParam = 'home';
  }

  sp.set('view', viewParam);

  if (params?.slug) sp.set('slug', params.slug);
  if (params?.category) sp.set('category', params.category);
  if (params?.year) sp.set('year', params.year);
  if (params?.month) sp.set('month', params.month);
  if (params?.datasetId) sp.set('datasetId', params.datasetId);
  if (params?.analysisId) sp.set('analysisId', params.analysisId);
  if (params?.searchQuery) sp.set('q', params.searchQuery);
  if (params?.adminSection) sp.set('section', params.adminSection);
  if (params?.supportSection) sp.set('section', params.supportSection);

  return `?${sp.toString()}`;
};
