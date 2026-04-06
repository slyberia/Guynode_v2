import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Dataset, BlogPost } from '../types';
import { fetchDatasets, fetchBlogPosts, fetchBlogPostById } from '../services/dataFetcher';

interface CatalogContextType {
  datasets: Dataset[];
  blogPosts: BlogPost[];
  loading: boolean;
  error: string | null;
  getBlogPost: (slug: string) => Promise<BlogPost>;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export const CatalogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);
        const [ds, bp] = await Promise.all([
          fetchDatasets(),
          fetchBlogPosts()
        ]);
        setDatasets(ds);
        setBlogPosts(bp);
        setError(null);
      } catch (err) {
        console.error('Failed to load catalog data:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to load catalog data.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  const getBlogPost = async (slug: string) => {
    return await fetchBlogPostById(slug);
  };

  return (
    <CatalogContext.Provider value={{ datasets, blogPosts, loading, error, getBlogPost }}>
      {children}
    </CatalogContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (context === undefined) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
};
