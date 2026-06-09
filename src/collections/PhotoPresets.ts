import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'

export const PhotoPresets: CollectionConfig = {
  slug: 'photo-presets',
  labels: { singular: 'Photo Preset', plural: 'Photo Presets' },
  admin: {
    group: 'Content',
    useAsTitle: 'name',
    defaultColumns: ['name', 'photoType', 'background', 'mood', 'isActive', 'timesUsed'],
  },
  access: {
    create: () => true,
    read: () => true,
    update: () => true,
    delete: isAdmin,
  },
  fields: [
    // ── Identity ──
    { name: 'name', type: 'text', required: true },
    { name: 'description', type: 'textarea' },

    // ── Photo Config ──
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
    },
    {
      name: 'background',
      type: 'select',
      options: [
        { label: 'Near-Black (#111)', value: 'near-black' },
        { label: 'Cream (#F5F2EC)', value: 'cream' },
        { label: 'Environment', value: 'environment' },
        { label: 'Concrete', value: 'concrete' },
      ],
      defaultValue: 'near-black',
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
    },

    // ── Prompt Config ──
    {
      name: 'promptModel',
      type: 'relationship',
      relationTo: 'ai-model-registry',
      admin: { description: 'Claude/Gemini model for prompt generation.' },
    },
    {
      name: 'detailLevel',
      type: 'select',
      options: [
        { label: 'Low (~100 words)', value: 'low' },
        { label: 'Medium (~200 words)', value: 'medium' },
        { label: 'High (~350 words)', value: 'high' },
        { label: 'Very High (~500 words)', value: 'very-high' },
      ],
      defaultValue: 'medium',
    },
    {
      name: 'promptTemplate',
      type: 'textarea',
      admin: {
        description:
          'Base prompt template. Use {{product}}, {{design}}, {{color}} as placeholders. If provided, used as context for AI prompt generation.',
      },
    },

    // ── Image Config ──
    {
      name: 'defaultImageModel',
      type: 'text',
      defaultValue: 'flux-2-pro',
      admin: { description: 'Default image generation model ID.' },
    },

    // ── State ──
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar', description: 'Show in preset picker.' },
    },
    {
      name: 'timesUsed',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'lastUsedAt',
      type: 'date',
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
}
