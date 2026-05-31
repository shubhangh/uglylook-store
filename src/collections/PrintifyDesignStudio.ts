import type { CollectionConfig } from 'payload'

export const PrintifyDesignStudio: CollectionConfig = {
  slug: 'printify-design-studio',
  labels: {
    singular: 'Design Studio (AI)',
    plural: 'Design Studio (AI)',
  },
  admin: {
    group: 'Printify',
    useAsTitle: 'id',
    components: {
      views: {
        list: {
          Component:
            '@/components/printify/DesignStudio/index#DesignStudio',
        },
      },
    },
    pagination: { defaultLimit: 0 },
  },
  access: {
    create: () => false,
    read: () => true, // all roles can access Design Studio
    update: () => false,
    delete: () => false,
  },
  fields: [],
}
