import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'

export const PrintifyFulfillment: CollectionConfig = {
  slug: 'printify-fulfillment',
  labels: {
    singular: 'Fulfillment Dashboard',
    plural: 'Fulfillment Dashboard',
  },
  admin: {
    group: 'Printify',
    useAsTitle: 'id',
    components: {
      views: {
        list: {
          Component:
            '@/components/printify/FulfillmentDashboard/index#FulfillmentDashboard',
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
