import type { CollectionConfig } from 'payload'

import { publicAccess } from '@/access/publicAccess'
import { isOwnerOrAdmin, isAtLeastManager } from '@/access/utilities'

export const Customers: CollectionConfig = {
  slug: 'customers',
  labels: {
    singular: 'Customer',
    plural: 'Customers',
  },
  admin: {
    group: 'Ecommerce',
    defaultColumns: ['name', 'email', 'createdAt'],
    useAsTitle: 'name',
  },
  auth: {
    tokenExpiration: 1209600,
  },
  access: {
    admin: () => false,
    create: publicAccess,
    delete: ({ req: { user } }) => isOwnerOrAdmin(user),
    read: ({ req: { user } }) => {
      // Owner/admin/manager can view all customers. Editor: no access.
      if (isAtLeastManager(user)) return true
      // Customers can read their own record
      const u = user as any
      if (u?.id) return { id: { equals: u.id } }
      return false
    },
    update: ({ req: { user } }) => {
      // Only owner/admin can edit customers. Manager: read-only.
      if (isOwnerOrAdmin(user)) return true
      // Customers can update their own record
      const u = user as any
      if (u?.id) return { id: { equals: u.id } }
      return false
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Profile picture' },
    },
    {
      name: 'phone',
      type: 'text',
      admin: { description: 'Contact phone number' },
    },
    {
      name: 'marketingOptIn',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Opted in to marketing emails' },
    },
    {
      name: 'orders',
      type: 'join',
      collection: 'orders',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id', 'createdAt', 'total', 'currency', 'items'],
      },
    },
    {
      name: 'cart',
      type: 'join',
      collection: 'carts',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id', 'createdAt', 'total', 'currency', 'items'],
      },
    },
    {
      name: 'addresses',
      type: 'join',
      collection: 'addresses',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id'],
      },
    },
  ],
}
