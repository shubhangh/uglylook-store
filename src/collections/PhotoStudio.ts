import type { CollectionConfig } from 'payload'

export const PhotoStudio: CollectionConfig = {
  slug: 'photo-studio',
  labels: {
    singular: 'Photo Studio (AI)',
    plural: 'Photo Studio (AI)',
  },
  admin: {
    group: 'Content',
    useAsTitle: 'id',
    components: {
      views: {
        list: {
          Component: '@/components/PhotoStudio/index#PhotoStudio',
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
