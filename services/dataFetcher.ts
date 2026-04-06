import { Dataset, BlogPost } from '../types';

let _datasetsCache: Dataset[] | null = null;
let _blogPostsCache: BlogPost[] | null = null;

export const fetchDatasets = async (): Promise<Dataset[]> => {
  if (_datasetsCache) return _datasetsCache;
  const res = await fetch('/data/datasets.json');
  if (!res.ok) throw new Error('Failed to fetch datasets');
  _datasetsCache = await res.json();
  return _datasetsCache;
};

export const fetchBlogPosts = async (): Promise<BlogPost[]> => {
  if (_blogPostsCache) return _blogPostsCache;
  const res = await fetch('/blog/index.json');
  if (!res.ok) throw new Error('Failed to fetch blog posts');
  _blogPostsCache = await res.json();
  return _blogPostsCache;
};

export const fetchBlogPostById = async (slug: string) => {
  const res = await fetch(`/blog/posts/${slug}.json`);
  if (!res.ok) throw new Error(`Failed to fetch blog post ${slug}`);
  return await res.json();
};
