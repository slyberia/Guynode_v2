import { defineType, defineField } from 'sanity'

// Mirrors BlogPost in ../../types.ts.
// The legacy `content` HTML string becomes structured `body` (Portable Text).
// author/categories/tags become references (were embedded duplicates in the JSON).
// relatedDatasets stays an array of dataset ID strings — datasets are NOT in Sanity
// (they remain pipeline-generated JSON), so these are plain strings, not references.
export const blogPost = defineType({
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3, validation: (r) => r.required() }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [{ type: 'block' }, { type: 'image', options: { hotspot: true } }],
      description: 'Portable Text. Migrated from the legacy HTML content string.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'publishedDate',
      title: 'Published date',
      type: 'datetime',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: [{ type: 'author' }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'tag' }] }],
    }),
    defineField({ name: 'heroImage', title: 'Hero image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'readTimeMinutes', title: 'Read time (minutes)', type: 'number' }),
    defineField({ name: 'isFeatured', title: 'Featured', type: 'boolean', initialValue: false }),
    defineField({ name: 'isPublished', title: 'Published', type: 'boolean', initialValue: false }),
    defineField({
      name: 'relatedDatasets',
      title: 'Related dataset IDs',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Dataset IDs from public/data/datasets.json. Plain strings — datasets are not Sanity documents.',
    }),
    defineField({
      name: 'seoMeta',
      title: 'SEO meta',
      type: 'object',
      fields: [
        defineField({ name: 'title', title: 'SEO title', type: 'string' }),
        defineField({ name: 'description', title: 'SEO description', type: 'text', rows: 2 }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'author.name', media: 'heroImage' },
  },
})
