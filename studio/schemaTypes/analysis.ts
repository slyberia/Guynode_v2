import { defineType, defineField } from 'sanity'

// Mirrors the analysis records in ../../public/data/analyses.json.
// datasetsUsed are dataset ID strings (datasets are not Sanity documents).
export const analysis = defineType({
  name: 'analysis',
  title: 'Analysis',
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
    defineField({ name: 'summary', title: 'Summary', type: 'text', rows: 3, validation: (r) => r.required() }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [{ type: 'block' }, { type: 'image', options: { hotspot: true } }],
    }),
    defineField({ name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'string' }] }),
    defineField({
      name: 'datasetsUsed',
      title: 'Datasets used (IDs)',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Dataset IDs from public/data/datasets.json.',
    }),
    defineField({ name: 'publishedAt', title: 'Published at', type: 'datetime' }),
    defineField({ name: 'author', title: 'Author (byline)', type: 'string' }),
    defineField({
      name: 'level',
      title: 'Level',
      type: 'string',
      options: { list: ['policy-brief', 'technical', 'summary'], layout: 'radio' },
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: { list: ['draft', 'published'], layout: 'radio' },
      initialValue: 'draft',
    }),
    defineField({ name: 'heroImage', title: 'Hero image', type: 'image', options: { hotspot: true } }),
    defineField({
      name: 'mapConfig',
      title: 'Map config',
      type: 'object',
      description: 'Preserved from the source JSON. Fields kept loose pending a full audit of analyses.json.',
      fields: [
        defineField({ name: 'center', title: 'Center [lat, lng]', type: 'array', of: [{ type: 'number' }] }),
        defineField({ name: 'zoom', title: 'Zoom', type: 'number' }),
        defineField({ name: 'datasetId', title: 'Focus dataset ID', type: 'string' }),
      ],
    }),
    defineField({
      name: 'legacyId',
      title: 'Legacy ID',
      type: 'string',
      description: 'ID from the pre-Sanity JSON (e.g. ana-001). Import bookkeeping only.',
    }),
  ],
  preview: { select: { title: 'title', subtitle: 'level', media: 'heroImage' } },
})
