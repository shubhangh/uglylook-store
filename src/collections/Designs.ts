import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'

export const Designs: CollectionConfig = {
  slug: 'designs',
  labels: { singular: 'Design', plural: 'Designs' },
  admin: {
    group: 'Ecommerce',
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'designLane', 'emotionTier', 'forCategories', 'isPinned', 'status', 'usageCount'],
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
      name: 'ulTitle',
      type: 'text',
      unique: true,
      index: true,
      admin: { description: 'Internal slug: title-model-name (e.g., "melt-protocol-flux-2-0-pro"). Auto-generated.' },
    },
    {
      name: 'designFile',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: { description: 'Print-ready design PNG (transparent bg, 300+ DPI)' },
    },
    {
      name: 'designUrl',
      type: 'text',
      admin: { readOnly: true, description: 'Auto-populated R2 URL after upload' },
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Optional smaller preview' },
    },

    // ── Classification ──
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Logo', value: 'logo' },
        { label: 'Text Composition', value: 'text-composition' },
        { label: 'Graphic', value: 'graphic' },
        { label: 'Pattern / All-Over', value: 'pattern' },
        { label: 'Typography Only', value: 'typography' },
        { label: 'Photo / Illustration', value: 'illustration' },
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
        { label: 'Tier A — Flagship (Evergreen)', value: 'A' },
        { label: 'Tier B — Supporting', value: 'B' },
        { label: 'Tier C — Perishable (Post-Launch)', value: 'C' },
      ],
    },
    { name: 'emotionPrimary', type: 'text', admin: { description: 'e.g., "self-deprecation as armor"' } },

    // ── Compatibility ──
    {
      name: 'forCategories',
      type: 'select',
      hasMany: true,
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
      name: 'forGarmentColors',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Dark Garments', value: 'dark' },
        { label: 'Light Garments', value: 'light' },
        { label: 'Both', value: 'both' },
      ],
    },

    // ── Text Content ──
    { name: 'printText', type: 'text', admin: { description: 'e.g., "ERROR 404", "EMOTIONALLY UNAVAILABLE"' } },
    { name: 'fontInfo', type: 'text', admin: { description: 'e.g., "JetBrains Mono Bold, distressed"' } },

    // ── Generation Metadata ──
    {
      name: 'generatedBy',
      type: 'select',
      options: [
        { label: 'AI — FLUX 2.0 Pro', value: 'flux-2-pro' },
        { label: 'AI — Gemini 2.5 Flash', value: 'gemini-2.5-flash' },
        { label: 'AI — Gemini 3 Pro Image', value: 'gemini-3-pro-image' },
        { label: 'AI — GPT Image 1', value: 'gpt-image-1' },
        { label: 'AI — GPT Image 2', value: 'gpt-image-2' },
        { label: 'Manual — Illustrator/Figma', value: 'manual' },
        { label: 'Pre-existing Asset', value: 'existing' },
      ],
    },
    { name: 'generationPrompt', type: 'textarea', admin: { rows: 4, description: 'The full prompt used to generate this design' } },
    { name: 'generationCost', type: 'number', admin: { description: 'Cost in USD to generate', step: 0.001 } },
    { name: 'promptModel', type: 'text', admin: { description: 'Claude model used for prompt generation' } },
    { name: 'imageModel', type: 'text', admin: { description: 'Image model ID used for generation (e.g., flux-2-pro)' } },
    { name: 'imageModelDisplayName', type: 'text', admin: { description: 'Display name of image model (e.g., FLUX 2.0 Pro)' } },
    { name: 'generatedAt', type: 'date', admin: { readOnly: true, description: 'When this design was generated' } },
    { name: 'generationTimeSeconds', type: 'number', admin: { readOnly: true, description: 'Time taken to generate (seconds)' } },
    {
      name: 'generatedByUser',
      type: 'relationship',
      relationTo: 'team',
      admin: { readOnly: true, description: 'Team member who generated this design' },
    },

    // ── Preset Link ──
    {
      name: 'preset',
      type: 'relationship',
      relationTo: 'design-presets',
      admin: { description: 'Preset used to generate this design (null if from scratch)', readOnly: true },
    },

    // ── Usage ──
    { name: 'usageCount', type: 'number', defaultValue: 0, admin: { readOnly: true, description: 'Products referencing this design' } },
    { name: 'isPinned', type: 'checkbox', defaultValue: false, admin: { description: 'Pinned designs appear first in pickers' } },
    { name: 'tags', type: 'json', admin: { description: 'Searchable tags: ["logo", "light", "horizontal"]' } },

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

    // ── Print Specs ──
    { name: 'printWidth', type: 'number', admin: { description: 'Width in pixels' } },
    { name: 'printHeight', type: 'number', admin: { description: 'Height in pixels' } },
    { name: 'dpi', type: 'number', defaultValue: 300 },

    // ── Source Graphic Link ──
    {
      name: 'sourceGraphic',
      type: 'relationship',
      relationTo: 'ai-graphics',
      admin: { description: 'AI graphic used as background (if text-composition workflow)' },
    },

    // ── Cross-collection link ──
    {
      name: 'alsoInMedia',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'If true, design file is also browsable in the general Media collection' },
    },
  ],
}
