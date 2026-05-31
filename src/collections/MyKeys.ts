import type { CollectionConfig } from 'payload'

export const MyKeys: CollectionConfig = {
  slug: 'my-keys',
  labels: {
    singular: 'My API Keys',
    plural: 'My API Keys',
  },
  admin: {
    group: 'API Keys',
    useAsTitle: 'id',
    components: {
      views: {
        list: {
          Component: '@/components/MyKeys/index#MyKeys',
        },
      },
    },
    pagination: { defaultLimit: 0 },
  },
  access: {
    create: () => false,
    read: () => true,
    update: () => false,
    delete: () => false,
  },
  fields: [],
}
