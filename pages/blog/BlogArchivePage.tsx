
import React from 'react';
import { ViewState } from '../../types';

// Module 5: This page will list posts filtered by year and month.

interface BlogArchivePageProps {
  params: { year?: string; month?: string };
  navigate: (view: ViewState, params?: import("../../utils/routing").RouteParams) => void;
}

const BlogArchivePage: React.FC<BlogArchivePageProps> = ({ params, navigate }) => {
  // In a React Router setup: const { year, month } = useParams();
  const { year, month } = params;

  return (
    <div className="min-h-screen bg-gn-surface dark:bg-gn-surface-dark text-gn-foreground dark:text-gn-foreground-dark pt-20 px-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto border border-gn-border dark:border-gn-border-dark rounded-lg p-12 bg-gn-elevated dark:bg-gn-elevated-dark text-center space-y-4">
        <div className="inline-block px-3 py-1 bg-gn-surface-muted dark:bg-white/10 rounded text-xs font-mono text-guyana-gold">
          ROUTE: /resources/archive/{year || ':year'}/{month || ':month'}
        </div>
        <h1 className="text-3xl font-serif font-bold text-gn-foreground dark:text-gn-foreground-dark">Archive: {year} / {month}</h1>
        <p className="text-gn-foreground-muted dark:text-gn-foreground-muted-dark max-w-lg mx-auto">
          Placeholder for Module 5. This page will display resources published during this specific time period.
        </p>
         <button 
          onClick={() => navigate('BLOG_INDEX')}
          className="mt-4 text-bloom-accent hover:text-gn-foreground dark:hover:text-white underline text-sm transition-colors"
        >
          ← Return to Index
        </button>
      </div>
    </div>
  );
};

export default BlogArchivePage;
