import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'

export const AIModelRegistry: CollectionConfig = {
  slug: 'ai-model-registry',
  labels: { singular: 'AI Model', plural: 'AI Models' },
  admin: {
    group: 'Printify',
    useAsTitle: 'displayName',
    defaultColumns: ['displayName', 'provider', 'modelType', 'tag', 'isDefault', 'isEnabled'],
  },
  access: {
    create: isAdmin,
    read: () => true, // all roles need to see models in Design Studio
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    // ── Identity ──
    {
      name: 'modelId',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'API model ID. e.g., "claude-opus-4-6", "flux-2-pro"' },
    },
    {
      name: 'displayName',
      type: 'text',
      required: true,
      admin: { description: 'Shown in UI. e.g., "Claude Opus 4.6", "FLUX 2.0 Pro"' },
    },
    {
      name: 'family',
      type: 'text',
      required: true,
      admin: { description: 'Grouping. e.g., "Claude Opus", "FLUX", "Gemini"' },
    },
    {
      name: 'version',
      type: 'text',
      admin: { description: 'e.g., "4.6", "2.0 Pro", "2.5 Flash"' },
    },
    {
      name: 'provider',
      type: 'select',
      required: true,
      options: [
        { label: 'Anthropic', value: 'anthropic' },
        { label: 'BFL (Black Forest Labs)', value: 'bfl' },
        { label: 'Google (Gemini)', value: 'gemini' },
        { label: 'OpenAI', value: 'openai' },
      ],
    },

    // ── Type & Capability ──
    {
      name: 'modelType',
      type: 'select',
      required: true,
      options: [
        { label: 'Prompt Engineering (text to text)', value: 'prompt' },
        { label: 'Image Generation (text to image)', value: 'image' },
        { label: 'Image Editing (image to image)', value: 'image-edit' },
      ],
    },
    {
      name: 'tag',
      type: 'select',
      options: [
        { label: 'DEFAULT', value: 'default' },
        { label: 'FAST', value: 'fast' },
        { label: 'BETTER', value: 'better' },
        { label: 'BEST', value: 'best' },
        { label: 'DRAFT', value: 'draft' },
        { label: 'CREATIVE', value: 'creative' },
      ],
    },

    // ── Pricing ──
    {
      name: 'costPerImage',
      type: 'number',
      admin: { description: 'Image models: USD per image. e.g., 0.075', step: 0.001 },
    },
    {
      name: 'costPer1kInputTokens',
      type: 'number',
      admin: { description: 'Prompt models: USD per 1K input tokens', step: 0.0001 },
    },
    {
      name: 'costPer1kOutputTokens',
      type: 'number',
      admin: { description: 'Prompt models: USD per 1K output tokens', step: 0.0001 },
    },

    // ── Status ──
    {
      name: 'isEnabled',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Disabled models hidden from Design Studio selector' },
    },
    {
      name: 'isDefault',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Default model for its type (one per type)' },
    },

    // ── Sync Metadata ──
    {
      name: 'source',
      type: 'select',
      defaultValue: 'manual',
      options: [
        { label: 'Manual', value: 'manual' },
        { label: 'Auto-synced', value: 'auto' },
      ],
    },
    { name: 'lastVerifiedAt', type: 'date' },
    {
      name: 'isDeprecated',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Flagged deprecated by provider during auto-sync' },
    },

    // ── User-facing description ──
    {
      name: 'shortDescription',
      type: 'text',
      admin: { description: 'One-line description shown in Design Studio selector. e.g., "Best quality, sharp details"' },
    },

    // ── Notes ──
    { name: 'notes', type: 'textarea', admin: { description: 'Admin notes about this model (not shown to users)' } },
  ],
}
