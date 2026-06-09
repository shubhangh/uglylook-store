import type { GlobalConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'
import { generateGlobalPreviewPath } from '@/utilities/generateGlobalPreviewPath'
import { revalidateGlobal } from './hooks/revalidateGlobal'
import { imageDisplayFields } from '@/fields/imageDisplay'

export const AboutPageConfig: GlobalConfig = {
  slug: 'aboutPage',
  label: 'About Page',
  access: { read: () => true, update: adminOnly },
  versions: {
    drafts: { autosave: true },
    max: 25,
  },
  hooks: {
    afterChange: [revalidateGlobal],
  },
  admin: {
    group: 'Globals',
    livePreview: { url: generateGlobalPreviewPath('aboutPage') },
    preview: () => generateGlobalPreviewPath('aboutPage'),
  },
  fields: [
    {
      type: 'collapsible',
      label: 'Page Metadata',
      admin: { initCollapsed: true },
      fields: [
        { name: 'metaTitle', type: 'text', defaultValue: 'About' },
        {
          name: 'metaDescription',
          type: 'textarea',
          defaultValue:
            'The brand behind the name. UglyLook\'s philosophy, design lanes, and quality standards.',
        },
        {
          name: 'metaImage',
          type: 'upload',
          relationTo: 'media',
          admin: { description: 'Social sharing image (1200x630 recommended).' },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Hero',
      admin: { initCollapsed: false },
      fields: [
        { name: 'heading', type: 'text', defaultValue: 'The brand.' },
        {
          name: 'subtext',
          type: 'textarea',
          defaultValue:
            'Every generation invents new slang for "good." Every word started its life meaning bad. We\'re just the first ones putting it on the chest.',
        },
        {
          name: 'heroImage',
          type: 'upload',
          relationTo: 'media',
          admin: { description: 'Hero image — campaign/editorial photo (optional).' },
        },
        ...imageDisplayFields('heroImage'),
      ],
    },
    {
      type: 'collapsible',
      label: 'Section Visibility',
      admin: { initCollapsed: false },
      fields: [
        {
          name: 'showPhilosophy',
          type: 'checkbox',
          defaultValue: true,
          label: 'Show brand philosophy section (from Thesis global)',
        },
        {
          name: 'showLanes',
          type: 'checkbox',
          defaultValue: true,
          label: 'Show design lanes section (from Lanes global)',
        },
        {
          name: 'showSpecs',
          type: 'checkbox',
          defaultValue: true,
          label: 'Show quality & specs section (from Homepage global)',
        },
        {
          name: 'showRules',
          type: 'checkbox',
          defaultValue: true,
          label: 'Show "what we don\'t do" section (from Thesis global)',
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Section Images',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'philosophyImage',
          type: 'upload',
          relationTo: 'media',
          admin: { description: 'Editorial image between philosophy and lanes sections.' },
        },
        ...imageDisplayFields('philosophyImage'),
        {
          name: 'specsImage',
          type: 'upload',
          relationTo: 'media',
          admin: { description: 'Image for the quality & specs section.' },
        },
        ...imageDisplayFields('specsImage'),
      ],
    },
  ],
}
