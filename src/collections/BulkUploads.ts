import type { CollectionConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'

export const BulkUploads: CollectionConfig = {
  slug: 'bulk-uploads',
  labels: {
    singular: 'Bulk Products',
    plural: 'Bulk Products',
  },
  admin: {
    group: 'Automate',
    useAsTitle: 'id',
    components: {
      views: {
        list: {
          Component: '@/components/BulkUpload/index#BulkUpload',
        },
      },
    },
    pagination: { defaultLimit: 0 },
  },
  access: {
    create: () => false,
    read: adminOnly,
    update: () => false,
    delete: () => false,
  },
  fields: [],
}
