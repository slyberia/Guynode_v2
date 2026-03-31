
import React from 'react';
import { useCatalog } from '../context/CatalogContext';

export const Analysis: React.FC = () => {
  const { analyses } = useCatalog();

  if (!analyses || analyses.length === 0) {
    return null; // Hide section entirely if no insights are available
  }

  return (
    <section className="py-24 bg-gn-surface-muted dark:bg-gn-surface-muted-dark border-t border-gn-border dark:border-gn-border-dark transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-end mb-12">
          <div>
             <h2 className="text-3xl font-serif font-bold text-gn-foreground dark:text-gn-foreground-dark mb-2">Research & Insights</h2>
             <p className="text-gn-foreground-muted dark:text-gn-foreground-muted-dark">Official reports derived from the GuyNode Data Lake.</p>
          </div>
          <button className="text-gn-accent-blue hover:text-gn-foreground dark:hover:text-gn-foreground-dark transition-colors text-sm font-semibold">View all Insights →</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {analyses.slice(0, 3).map(post => (
            <div key={post.id} className="group cursor-pointer">
              <div className="aspect-video w-full bg-gray-800 rounded mb-6 overflow-hidden border border-gn-border dark:border-gn-border-dark">
                <img src={post.heroImageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
              </div>
              <div className="flex gap-2 mb-3">
                {post.tags.map(tag => (
                   <span key={tag} className="text-[10px] uppercase font-bold tracking-wider text-gn-accent-blue">{tag}</span>
                ))}
              </div>
              <h3 className="text-xl font-bold text-gn-foreground dark:text-gn-foreground-dark mb-3 group-hover:text-guyana-gold transition-colors">{post.title}</h3>
              <p className="text-gn-foreground-muted dark:text-gn-foreground-muted-dark text-sm mb-4 line-clamp-3">{post.summary}</p>
              <div className="flex justify-between items-center border-t border-gn-border dark:border-gn-border-dark pt-4">
                <span className="text-xs text-gn-foreground-muted dark:text-gn-foreground-muted-dark font-bold">{post.author}</span>
                <span className="text-xs text-gn-foreground-muted dark:text-gn-foreground-muted-dark">{new Date(post.publishedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
