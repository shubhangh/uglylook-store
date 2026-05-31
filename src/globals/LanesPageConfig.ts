import type { GlobalConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'
import { generateGlobalPreviewPath } from '@/utilities/generateGlobalPreviewPath'
import { revalidateGlobal } from './hooks/revalidateGlobal'

export const LanesPageConfig: GlobalConfig = {
  slug: 'lanesPage',
  label: 'Lanes Page',
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
    livePreview: { url: generateGlobalPreviewPath('lanesPage') },
    preview: () => generateGlobalPreviewPath('lanesPage'),
  },
  fields: [
    {
      type: 'collapsible', label: 'Page Metadata', admin: { initCollapsed: true },
      fields: [
        { name: 'metaTitle', type: 'text', defaultValue: 'Lanes — UglyLook' },
        { name: 'metaDescription', type: 'textarea', defaultValue: 'Five design lanes. No drift, no athletic, no kids. The UglyLook catalog structure.' },
        { name: 'metaImage', type: 'upload', relationTo: 'media', admin: { description: 'Social sharing image (1200×630 recommended).' } },
      ],
    },
    {
      type: 'collapsible', label: 'Section Header', admin: { initCollapsed: false },
      fields: [
        { name: 'showHeader', type: 'checkbox', defaultValue: true, label: 'Show on site' },
        { name: 'sectionNumber', type: 'text', defaultValue: 'SEC / 04' },
        { name: 'heading', type: 'text', defaultValue: "Five lanes. That's the catalog." },
        { name: 'subheading', type: 'text', defaultValue: 'No drift · no "athletic" · no "soft and feminine" · no kids' },
      ],
    },
    {
      type: 'collapsible', label: 'Lanes List', admin: { initCollapsed: false },
      fields: [
        { name: 'showLanes', type: 'checkbox', defaultValue: true, label: 'Show on site' },
        {
          name: 'lanes', type: 'array', maxRows: 10,
          fields: [
            { name: 'visible', type: 'checkbox', defaultValue: true, label: 'Show on site' },
            { name: 'number', type: 'text', required: true },
            { name: 'name', type: 'text', required: true },
            { name: 'description', type: 'textarea', required: true },
          ],
        },
      ],
    },
    {
      type: 'collapsible', label: 'Negative Space Box', admin: { initCollapsed: true },
      fields: [
        { name: 'showNegativeBox', type: 'checkbox', defaultValue: true, label: 'Show on site' },
        { name: 'negativeBoxLabel', type: 'text', defaultValue: 'Not in the catalog' },
        { name: 'negativeBoxContent', type: 'textarea', defaultValue: 'clean minimalism · soft / feminine · athletic / performance · luxury polish · kids & family · anything that needs the joke explained.' },
      ],
    },
  ],
}
