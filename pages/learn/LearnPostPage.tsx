import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ViewState } from '../../types';
import { RouteParams } from '../../utils/routing';

interface LearnPost {
  slug: string;
  title: string;
  category: string;
  difficulty: string;
  readTimeMinutes: number;
  excerpt: string;
  content: string;
}

interface LearnPostPageProps {
  slug: string;
  navigate: (view: ViewState, params?: RouteParams) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  guide:      'bg-brand-green-600/10 text-brand-green-600 dark:bg-nightAccent-green/10 dark:text-nightAccent-green border-brand-green-600/20 dark:border-nightAccent-green/20',
  tutorial:   'bg-bloom-accent/10 text-bloom-accent border-bloom-accent/20',
  concept:    'bg-brand-gold-600/10 text-brand-gold-600 dark:bg-nightAccent-gold/10 dark:text-nightAccent-gold border-brand-gold-600/20 dark:border-nightAccent-gold/20',
  comparison: 'bg-guyana-red/10 text-guyana-red border-guyana-red/20',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner:     'bg-guyana-green/10 text-guyana-green border-guyana-green/20',
  intermediate: 'bg-brand-gold-600/10 text-brand-gold-600 dark:text-nightAccent-gold border-brand-gold-600/20',
};

export const LearnPostPage: React.FC<LearnPostPageProps> = ({ slug, navigate }) => {
  const [post, setPost] = useState<LearnPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setPost(null);

    fetch(`/learn/${slug}.json`)
      .then(r => {
        if (r.status === 404 || !r.ok) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then((data: LearnPost | null) => {
        if (data) { setPost(data); }
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gn-surface dark:bg-gn-surface-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-brand-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-sm text-gn-foreground-muted dark:text-gn-foreground-muted-dark">Loading...</p>
        </div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-gn-surface dark:bg-gn-surface-dark flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <p className="text-4xl font-bold text-gn-foreground dark:text-gn-foreground-dark mb-3">404</p>
          <p className="text-gn-foreground-muted dark:text-gn-foreground-muted-dark mb-8">
            This learn article could not be found.
          </p>
          <button
            onClick={() => navigate('LEARN_INDEX')}
            className="bg-brand-green-600 hover:bg-brand-green-500 text-white font-bold py-2 px-6 rounded transition-colors"
          >
            ← Back to Learn
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gn-surface dark:bg-gn-surface-dark text-gn-foreground dark:text-gn-foreground-dark transition-colors duration-300">
      {/* Article header */}
      <div className="bg-gn-surface-muted dark:bg-gn-surface-muted-dark border-b border-gn-border dark:border-gn-border-dark py-12 px-6">
        <div className="max-w-2xl mx-auto">
          {/* Back link */}
          <button
            onClick={() => navigate('LEARN_INDEX')}
            className="text-xs font-bold text-brand-green-600 dark:text-nightAccent-green hover:underline mb-6 inline-block uppercase tracking-widest"
          >
            ← Back to Learn
          </button>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${CATEGORY_COLORS[post.category] ?? 'bg-gn-surface dark:bg-gn-surface-dark text-gn-foreground-muted border-gn-border'}`}>
              {post.category}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${DIFFICULTY_COLORS[post.difficulty] ?? 'bg-gn-surface dark:bg-gn-surface-dark text-gn-foreground-muted border-gn-border'}`}>
              {post.difficulty}
            </span>
            <span className="text-[10px] text-gn-foreground-muted dark:text-gn-foreground-muted-dark font-mono">
              {post.readTimeMinutes} min read
            </span>
          </div>

          <h1 className="text-3xl font-serif font-bold text-gn-foreground dark:text-gn-foreground-dark leading-tight">
            {post.title}
          </h1>
        </div>
      </div>

      {/* Article body */}
      <div className="py-12 px-6">
        <div className="max-w-2xl mx-auto prose prose-sm prose-gn dark:prose-invert
          prose-headings:font-serif prose-headings:font-bold prose-headings:text-gn-foreground dark:prose-headings:text-gn-foreground-dark
          prose-p:text-gn-foreground dark:prose-p:text-gn-foreground-dark prose-p:leading-relaxed
          prose-li:text-gn-foreground dark:prose-li:text-gn-foreground-dark
          prose-strong:text-gn-foreground dark:prose-strong:text-gn-foreground-dark
          prose-a:text-brand-green-600 dark:prose-a:text-nightAccent-green
          prose-code:text-brand-green-600 dark:prose-code:text-nightAccent-gold prose-code:bg-gn-surface-muted dark:prose-code:bg-gn-surface-muted-dark prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:before:content-none prose-code:after:content-none
          prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-gn-border dark:prose-h2:border-gn-border-dark prose-h2:pb-2
          prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
          prose-ul:my-4 prose-ol:my-4 prose-li:my-1
          max-w-none">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>
      </div>

      {/* Next steps CTA */}
      <div className="border-t border-gn-border dark:border-gn-border-dark bg-gn-surface-muted dark:bg-gn-surface-muted-dark py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-lg font-serif font-bold mb-2 text-gn-foreground dark:text-gn-foreground-dark">Next steps</h2>
          <p className="text-sm text-gn-foreground-muted dark:text-gn-foreground-muted-dark mb-6">
            Put what you have learned into practice with Guynode's open spatial datasets.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('CATALOG')}
              className="bg-brand-green-600 hover:bg-brand-green-500 dark:bg-nightAccent-green dark:hover:bg-brand-green-500 text-white font-bold py-2.5 px-6 rounded transition-colors text-sm"
            >
              Browse Datasets
            </button>
            <button
              onClick={() => navigate('LEARN_INDEX')}
              className="border border-brand-green-600 dark:border-nightAccent-green text-brand-green-600 dark:text-nightAccent-green hover:bg-brand-green-600 hover:text-white dark:hover:bg-nightAccent-green dark:hover:text-gn-foreground-dark font-bold py-2.5 px-6 rounded transition-colors text-sm"
            >
              Back to Learning Center
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
