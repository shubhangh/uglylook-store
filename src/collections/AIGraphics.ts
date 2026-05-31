import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'

export const AIGraphics: CollectionConfig = {
  slug: 'ai-graphics',
  labels: { singular: 'AI Graphic', plural: 'AI Graphics' },
  admin: {
    group: 'Ecommerce',
    useAsTitle: 'title',
    defaultColumns: ['title', 'palette', 'style', 'orientation', 'status', 'usageCount'],
  },
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
    delete: isAdmin,
  },
  fields: [
    // ── Core ──
    { name: 'title', type: 'text', required: true },
    {
      name: 'imageFile',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: { description: 'Raw AI-generated graphic (no text, transparent bg)' },
    },
    {
      name: 'imageUrl',
      type: 'text',
      admin: { readOnly: true, description: 'Auto-populated R2 URL after upload' },
    },

    // ── Classification ──
    {
      name: 'palette',
      type: 'select',
      options: [
        { label: 'Muted Chaos', value: 'muted-chaos' },
        { label: 'Digital Rot', value: 'digital-rot' },
        { label: 'Concrete Heat', value: 'concrete-heat' },
        { label: 'Faded Flash', value: 'faded-flash' },
      ],
    },
    {
      name: 'style',
      type: 'select',
      options: [
        { label: 'Wireframe Cluster', value: 'wireframe-cluster' },
        { label: 'Corrupted Scan', value: 'corrupted-scan' },
        { label: 'Brutalist Grid', value: 'brutalist-grid' },
      ],
    },
    {
      name: 'orientation',
      type: 'select',
      options: [
        { label: 'Vertical', value: 'vertical' },
        { label: 'Horizontal', value: 'horizontal' },
        { label: 'Square', value: 'square' },
      ],
    },

    // ── Generation Metadata ──
    { name: 'generationPrompt', type: 'textarea', admin: { rows: 4, description: 'Full prompt used (text-free)' } },
    { name: 'imageModel', type: 'text', admin: { description: 'e.g., flux-2-pro' } },
    { name: 'generationCost', type: 'number', admin: { description: 'Cost in USD', step: 0.001 } },

    // ── Dimensions ──
    { name: 'width', type: 'number', admin: { description: 'Width in pixels' } },
    { name: 'height', type: 'number', admin: { description: 'Height in pixels' } },

    // ── Usage ──
    { name: 'usageCount', type: 'number', defaultValue: 0, admin: { readOnly: true, description: 'Designs using this graphic' } },

    // ── Status ──
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Draft', value: 'draft' },
        { label: 'Archived', value: 'archived' },
      ],
    },
  ],
}
