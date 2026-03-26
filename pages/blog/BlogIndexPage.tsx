
import React from 'react';
import { ViewState } from '../../types';
import { useCatalog } from '../../context/CatalogContext';

interface BlogIndexPageProps {
  navigate: (view: ViewState, params?: import("../../utils/routing").RouteParams) => void;
}

const BlogIndexPage: React.FC<BlogIndexPageProps> = ({ navigate }) => {
  const { blogPosts } = useCatalog();

  if (blogPosts.length === 0) {
    return (
      <div className="min-h-screen bg-gn-surface dark:bg-gn-surface-dark flex items-center justify-center text-gn-foreground dark:text-gn-foreground-dark p-6 transition-colors duration-300">
        <div className="text-center">
           <h1 className="text-3xl font-serif font-bold mb-4">GuyNode Resources</h1>
           <p className="text-gn-foreground-muted dark:text-gn-foreground-muted-dark mb-8">
             Check back later for new resources and updates from the team.
           </p>
           <button
             onClick={() => navigate('HOME')}
             className="bg-brand-green-600 hover:bg-brand-green-500 text-white font-bold py-2 px-6 rounded transition-colors"
           >
             Return to Dashboard
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gn-surface dark:bg-gn-surface-dark text-gn-foreground dark:text-gn-foreground-dark pt-20 px-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-4">
        <h1 className="text-3xl font-serif font-bold">GuyNode Resources Index</h1>
        {/* Iterate over posts if any */}
      </div>
    </div>
  );
};

export default BlogIndexPage;
