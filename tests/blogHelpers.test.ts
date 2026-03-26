import test from 'node:test';
import assert from 'node:assert';
import { getBlogPostBySlug, getAllCategories } from '../utils/blogHelpers.js';
import { BlogPost } from '../types.js';

const mockPosts: BlogPost[] = [
  {
    id: '1',
    slug: 'post-1',
    title: 'Post 1',
    excerpt: 'Excerpt 1',
    content: 'Content 1',
    author: { id: 'a1', name: 'Author 1', role: 'Role 1', avatarUrl: 'url' },
    publishedDate: '2023-10-01T10:00:00Z',
    isPublished: true,
    categories: [
      { id: 'tech', slug: 'tech', name: 'Technology', description: 'Tech desc' },
      { id: 'news', slug: 'news', name: 'News', description: 'News desc' }
    ],
    tags: [],
    readTimeMinutes: 5,
    seoMeta: { title: 'SEO 1', description: 'SEO desc 1' }
  },
  {
    id: '2',
    slug: 'post-2',
    title: 'Post 2',
    excerpt: 'Excerpt 2',
    content: 'Content 2',
    author: { id: 'a1', name: 'Author 1', role: 'Role 1', avatarUrl: 'url' },
    publishedDate: '2023-10-05T10:00:00Z',
    isPublished: false, // Unpublished!
    categories: [
      { id: 'dev', slug: 'dev', name: 'Development', description: 'Dev desc' }
    ],
    tags: [],
    readTimeMinutes: 5,
    seoMeta: { title: 'SEO 2', description: 'SEO desc 2' }
  },
  {
    id: '3',
    slug: 'post-3',
    title: 'Post 3',
    excerpt: 'Excerpt 3',
    content: 'Content 3',
    author: { id: 'a2', name: 'Author 2', role: 'Role 2', avatarUrl: 'url' },
    publishedDate: '2023-09-15T10:00:00Z',
    isPublished: true,
    categories: [
      { id: 'tech', slug: 'tech', name: 'Technology', description: 'Tech desc' },
      { id: 'design', slug: 'design', name: 'Design', description: 'Design desc' }
    ],
    tags: [],
    readTimeMinutes: 5,
    seoMeta: { title: 'SEO 3', description: 'SEO desc 3' }
  }
];

test('getBlogPostBySlug', async (t) => {
  await t.test('returns the correct published post', () => {
    const post = getBlogPostBySlug(mockPosts, 'post-1');
    assert.strictEqual(post?.id, '1');
    assert.strictEqual(post?.slug, 'post-1');
  });

  await t.test('returns undefined for an unpublished post', () => {
    const post = getBlogPostBySlug(mockPosts, 'post-2');
    assert.strictEqual(post, undefined);
  });

  await t.test('returns undefined for a non-existent slug', () => {
    const post = getBlogPostBySlug(mockPosts, 'non-existent-post');
    assert.strictEqual(post, undefined);
  });
});

test('getAllCategories', async (t) => {
  await t.test('returns unique categories from published posts, sorted by name', () => {
    const categories = getAllCategories(mockPosts);

    // Total should be 3: Design, News, Technology (Development is from unpublished post 2)
    assert.strictEqual(categories.length, 3);

    assert.strictEqual(categories[0].name, 'Design');
    assert.strictEqual(categories[1].name, 'News');
    assert.strictEqual(categories[2].name, 'Technology');
  });
});
