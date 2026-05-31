import type { CollectionConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'

export const BulkReads: CollectionConfig = {
  slug: 'bulk-reads',
  labels: {
    singular: 'Bulk Reads',
    plural: 'Bulk Reads',
  },
  admin: {
    group: 'Automate',
    useAsTitle: 'id',
    components: {
      views: {
        list: {
          Component: '@/components/BulkReads/index#BulkReads',
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
