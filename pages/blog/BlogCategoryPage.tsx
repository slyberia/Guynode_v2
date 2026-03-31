
import React from 'react';
import { ViewState } from '../../types';

// Module 5: This page will list posts filtered by a specific category.

interface BlogCategoryPageProps {
  params: { category?: string };
  navigate: (view: ViewState, params?: import("../../utils/routing").RouteParams) => void;
}

const BlogCategoryPage: React.FC<BlogCategoryPageProps> = ({ params, navigate }) => {
  // In a React Router setup: const { category } = useParams();
  const { category } = params;

  return (
    <div className="min-h-screen bg-gn-surface dark:bg-gn-surface-dark text-gn-foreground dark:text-gn-foreground-dark pt-20 px-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto border border-gn-border dark:border-gn-border-dark rounded-lg p-12 bg-gn-elevated dark:bg-gn-elevated-dark text-center space-y-4">
        <div className="inline-block px-3 py-1 bg-gn-surface-muted dark:bg-white/10 rounded text-xs font-mono text-guyana-gold">
          ROUTE: /resources/category/{category || ':category'}
        </div>
        <h1 className="text-3xl font-serif font-bold text-gn-foreground dark:text-gn-foreground-dark">Category: {category}</h1>
        <p className="text-gn-foreground-muted dark:text-gn-foreground-muted-dark max-w-lg mx-auto">
          Placeholder for Module 5. This page will display a filtered list of resources belonging to this category.
        </p>
        <button 
          onClick={() => navigate('BLOG_INDEX')}
          className="mt-4 text-gn-accent-blue hover:text-gn-foreground dark:hover:text-white underline text-sm transition-colors"
        >
          ← Clear Filter
        </button>
      </div>
    </div>
  );
};

export default BlogCategoryPage;
