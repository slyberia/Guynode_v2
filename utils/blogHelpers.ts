
import { BlogPost, BlogArchiveBucket, BlogCategory } from '../types';

/**
 * Module 1: Blog Data Helpers
 * Pure utility functions for retrieving and organizing blog content.
 */

/**
 * Returns all published blog posts, sorted by date (newest first).
 */
export const getAllBlogPosts = (blogPosts: BlogPost[]): BlogPost[] => {
  return blogPosts
    .filter(post => post.isPublished)
    .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());
};

/**
 * Returns a specific blog post by its URL slug.
 */
export const getBlogPostBySlug = (blogPosts: BlogPost[], slug: string): BlogPost | undefined => {
  return blogPosts.find(post => post.slug === slug && post.isPublished);
};

/**
 * Returns all posts associated with a specific category slug.
 */
export const getPostsByCategory = (blogPosts: BlogPost[], categorySlug: string): BlogPost[] => {
  return getAllBlogPosts(blogPosts).filter(post =>
    post.categories.some(cat => cat.slug === categorySlug)
  );
};

/**
 * Returns all unique categories that have at least one published post.
 */
export const getAllCategories = (blogPosts: BlogPost[]): BlogCategory[] => {
  const allCats = new Map<string, BlogCategory>();
  
  getAllBlogPosts(blogPosts).forEach(post => {
    post.categories.forEach(cat => {
      if (!allCats.has(cat.id)) {
        allCats.set(cat.id, cat);
      }
    });
  });
  
  return Array.from(allCats.values()).sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * Groups posts into Year-Month buckets for archive navigation.
 */
export const getArchiveBuckets = (blogPosts: BlogPost[]): BlogArchiveBucket[] => {
  const buckets = new Map<string, BlogArchiveBucket>();

  getAllBlogPosts(blogPosts).forEach(post => {
    const date = new Date(post.publishedDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-indexed
    const key = `${year}-${month}`;

    if (!buckets.has(key)) {
      const monthName = date.toLocaleString('default', { month: 'long' });
      buckets.set(key, {
        year,
        month,
        label: `${monthName} ${year}`,
        count: 0,
        slug: `${year}/${String(month).padStart(2, '0')}`
      });
    }

    const bucket = buckets.get(key);
    if (bucket) {
      bucket.count++;
    }
  });

  // Convert to array and sort descending by date (key)
  return Array.from(buckets.values()).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
};

/**
 * Retrieves the N most recent posts, optionally excluding a specific post ID (e.g., current post).
 */
export const getRecentPosts = (blogPosts: BlogPost[], limit: number = 3, excludeId?: string): BlogPost[] => {
  return getAllBlogPosts(blogPosts)
    .filter(post => post.id !== excludeId)
    .slice(0, limit);
};
