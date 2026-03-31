
import React from 'react';
import { ViewState } from '../types';

interface NavigationProps {
  currentView: ViewState;
  setView: (view: ViewState, params?: import("../utils/routing").RouteParams) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, setView, theme, toggleTheme }) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setView('CATALOG', { searchQuery: searchQuery });
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gn-border dark:border-gn-border-dark bg-gn-surface-muted/90 dark:bg-gn-surface-muted-dark/90 backdrop-blur-md transition-colors duration-300" role="navigation" aria-label="Main Navigation">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <button 
          className="flex items-center gap-3 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-brand-green-500 rounded p-1"
          onClick={() => setView('HOME')}
          aria-label="GuyNode Home"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-brand-gold-500 to-brand-green-500 dark:from-nightAccent-gold dark:to-gn-accent-dark rounded flex items-center justify-center shadow-sm">
             <span className="text-ink-900 font-bold text-lg">G</span>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-gn-foreground dark:text-gn-foreground-dark font-bold tracking-tight text-lg leading-none group-hover:text-brand-green-600 dark:group-hover:text-nightAccent-gold transition-colors">GuyNode</span>
            <span className="text-xs text-gn-foreground-muted dark:text-gn-foreground-muted-dark uppercase tracking-widest leading-none mt-1">Data Portal</span>
          </div>
        </button>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-md mx-8 relative">
          <input
            type="text"
            placeholder="Search catalog..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gn-elevated dark:bg-gn-elevated-dark border border-gn-border dark:border-gn-border-dark rounded-full py-1.5 pl-4 pr-10 text-sm text-gn-foreground dark:text-gn-foreground-dark focus:outline-none focus:border-brand-green-500 transition-colors"
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-gn-foreground-muted hover:text-brand-green-600 dark:hover:text-nightAccent-gold transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </button>
        </form>

        {/* Links */}
        <div className="hidden md:flex items-center gap-6">
          <button 
            onClick={() => setView('CATALOG')} 
            className={`text-sm font-medium transition-colors focus:outline-none focus:underline ${currentView === 'CATALOG' ? 'text-brand-green-600 dark:text-nightAccent-gold' : 'text-gn-foreground-muted dark:text-gn-foreground-muted-dark hover:text-gn-foreground dark:hover:text-gn-foreground-dark'}`}
          >
            Catalog
          </button>
          <button 
            onClick={() => setView('MAP')} 
            className={`text-sm font-medium transition-colors focus:outline-none focus:underline ${currentView === 'MAP' ? 'text-brand-green-600 dark:text-nightAccent-gold' : 'text-gn-foreground-muted dark:text-gn-foreground-muted-dark hover:text-gn-foreground dark:hover:text-gn-foreground-dark'}`}
          >
            GIS Viewer
          </button>
          <button
            onClick={() => setView('LOCATOR')}
            className={`text-sm font-medium transition-colors focus:outline-none focus:underline ${currentView === 'LOCATOR' ? 'text-brand-green-600 dark:text-nightAccent-gold' : 'text-gn-foreground-muted dark:text-gn-foreground-muted-dark hover:text-gn-foreground dark:hover:text-gn-foreground-dark'}`}
          >
            Locator
          </button>
          <button
            onClick={() => setView('DOCS')}
            className={`text-sm font-medium transition-colors focus:outline-none focus:underline ${currentView === 'DOCS' ? 'text-brand-green-600 dark:text-nightAccent-gold' : 'text-gn-foreground-muted dark:text-gn-foreground-muted-dark hover:text-gn-foreground dark:hover:text-gn-foreground-dark'}`}
          >
            Developers
          </button>
          <button 
            onClick={() => setView('ANALYSIS')} 
            className={`text-sm font-medium transition-colors focus:outline-none focus:underline ${currentView === 'ANALYSIS' ? 'text-brand-green-600 dark:text-nightAccent-gold' : 'text-gn-foreground-muted dark:text-gn-foreground-muted-dark hover:text-gn-foreground dark:hover:text-gn-foreground-dark'}`}
          >
            Analysis
          </button>

          
          <button 
            onClick={() => setView('BLOG_INDEX')} 
            className={`text-sm font-medium transition-colors focus:outline-none focus:underline ${currentView.toString().startsWith('BLOG_') ? 'text-brand-green-600 dark:text-nightAccent-gold' : 'text-gn-foreground-muted dark:text-gn-foreground-muted-dark hover:text-gn-foreground dark:hover:text-gn-foreground-dark'}`}
          >
            Resources
          </button>
          
          <button
            onClick={() => setView('LEARN_INDEX')}
            className={`text-sm font-medium transition-colors focus:outline-none focus:underline ${currentView === 'LEARN_INDEX' || currentView === 'LEARN_POST' ? 'text-brand-green-600 dark:text-nightAccent-gold' : 'text-gn-foreground-muted dark:text-gn-foreground-muted-dark hover:text-gn-foreground dark:hover:text-gn-foreground-dark'}`}
          >
            Learn
          </button>
           <button
            onClick={() => setView('ABOUT')}
            className={`text-sm font-medium transition-colors focus:outline-none focus:underline ${currentView === 'ABOUT' ? 'text-brand-green-600 dark:text-nightAccent-gold' : 'text-gn-foreground-muted dark:text-gn-foreground-muted-dark hover:text-gn-foreground dark:hover:text-gn-foreground-dark'}`}
          >
            About
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded-full border border-gn-border dark:border-gn-border-dark text-gn-foreground-muted dark:text-gn-foreground-muted-dark hover:bg-gn-surface dark:hover:bg-gn-surface-dark transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green-500"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              // Moon Icon
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            ) : (
              // Sun Icon
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            )}
          </button>

        </div>
      </div>
    </nav>
  );
};
