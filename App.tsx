
import React, { useState, useEffect } from 'react';
import { ViewState, Dataset } from './types';
import { Navigation } from './components/Navigation';
import { useCatalog } from './context/CatalogContext';
import Hero from './components/Hero';
import { Features } from './components/Features';
import { Analysis } from './components/Analysis'; // Kept for Home Page widget
import { Catalog } from './components/Catalog';
import { Footer } from './components/Footer';

// Lazy Load Map Viewer for Performance Optimization
const GisViewerPage = React.lazy(() => import('./components/GisViewerPage').then(module => ({ default: module.GisViewerPage })));

// Lazy Load Non-Critical Pages
const AnalysisPage = React.lazy(() => import('./components/AnalysisPage').then(module => ({ default: module.AnalysisPage })));
const AnalysisDetailPage = React.lazy(() => import('./components/AnalysisDetailPage').then(module => ({ default: module.AnalysisDetailPage })));
const About = React.lazy(() => import('./pages/About').then(module => ({ default: module.About })));
const Privacy = React.lazy(() => import('./pages/Privacy').then(module => ({ default: module.Privacy })));
const DevelopersPage = React.lazy(() => import('./components/DevelopersPage').then(module => ({ default: module.DevelopersPage })));
const InternalLogPage = React.lazy(() => import('./components/InternalLogPage'));
const ChangelogPage = React.lazy(() => import('./components/ChangelogPage').then(module => ({ default: module.ChangelogPage })));
const SupportPage = React.lazy(() => import('./components/SupportPage').then(module => ({ default: module.SupportPage })));
const ReportIssuePage = React.lazy(() => import('./components/ReportIssuePage').then(module => ({ default: module.ReportIssuePage })));

const LocatorPage = React.lazy(() => import('./pages/LocatorPage').then(module => ({ default: module.LocatorPage })));
const LearnIndexPage = React.lazy(() => import('./pages/learn/LearnIndexPage').then(module => ({ default: module.LearnIndexPage })));
const LearnPostPage = React.lazy(() => import('./pages/learn/LearnPostPage').then(module => ({ default: module.LearnPostPage })));

// Lazy Load Blog Pages (Resources)
const BlogIndexPage = React.lazy(() => import('./pages/blog/BlogIndexPage'));
const BlogPostPage = React.lazy(() => import('./pages/blog/BlogPostPage'));
const BlogCategoryPage = React.lazy(() => import('./pages/blog/BlogCategoryPage'));
const BlogArchivePage = React.lazy(() => import('./pages/blog/BlogArchivePage'));
const BlogSearchPage = React.lazy(() => import('./pages/blog/BlogSearchPage'));

// Core & Utils
import { getViewFromUrl, getUrlForView, sanitizeRoute, RouteParams } from './utils/routing';
import { MetaManager } from './components/core/MetaManager';
import { safeHistoryAvailable } from './utils/env';

/**
 * THEME GUARDRAIL:
 * Do NOT use raw hex colors (e.g. bg-[#000]) or legacy night-* classes directly.
 * Use semantic tokens: bg-gn-surface dark:bg-gn-surface-dark, text-gn-foreground, etc.
 */

const LoadingFallback = () => (
  <div className="min-h-screen bg-gn-surface dark:bg-gn-surface-dark flex items-center justify-center text-gn-foreground dark:text-gn-foreground-dark p-6">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-4 border-brand-green-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-mono text-sm text-brand-green-600 dark:text-gn-accent-dark">Loading GuyNode...</p>
    </div>
  </div>
);

