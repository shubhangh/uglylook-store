import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'

/**
 * AI Models — reusable model personas for AI image generation.
 *
 * Defines a roster of virtual models (name, gender, ethnicity, age, build, hair)
 * that can be selected in Photo Studio and other AI studios. Ensures visual
 * consistency across sessions by locking down the model description once
 * and reusing it across shoots.
 *
 * Phase 2 (future): referenceImages field for image-to-image consistency.
 */
export const AIModels: CollectionConfig = {
  slug: 'ai-models',
  labels: { singular: 'AI Model Persona', plural: 'AI Model Personas' },
  admin: {
    group: 'Automate',
    useAsTitle: 'name',
    defaultColumns: ['name', 'gender', 'ethnicity', 'ageRange', 'isActive'],
    description: 'Reusable model personas for AI photo generation. Select these in Photo Studio for consistent results.',
  },
  access: {
    create: isAdmin,
    read: () => true,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'Display name. e.g. "Arun", "Model A", "UL-M-01"' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'gender',
          type: 'select',
          required: true,
          defaultValue: 'male',
          options: [
            { label: 'Male', value: 'male' },
            { label: 'Female', value: 'female' },
          ],
          admin: { width: '33%' },
        },
        {
          name: 'ethnicity',
          type: 'select',
          defaultValue: 'any',
          options: [
            { label: 'Any / AI Pick', value: 'any' },
            { label: 'South Asian', value: 'south-asian' },
            { label: 'East Asian', value: 'east-asian' },
            { label: 'Southeast Asian', value: 'southeast-asian' },
            { label: 'Black', value: 'black' },
            { label: 'White / Caucasian', value: 'white' },
            { label: 'Latino / Hispanic', value: 'latino' },
            { label: 'Middle Eastern', value: 'middle-eastern' },
            { label: 'Mixed Race', value: 'mixed' },
          ],
          admin: { width: '33%' },
        },
        {
          name: 'ageRange',
          type: 'text',
          defaultValue: '22-26',
          admin: {
            width: '33%',
            description: 'e.g. "22-26" or "24"',
          },
        },
      ],
    },
    {
      name: 'build',
      type: 'text',
      defaultValue: 'athletic-lean build',
      admin: { description: 'Body description. e.g. "athletic-lean build, 5\'11\\"", "slim-athletic, 5\'8\\""' },
    },
    {
      name: 'hairStyle',
      type: 'text',
      defaultValue: 'short dark hair, clean-shaven',
      admin: { description: 'Hair + facial hair. e.g. "short black hair, clean-shaven", "shoulder-length brown hair"' },
    },
    {
      name: 'distinguishingFeatures',
      type: 'text',
      admin: { description: 'Optional. e.g. "sharp jawline, light stubble", "high cheekbones, freckles"' },
    },
    {
      name: 'promptDescription',
      type: 'textarea',
      admin: {
        description: 'Full prompt snippet for this model. Auto-generated from fields above, or hand-tune for better results. This exact text is injected into the image prompt.',
      },
    },
    {
      name: 'referenceImages',
      type: 'array',
      admin: {
        description: 'Best generated images of this model. Phase 2: used as image-to-image reference for supported AI models.',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: { description: 'Internal notes. Prompt tweaks that worked well, etc.' },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
  ],
}
