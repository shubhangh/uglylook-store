import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'

export const Redirects: CollectionConfig = {
  slug: 'redirects',
  labels: { singular: 'Redirect', plural: 'Redirects' },
  admin: {
    group: 'Site',
    defaultColumns: ['from', 'to', 'type', 'active'],
    useAsTitle: 'from',
  },
  access: {
    read: () => true, // middleware needs to read redirects
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'from',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Source path (e.g., /old-page). No trailing slash.',
      },
    },
    {
      name: 'to',
      type: 'text',
      required: true,
      admin: {
        description: 'Destination path or full URL (e.g., /new-page or https://...).',
      },
    },
    {
      name: 'type',
      type: 'select',
      defaultValue: '301',
      required: true,
      options: [
        { label: '301 — Permanent', value: '301' },
        { label: '302 — Temporary', value: '302' },
      ],
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      label: 'Active',
    },
  ],
}
