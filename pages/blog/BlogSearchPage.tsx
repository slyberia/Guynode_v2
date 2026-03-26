
import React, { useState } from 'react';
import { ViewState } from '../../types';

// Module 5: This page will provide a dedicated search interface for the blog.

interface BlogSearchPageProps {
  navigate: (view: ViewState, params?: import("../../utils/routing").RouteParams) => void;
}

const BlogSearchPage: React.FC<BlogSearchPageProps> = ({ navigate }) => {
  const [query, setQuery] = useState('');

  return (
    <div className="min-h-screen bg-gn-surface dark:bg-gn-surface-dark text-gn-foreground dark:text-gn-foreground-dark pt-20 px-6 transition-colors duration-300">
      <div className="max-w-4xl mx-auto border border-gn-border dark:border-gn-border-dark rounded-lg p-12 bg-gn-elevated dark:bg-gn-elevated-dark text-center space-y-6">
        <h1 className="text-3xl font-serif font-bold text-gn-foreground dark:text-gn-foreground-dark">Search Resources</h1>
        
        <div className="max-w-md mx-auto relative">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type query here..."
            className="w-full bg-gn-surface dark:bg-black border border-gn-border dark:border-white/20 rounded px-4 py-3 text-gn-foreground dark:text-white focus:border-guyana-gold outline-none"
          />
        </div>

        <p className="text-gn-foreground-muted dark:text-gn-foreground-muted-dark">
          Placeholder for Module 5. Search results will appear here as you type.
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

export default BlogSearchPage;
