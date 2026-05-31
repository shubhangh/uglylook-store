import type { CollectionConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'

export const AIProductAnalysisCache: CollectionConfig = {
  slug: 'ai-product-analysis-cache',
  labels: {
    singular: 'AI Analysis Cache',
    plural: 'AI Analysis Cache',
  },
  admin: {
    group: 'Automate',
    useAsTitle: 'productName',
    defaultColumns: ['productName', 'imageHash', 'version', 'model', 'createdAt'],
    pagination: { defaultLimit: 25 },
  },
  access: {
    create: adminOnly,
    read: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    {
      name: 'imageHash',
      type: 'text',
      required: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'SHA-256 hash of the image content',
      },
    },
    {
      name: 'version',
      type: 'number',
      required: true,
      defaultValue: 1,
      admin: {
        readOnly: true,
        description: 'Version number (1 = first analysis, max 5)',
      },
    },
    {
      name: 'productName',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Product name at time of analysis',
      },
    },
    {
      name: 'category',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'model',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'AI model used for analysis',
      },
    },
    {
      name: 'analysis',
      type: 'json',
      required: true,
      admin: {
        readOnly: true,
        description: 'AI analysis result (visibleText, description, features, etc.)',
      },
    },
  ],
}
