import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'

export const PrintifyAnalysis: CollectionConfig = {
  slug: 'printify-analysis',
  labels: {
    singular: 'SKU Analysis',
    plural: 'SKU Analysis',
  },
  admin: {
    group: 'Printify',
    useAsTitle: 'id',
    components: {
      views: {
        list: {
          Component:
            '@/components/printify/SkuAnalysis/index#SkuAnalysis',
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
