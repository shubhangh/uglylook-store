import { slugField } from 'payload'
import type { CollectionConfig } from 'payload'
import { isOwnerOrAdmin, isAtLeastManager } from '@/access/utilities'

export const Buckets: CollectionConfig = {
  slug: 'buckets',
  labels: {
    singular: 'Bucket',
    plural: 'Buckets',
  },
  admin: {
    useAsTitle: 'title',
    group: 'Ecommerce',
    defaultColumns: ['title', 'status', 'color', 'updatedAt'],
  },
  access: {
    create: ({ req: { user } }) => isOwnerOrAdmin(user),
    update: ({ req: { user } }) => isOwnerOrAdmin(user),
    delete: ({ req: { user } }) => isOwnerOrAdmin(user),
    read: ({ req: { user } }) => {
      if (isAtLeastManager(user)) return true
      return isOwnerOrAdmin(user)
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      unique: true,
    },
    slugField({ position: undefined }),
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Internal note about this bucket (not shown to customers).',
      },
    },
    {
      name: 'bucketActions',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/Buckets/BucketActions#BucketActions',
        },
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'color',
      type: 'select',
      admin: {
        position: 'sidebar',
        description: 'Visual tag color in admin list.',
      },
      options: [
        { label: 'Olive', value: 'olive' },
        { label: 'Petrol', value: 'petrol' },
        { label: 'Bone', value: 'bone' },
        { label: 'Charcoal', value: 'charcoal' },
      ],
    },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      admin: {
        description: 'Products in this bucket.',
      },
    },
  ],
  timestamps: true,
}
