
import React, { useEffect, useState } from 'react';
import { ViewState, BlogPost } from '../../types';
import { useCatalog } from '../../context/CatalogContext';
import { sanitizeHtml } from '../../utils/sanitize';

interface BlogPostPageProps {
  params: { slug?: string };
  navigate: (view: ViewState, params?: import("../../utils/routing").RouteParams) => void;
  onOpenMap?: (datasetId: string) => void;
}

const BlogPostPage: React.FC<BlogPostPageProps> = ({ params, navigate, onOpenMap }) => {
  const { slug } = params;
  const { datasets, getBlogPost } = useCatalog();
  const [post, setPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    if (slug) {
      getBlogPost(slug).then(setPost).catch(console.error);
    }
  }, [slug, getBlogPost]);

  // Resolve related datasets
  const relatedDatasets = post?.relatedDatasets 
    ? datasets.filter(d => post.relatedDatasets?.includes(d.id))
    : [];

  return (
    <div className="min-h-screen bg-gn-surface dark:bg-gn-surface-dark text-gn-foreground dark:text-gn-foreground-dark pt-20 px-6 pb-20 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Breadcrumb */}
        <div className="flex gap-2 text-xs font-mono text-gn-foreground-muted dark:text-gn-foreground-muted-dark mb-4">
           <button onClick={() => navigate('BLOG_INDEX')} className="hover:text-gn-foreground dark:hover:text-white">RESOURCES</button>
           <span>/</span>
           <span>POST</span>
        </div>

        {post ? (
          <>
             {/* Header */}
             <div className="text-center space-y-6 border-b border-gn-border dark:border-gn-border-dark pb-8">
                {post.categories.length > 0 && (
                  <div className="flex justify-center gap-2">
                     {post.categories.map(c => (
                        <span key={c.id} className="text-[10px] font-bold uppercase tracking-widest text-guyana-gold">{c.name}</span>
                     ))}
                  </div>
                )}
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-gn-foreground dark:text-gn-foreground-dark leading-tight">{post.title}</h1>
                <div className="flex justify-center items-center gap-4 text-sm text-gn-foreground-muted dark:text-gn-foreground-muted-dark">
                   <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-700 overflow-hidden">
                       <img src={post.author.avatarUrl} alt={post.author.name} />
                     </div>
                     <span>{post.author.name}</span>
                   </div>
                   <span>•</span>
                   <span>{new Date(post.publishedDate).toLocaleDateString()}</span>
                   <span>•</span>
                   <span>{post.readTimeMinutes} min read</span>
                </div>
             </div>
             
             {/* Hero Image */}
             {post.heroImageUrl && (
               <div className="w-full h-[400px] rounded-lg overflow-hidden border border-gn-border dark:border-gn-border-dark">
                  <img src={post.heroImageUrl} alt={post.title} className="w-full h-full object-cover" />
               </div>
             )}

            {/* Content Body */}
            <div 
              className="prose prose-lg max-w-none text-gn-foreground dark:text-gray-300 leading-relaxed dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
            />

            {/* Tier 3: Related Datasets Section */}
            {relatedDatasets.length > 0 && (
               <div className="mt-16 pt-12 border-t border-gn-border dark:border-gn-border-dark">
                  <h3 className="text-lg font-bold text-gn-foreground dark:text-gn-foreground-dark mb-6 flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-bloom-accent"></span>
                     Related Datasets
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {relatedDatasets.map(ds => (
                        <div key={ds.id} className="bg-gn-elevated dark:bg-gn-elevated-dark border border-gn-border dark:border-gn-border-dark rounded p-4 flex gap-4 hover:bg-gn-surface-muted dark:hover:bg-white/5 transition-colors">
                           <div className="w-16 h-16 bg-gray-200 dark:bg-black rounded border border-gn-border dark:border-white/5 flex-shrink-0 overflow-hidden">
                              <img src={ds.imageUrl} alt={ds.title} className="w-full h-full object-cover opacity-80" />
                           </div>
                           <div className="flex-1">
                              <h4 className="font-bold text-gn-foreground dark:text-white text-sm mb-1">{ds.title}</h4>
                              <p className="text-xs text-gn-foreground-muted dark:text-gray-500 mb-3 line-clamp-1">{ds.description}</p>
                              <div className="flex gap-2">
                                 {onOpenMap && ds.geojsonUrl && (
                                    <button 
                                      onClick={() => onOpenMap(ds.id)}
                                      className="text-[10px] font-bold bg-bloom-accent hover:bg-blue-600 text-white px-3 py-1.5 rounded transition-colors"
                                    >
                                      View on Map
                                    </button>
                                 )}
                                 <button className="text-[10px] font-bold border border-gn-border dark:border-white/20 hover:border-gn-foreground dark:hover:border-white text-gn-foreground-muted dark:text-gray-300 px-3 py-1.5 rounded transition-colors">
                                    Details
                                 </button>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            )}
          </>
        ) : (
          <div className="text-red-400 text-center py-20">
            <h1 className="text-xl font-bold">Post Not Found</h1>
          </div>
        )}

        <div className="text-center pt-12">
           <button 
             onClick={() => navigate('BLOG_INDEX')}
             className="text-bloom-accent hover:text-gn-foreground dark:hover:text-white underline text-sm transition-colors"
           >
             ← Back to Resources Index
           </button>
        </div>
      </div>
    </div>
  );
};

export default BlogPostPage;