function App() {
  const { datasets, loading, error } = useCatalog();

  const [initialSanitized] = useState(() => {
    const { view, params, legacyRedirect } = getViewFromUrl(window.location.search, window.location.pathname);
    const sanitized = sanitizeRoute(view, params);
    if (legacyRedirect) sanitized.redirected = true;
    return sanitized;
  });

  const [currentView, setCurrentView] = useState<ViewState>(initialSanitized.view);
  const [currentParams, setCurrentParams] = useState<RouteParams>(initialSanitized.params);
  // Theme State Management
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const stored = window.localStorage.getItem('guynode_theme');
      if (stored === 'dark' || stored === 'light') return stored;
    } catch {
      // Access denied or not available
    }
    return 'light';
  });

  // Apply Theme to Root
  useEffect(() => {
    try {
      const root = window.document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
      }
      window.localStorage.setItem('guynode_theme', theme);
    } catch {
      // Access denied
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  const [redirectNotification, setRedirectNotification] = useState<string | null>(
    initialSanitized.redirected ? "The requested view could not be resolved. Showing safe fallback." : null
  );

  useEffect(() => {
    if (redirectNotification) {
      const timer = setTimeout(() => setRedirectNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [redirectNotification]);

  useEffect(() => {
    if (initialSanitized.redirected && safeHistoryAvailable()) {
       const cleanUrl = getUrlForView(initialSanitized.view, initialSanitized.params);
       window.history.replaceState({}, '', cleanUrl);
    }
  }, [initialSanitized]);

  const activeMapDataset = React.useMemo(() => {
    if (currentView === 'MAP' && currentParams.datasetId) {
      return datasets.find((d: Dataset) => d.id === currentParams.datasetId) || null;
    }
    return null;
  }, [currentView, currentParams.datasetId, datasets]);

  useEffect(() => {
    const handlePopState = () => {
      const { view, params } = getViewFromUrl(window.location.search);
      const { view: safeView, params: safeParams, redirected } = sanitizeRoute(view, params);
      
      setCurrentView(safeView);
      setCurrentParams(safeParams);

      if (redirected) {
         setRedirectNotification("The requested URL was invalid. Redirected to safe view.");
         if (safeHistoryAvailable()) {
           window.history.replaceState({}, '', getUrlForView(safeView, safeParams));
         }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigation = (view: ViewState, params: RouteParams = {}) => {
    const { view: safeView, params: safeParams } = sanitizeRoute(view, params);

    setCurrentView(safeView);
    setCurrentParams(safeParams);

    const url = getUrlForView(safeView, safeParams);
    if (safeHistoryAvailable()) {
      window.history.pushState({}, '', url);
    }
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gn-surface dark:bg-gn-surface-dark flex items-center justify-center text-gn-foreground dark:text-gn-foreground-dark">
         <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-brand-green-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-mono text-sm">Loading Application...</p>
         </div>
      </div>
    );
  }

  if (error) {
     return (
        <div className="min-h-screen bg-gn-surface dark:bg-gn-surface-dark flex items-center justify-center text-gn-foreground dark:text-gn-foreground-dark p-6">
           <div className="bg-red-900/10 border border-red-500/30 rounded p-6 max-w-md text-center">
              <h2 className="text-red-500 font-bold mb-2">Failed to Load Data</h2>
              <p className="text-sm">{error}</p>
           </div>
        </div>
     );
  }

  const navigateToBlog = (view: ViewState, params: RouteParams = {}) => {
    handleNavigation(view, params);
  };

  const handleOpenMap = (dataset?: Dataset) => {
    handleNavigation('MAP', dataset ? { datasetId: dataset.id } : {});
  };

  const handleOpenMapById = (datasetId: string) => {
    handleNavigation('MAP', { datasetId });
  };

  const renderContent = () => {
    switch (currentView) {
      case 'HOME':
        return (
          <>
            <Hero setView={(v) => handleNavigation(v)} />
            <Features setView={(v) => handleNavigation(v)} />
            
            <section className="bg-gn-surface-muted dark:bg-gn-surface-muted-dark py-24 border-y border-gn-border dark:border-gn-border-dark transition-colors duration-300">
              <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                 <div className="order-2 lg:order-1">
                   <div className="bg-ink-900 border border-ink-900/10 rounded-lg overflow-hidden relative h-[400px]">
                     <img src="https://images.unsplash.com/photo-1583422409516-2895a77efded?q=80&w=800&auto=format&fit=crop" alt="Aerial view of Georgetown, Guyana, showing coastal city blocks and canals" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-all duration-700" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                     <div className="absolute bottom-8 left-8">
                       <div className="bg-brand-gold-500 text-ink-900 text-xs font-bold px-2 py-1 mb-2 inline-block">OPEN DATA</div>
                       <h3 className="text-2xl text-white font-bold">Standardized & Ready</h3>
                     </div>
                   </div>
                 </div>
                 <div className="order-1 lg:order-2">
                   <h2 className="text-3xl font-serif font-bold text-gn-foreground dark:text-gn-foreground-dark mb-6">Build on Guyana’s open spatial data.</h2>
                   <p className="text-gn-foreground-muted dark:text-gn-foreground-muted-dark text-lg mb-8 leading-relaxed">
                     Guynode turns scattered public maps into a single, GIS-ready catalog for Guyana. Browse boundaries, settlements, elevation, land use and more in a unified interface that feels at home on desktop or mobile. Preview layers instantly in the GIS viewer, then download clean, standardized files to power your own work in QGIS, ArcGIS, or custom applications.
                   </p>
                   <div className="flex flex-col sm:flex-row gap-4">
                     <button
                       onClick={() => handleNavigation('CATALOG')}
                       className="bg-brand-gold-500 dark:bg-gn-accent-gold hover:bg-brand-gold-600 text-ink-900 dark:text-ink-900 font-bold py-3 px-6 rounded transition-colors flex items-center justify-center shadow-sm"
                     >
                       View the Data Catalog →
                     </button>
                     <button
                       onClick={() => handleNavigation('MAP')}
                       className="text-brand-green-600 dark:text-gn-accent-dark border border-brand-green-600 dark:border-gn-accent-dark hover:bg-brand-green-600 hover:text-white dark:hover:bg-gn-accent-dark dark:hover:text-gn-foreground-dark font-bold py-3 px-6 rounded transition-colors flex items-center justify-center"
                     >
                       Open the GIS Viewer →
                     </button>
                   </div>
                 </div>
              </div>
            </section>

            <Analysis /> {/* Widget for Home Page */}
            
            <section className="bg-gn-surface dark:bg-gn-surface-dark py-24 text-gn-foreground dark:text-gn-foreground-dark transition-colors duration-300">
              <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12">
                 <div>
                   <h2 className="text-4xl font-serif font-bold mb-6">Request a Demo</h2>
                   <p className="text-gn-foreground-muted dark:text-gn-foreground-muted-dark text-lg mb-8">
                     Help us connect you to the right person. Whether you are a government agency, a private investor, or a researcher, GuyNode has a tailored solution for you.
                   </p>
                 </div>
                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <label className="sr-only" htmlFor="firstName">First Name</label>
                      <input id="firstName" type="text" placeholder="First Name" className="border border-gn-border dark:border-gn-border-dark bg-gn-elevated dark:bg-gn-elevated-dark p-3 rounded w-full focus:outline-none focus:border-brand-green-500" />
                      
                      <label className="sr-only" htmlFor="lastName">Last Name</label>
                      <input id="lastName" type="text" placeholder="Last Name" className="border border-gn-border dark:border-gn-border-dark bg-gn-elevated dark:bg-gn-elevated-dark p-3 rounded w-full focus:outline-none focus:border-brand-green-500" />
                    </div>
                    <label className="sr-only" htmlFor="email">Business Email</label>
                    <input id="email" type="email" placeholder="Business Email" className="border border-gn-border dark:border-gn-border-dark bg-gn-elevated dark:bg-gn-elevated-dark p-3 rounded w-full focus:outline-none focus:border-brand-green-500" />
                    
                    <label className="sr-only" htmlFor="industry">Industry</label>
                    <select id="industry" className="border border-gn-border dark:border-gn-border-dark bg-gn-elevated dark:bg-gn-elevated-dark p-3 rounded w-full focus:outline-none focus:border-brand-green-500">
                      <option>Select Industry...</option>
                      <option>Energy</option>
                      <option>Agriculture</option>
                      <option>Mining</option>
                      <option>Government</option>
                    </select>
                    <button className="bg-brand-green-600 hover:bg-brand-green-500 dark:bg-gn-accent-dark dark:hover:bg-brand-green-500 text-white font-bold py-4 rounded w-full transition-colors">
                      Submit Request
                    </button>
                    <p className="text-xs text-gn-foreground-muted dark:text-gn-foreground-muted-dark mt-4">
                      By submitting this form, you agree to our Privacy Policy. <br/>
                      Please do not include sensitive personal information.
                    </p>
                 </div>
              </div>
            </section>
          </>
        );
      case 'CATALOG':
        return <Catalog onOpenMap={handleOpenMap} initialSearchQuery={currentParams.searchQuery} />;
      case 'MAP':
        return (
          <React.Suspense fallback={<LoadingFallback />}>
            <GisViewerPage setView={(v) => handleNavigation(v)} activeDataset={activeMapDataset} theme={theme} />
          </React.Suspense>
        );
      case 'DOCS':
        return <React.Suspense fallback={<LoadingFallback />}><DevelopersPage /></React.Suspense>;

      case 'ANALYSIS':
        // If an ID is present, show detail view, else show index
        if (currentParams.analysisId) {
          return <React.Suspense fallback={<LoadingFallback />}><AnalysisDetailPage analysisId={currentParams.analysisId} navigate={handleNavigation} /></React.Suspense>;
        }
        return <React.Suspense fallback={<LoadingFallback />}><AnalysisPage navigate={handleNavigation} /></React.Suspense>;
        
      case 'LOCATOR':
        return (
          <React.Suspense fallback={<LoadingFallback />}>
            <LocatorPage theme={theme} navigate={handleNavigation} />
          </React.Suspense>
        );
      case 'LEARN_INDEX':
        return (
          <React.Suspense fallback={<LoadingFallback />}>
            <LearnIndexPage navigate={handleNavigation} />
          </React.Suspense>
        );
      case 'LEARN_POST':
        return (
          <React.Suspense fallback={<LoadingFallback />}>
            {currentParams.slug
              ? <LearnPostPage slug={currentParams.slug} navigate={handleNavigation} />
              : <LearnIndexPage navigate={handleNavigation} />}
          </React.Suspense>
        );
      case 'ABOUT':
        return <React.Suspense fallback={<LoadingFallback />}><About /></React.Suspense>;
      case 'PRIVACY':
        return <React.Suspense fallback={<LoadingFallback />}><Privacy /></React.Suspense>;
      
      case 'SUPPORT':
        return <React.Suspense fallback={<LoadingFallback />}><SupportPage navigate={handleNavigation} section={currentParams.supportSection} /></React.Suspense>;
      
      case 'REPORT_ISSUE':
        return <React.Suspense fallback={<LoadingFallback />}><ReportIssuePage navigate={handleNavigation} /></React.Suspense>;

      case 'INTERNAL_LOG':
        return <React.Suspense fallback={<LoadingFallback />}><InternalLogPage /></React.Suspense>;
      case 'CHANGELOG':
        return <React.Suspense fallback={<LoadingFallback />}><ChangelogPage /></React.Suspense>;
      
      // Blog Module Routes
      case 'BLOG_INDEX':
        return <React.Suspense fallback={<LoadingFallback />}><BlogIndexPage navigate={navigateToBlog} /></React.Suspense>;
      case 'BLOG_POST':
        return <React.Suspense fallback={<LoadingFallback />}><BlogPostPage navigate={navigateToBlog} params={currentParams} onOpenMap={handleOpenMapById} /></React.Suspense>;
      case 'BLOG_CATEGORY':
        return <React.Suspense fallback={<LoadingFallback />}><BlogCategoryPage navigate={navigateToBlog} params={currentParams} /></React.Suspense>;
      case 'BLOG_ARCHIVE':
        return <React.Suspense fallback={<LoadingFallback />}><BlogArchivePage navigate={navigateToBlog} params={currentParams} /></React.Suspense>;
      case 'BLOG_SEARCH':
        return <React.Suspense fallback={<LoadingFallback />}><BlogSearchPage navigate={navigateToBlog} /></React.Suspense>;
      
      default:
        return (
          <div className="min-h-screen bg-gn-surface dark:bg-gn-surface-dark flex items-center justify-center text-gn-foreground dark:text-gn-foreground-dark p-6">
            <div className="text-center">
              <h1 className="text-4xl font-serif font-bold mb-4">404</h1>
              <p className="text-gn-foreground-muted dark:text-gn-foreground-muted-dark mb-8">Page not found.</p>
              <button
                onClick={() => handleNavigation('HOME')}
                className="bg-brand-green-600 hover:bg-brand-green-500 text-white font-bold py-2 px-6 rounded transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <MetaManager view={currentView} params={currentParams} />
      {/* Skip Link for Accessibility */}
      <a 
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[100] bg-brand-gold-500 text-black px-4 py-2 rounded font-bold shadow-lg"
      >
        Skip to main content
      </a>

      <div className="min-h-screen bg-gn-surface dark:bg-gn-surface-dark text-gn-foreground dark:text-gn-foreground-dark selection:bg-brand-gold-500 selection:text-ink-900 relative transition-colors duration-300">
        <Navigation 
          currentView={currentView} 
          setView={(v) => handleNavigation(v)} 
          theme={theme}
          toggleTheme={toggleTheme}
        />
        
        {redirectNotification && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[100] bg-red-900/90 text-white px-6 py-3 rounded-full shadow-2xl border border-red-500/30 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
             <span className="text-sm font-medium">{redirectNotification}</span>
          </div>
        )}

        <main id="main-content">
          {renderContent()}
        </main>
        <Footer setView={(v, p) => handleNavigation(v, p)} />
      </div>
    </>
  );
}

export default App;
