import { defineType, defineField } from 'sanity'

// Mirrors BlogTag in ../../types.ts.
export const tag = defineType({
  name: 'tag',
  title: 'Tag',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'name', maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'legacyId',
      title: 'Legacy ID',
      type: 'string',
      description: 'ID from the pre-Sanity JSON. Import bookkeeping only.',
    }),
  ],
  preview: { select: { title: 'name', subtitle: 'slug.current' } },
})
