import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'

export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  labels: { singular: 'Subscriber', plural: 'Subscribers' },
  admin: {
    group: 'Ecommerce',
    defaultColumns: ['email', 'source', 'subscribedAt'],
    useAsTitle: 'email',
  },
  access: {
    read: isAdmin,
    create: () => true, // public — the newsletter form creates entries
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'source',
      type: 'select',
      defaultValue: 'footer',
      options: [
        { label: 'Footer', value: 'footer' },
        { label: 'Newsletter CTA', value: 'newsletter-cta' },
        { label: 'Checkout', value: 'checkout' },
        { label: 'Manual', value: 'manual' },
      ],
    },
    {
      name: 'subscribedAt',
      type: 'date',
      admin: { readOnly: true },
      hooks: {
        beforeValidate: [
          ({ value, operation }) => {
            if (operation === 'create') return new Date().toISOString()
            return value
          },
        ],
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      label: 'Active (subscribed)',
    },
  ],
}
