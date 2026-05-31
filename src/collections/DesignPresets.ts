import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'

export const DesignPresets: CollectionConfig = {
  slug: 'design-presets',
  labels: { singular: 'Design Preset', plural: 'Design Presets' },
  admin: {
    group: 'Printify',
    useAsTitle: 'name',
    defaultColumns: ['name', 'generationMode', 'category', 'designLane', 'timesUsed', 'lastUsedAt'],
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

    // ── Prompt Config ──
    {
      name: 'promptModel',
      type: 'relationship',
      relationTo: 'ai-model-registry',
      admin: { description: 'Claude model for prompt generation' },
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
      name: 'skipAiPrompt',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Skip Claude — use template prompt directly' },
    },
    {
      name: 'templatePrompt',
      type: 'textarea',
      admin: { description: 'Pre-written prompt template. Used if skipAiPrompt is true, or as extra context for Claude.' },
    },

    // ── Image Config ──
    {
      name: 'imageModel',
      type: 'relationship',
      relationTo: 'ai-model-registry',
      admin: { description: 'Image generation model' },
    },
    { name: 'defaultCount', type: 'number', defaultValue: 4, min: 1, max: 10 },

    // ── Design Config ──
    {
      name: 'generationMode',
      type: 'select',
      options: [
        { label: 'Free Brief', value: 'free-brief' },
        { label: 'Fashion Doc', value: 'fashion-doc' },
        { label: 'Upload Doc', value: 'upload-doc' },
        { label: 'Combined', value: 'combined' },
        { label: 'Reference Images', value: 'reference-images' },
        { label: 'SKU-Based', value: 'sku-based' },
        { label: 'Remix', value: 'remix' },
      ],
      defaultValue: 'free-brief',
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Hoodies', value: 'hoodies' },
        { label: 'Tees', value: 'tees' },
        { label: 'Hats', value: 'hats' },
        { label: 'Totes', value: 'totes' },
        { label: 'Sweatshirts', value: 'sweatshirts' },
        { label: 'All', value: 'all' },
      ],
    },
    {
      name: 'garmentColor',
      type: 'select',
      options: [
        { label: 'Dark', value: 'dark' },
        { label: 'Light', value: 'light' },
        { label: 'Both', value: 'both' },
      ],
    },
    {
      name: 'designType',
      type: 'select',
      options: [
        { label: 'Logo', value: 'logo' },
        { label: 'Text Composition', value: 'text-composition' },
        { label: 'Graphic', value: 'graphic' },
        { label: 'Pattern', value: 'pattern' },
        { label: 'Typography Only', value: 'typography' },
      ],
    },
    {
      name: 'designLane',
      type: 'select',
      options: [
        { label: 'Ironic Text-Only', value: 'ironic-text' },
        { label: 'Anti-Design / Brutalist', value: 'brutalist' },
        { label: 'Weirdcore / Liminal', value: 'weirdcore' },
        { label: 'Maximalist Collage', value: 'maximalist' },
        { label: 'Y2K-Adjacent', value: 'y2k' },
        { label: 'Logo / Brand', value: 'logo-brand' },
      ],
    },
    {
      name: 'emotionTier',
      type: 'select',
      options: [
        { label: 'Tier A — Flagship', value: 'A' },
        { label: 'Tier B — Supporting', value: 'B' },
        { label: 'Tier C — Perishable', value: 'C' },
      ],
    },

    // ── Usage Stats (auto-updated) ──
    { name: 'timesUsed', type: 'number', defaultValue: 0, admin: { readOnly: true } },
    { name: 'lastUsedAt', type: 'date', admin: { readOnly: true } },
    { name: 'designsGenerated', type: 'number', defaultValue: 0, admin: { readOnly: true } },

    // ── Created By ──
    { name: 'createdByUser', type: 'relationship', relationTo: 'team' },
  ],
}
