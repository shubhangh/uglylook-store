import type { CollectionConfig } from 'payload'

export const WorkflowGuide: CollectionConfig = {
  slug: 'workflow-guide',
  labels: {
    singular: 'Workflow Guide',
    plural: 'Workflow Guide',
  },
  admin: {
    group: 'Help',
    useAsTitle: 'id',
    components: {
      views: {
        list: {
          Component: '@/components/WorkflowGuide/index#WorkflowGuide',
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
