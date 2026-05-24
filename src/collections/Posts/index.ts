import type { CollectionConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'
import { publicAccess } from '@/access/publicAccess'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: {
    singular: 'Read / Blog Post',
    plural: 'Reads / Blog Posts',
  },
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: publicAccess,
    update: adminOnly,
  },
  admin: {
    group: 'Content',
    defaultColumns: ['title', 'category', 'status', 'publishedAt'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Culture', value: 'culture' },
        { label: 'Style', value: 'style' },
        { label: 'Drops', value: 'drops' },
        { label: 'Behind the Seams', value: 'behind-the-seams' },
        { label: 'Streetwear', value: 'streetwear' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'author',
      type: 'text',
      defaultValue: 'UglyLook Editorial',
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
  ],
}
