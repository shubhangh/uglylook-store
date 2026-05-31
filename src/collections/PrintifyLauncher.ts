import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'

export const PrintifyLauncher: CollectionConfig = {
  slug: 'printify-launcher',
  labels: {
    singular: 'Product Launcher',
    plural: 'Product Launcher',
  },
  admin: {
    group: 'Printify',
    useAsTitle: 'id',
    components: {
      views: {
        list: {
          Component:
            '@/components/printify/ProductLauncher/index#ProductLauncher',
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
