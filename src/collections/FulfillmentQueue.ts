import type { CollectionConfig } from 'payload'
import { isAtLeastManager } from '@/access/utilities'

export const FulfillmentQueue: CollectionConfig = {
  slug: 'fulfillment-queue',
  labels: {
    singular: 'Fulfillment Queue',
    plural: 'Fulfillment Queue',
  },
  admin: {
    group: 'Ecommerce',
    useAsTitle: 'id',
    components: {
      views: {
        list: {
          Component:
            '@/components/FulfillmentQueue/index#FulfillmentQueue',
        },
      },
    },
    pagination: { defaultLimit: 0 },
  },
  access: {
    create: () => false,
    read: ({ req: { user } }) => isAtLeastManager(user),
    update: () => false,
    delete: () => false,
  },
  fields: [],
}
