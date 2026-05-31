import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'

export const GlobalKeys: CollectionConfig = {
  slug: 'global-keys',
  labels: {
    singular: 'Global Keys',
    plural: 'Global Keys',
  },
  admin: {
    group: 'API Keys',
    useAsTitle: 'id',
    components: {
      views: {
        list: {
          Component: '@/components/GlobalKeys/index#GlobalKeys',
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
