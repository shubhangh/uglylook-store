import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'

export const Photos: CollectionConfig = {
  slug: 'photos',
  labels: { singular: 'Photo', plural: 'Photos' },
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'photoType', 'background', 'mood', 'status', 'usageCount', 'createdAt'],
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
      admin: { description: 'The approved photo file (uploaded to R2).' },
    },
    {
      name: 'imageUrl',
      type: 'text',
      admin: { readOnly: true, description: 'Auto-populated R2 URL after upload.' },
    },

    // ── Classification ──
    {
      name: 'photoType',
      type: 'select',
      required: true,
      options: [
        { label: 'Campaign Hero', value: 'campaign-hero' },
        { label: 'On-Model', value: 'on-model' },
        { label: 'Flat-Lay', value: 'flat-lay' },
        { label: 'Detail / Texture', value: 'detail-texture' },
        { label: 'Editorial / Lookbook', value: 'editorial' },
        { label: 'Group / Crew', value: 'group-crew' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'background',
      type: 'select',
      options: [
        { label: 'Near-Black (#111)', value: 'near-black' },
        { label: 'Cream (#F5F2EC)', value: 'cream' },
        { label: 'Environment', value: 'environment' },
        { label: 'Concrete', value: 'concrete' },
        { label: 'Custom', value: 'custom' },
      ],
      defaultValue: 'near-black',
      admin: { position: 'sidebar' },
    },
    {
      name: 'mood',
      type: 'select',
      options: [
        { label: 'Neutral', value: 'neutral' },
        { label: 'Dramatic', value: 'dramatic' },
        { label: 'Editorial', value: 'editorial' },
        { label: 'Raw', value: 'raw' },
        { label: 'Clinical', value: 'clinical' },
      ],
      defaultValue: 'neutral',
      admin: { position: 'sidebar' },
    },

    // ── Relationships ──
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      admin: { description: 'Which products appear in this photo.' },
    },
    {
      name: 'designs',
      type: 'relationship',
      relationTo: 'designs',
      hasMany: true,
      admin: { description: 'Which designs/prints are shown.' },
    },

    // ── Generation Metadata ──
    {
      type: 'collapsible',
      label: 'Generation Info',
      admin: { initCollapsed: true },
      fields: [
        { name: 'prompt', type: 'textarea', admin: { description: 'The prompt used to generate this image.' } },
        { name: 'imageModel', type: 'text', admin: { readOnly: true } },
        { name: 'imageModelDisplayName', type: 'text', admin: { readOnly: true } },
        { name: 'promptModel', type: 'text', admin: { readOnly: true } },
        { name: 'generationCost', type: 'number', admin: { readOnly: true, description: 'Cost in credits/dollars.' } },
        { name: 'generatedAt', type: 'date', admin: { readOnly: true } },
        {
          name: 'generatedByUser',
          type: 'relationship',
          relationTo: 'team',
          admin: { readOnly: true },
        },
      ],
    },

    // ── Status & Usage ──
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Draft', value: 'draft' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'usageCount',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'isPinned',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', description: 'Pin to top of library.' },
    },
    {
      name: 'tags',
      type: 'text',
      hasMany: true,
      admin: { description: 'Searchable tags.' },
    },
  ],
}
