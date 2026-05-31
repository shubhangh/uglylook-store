import type { CollectionConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'

export const BulkFeedback: CollectionConfig = {
  slug: 'bulk-feedback',
  labels: {
    singular: 'Bulk Feedback',
    plural: 'Bulk Feedback',
  },
  admin: {
    group: 'Automate',
    useAsTitle: 'id',
    components: {
      views: {
        list: {
          Component: '@/components/BulkFeedback/index#BulkFeedback',
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
