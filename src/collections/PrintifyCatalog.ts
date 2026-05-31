import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'

export const PrintifyCatalog: CollectionConfig = {
  slug: 'printify-catalog',
  labels: {
    singular: 'Catalog Browser',
    plural: 'Catalog Browser',
  },
  admin: {
    group: 'Printify',
    useAsTitle: 'id',
    components: {
      views: {
        list: {
          Component:
            '@/components/printify/CatalogBrowser/index#CatalogBrowser',
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
