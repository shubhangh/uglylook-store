import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'

export const R2Browser: CollectionConfig = {
  slug: 'r2-browser',
  labels: {
    singular: 'R2 Media Browser',
    plural: 'R2 Media Browser',
  },
  admin: {
    group: 'Automate',
    useAsTitle: 'id',
    components: {
      views: {
        list: {
          Component: '@/components/R2Browser/index#R2Browser',
        },
      },
    },
    pagination: { defaultLimit: 0 },
  },
  access: {
    create: () => false,
    read: isAdmin,
    update: () => false,
    delete: () => false,
  },
  fields: [],
}
