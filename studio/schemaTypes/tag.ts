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
  ],
  preview: { select: { title: 'name', subtitle: 'slug.current' } },
})
