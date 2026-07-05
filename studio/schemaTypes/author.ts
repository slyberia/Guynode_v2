import { defineType, defineField } from 'sanity'

// Mirrors BlogAuthor in ../../types.ts.
// Was embedded per-post in the JSON; becomes a referenced document to de-duplicate.
export const author = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'role', title: 'Role', type: 'string' }),
    defineField({
      name: 'avatar',
      title: 'Avatar',
      type: 'image',
      options: { hotspot: true },
      description: 'Replaces the legacy avatarUrl. On export, serialized back to avatarUrl.',
    }),
  ],
  preview: { select: { title: 'name', subtitle: 'role' } },
})
