import type { GlobalConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'
import { generateGlobalPreviewPath } from '@/utilities/generateGlobalPreviewPath'
import { revalidateGlobal } from './hooks/revalidateGlobal'

export const FaqPageConfig: GlobalConfig = {
  slug: 'faqPage',
  label: 'FAQ Page',
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
    livePreview: { url: generateGlobalPreviewPath('faqPage') },
    preview: () => generateGlobalPreviewPath('faqPage'),
  },
  fields: [
    {
      type: 'collapsible', label: 'Page Metadata', admin: { initCollapsed: true },
      fields: [
        { name: 'metaTitle', type: 'text', defaultValue: 'FAQ — UglyLook' },
        { name: 'metaDescription', type: 'textarea', defaultValue: 'Shipping, returns, sizing, care, and payment questions answered. No chatbot.' },
        { name: 'metaImage', type: 'upload', relationTo: 'media', admin: { description: 'Social sharing image (1200×630 recommended).' } },
      ],
    },
    {
      type: 'collapsible', label: 'Section Header', admin: { initCollapsed: false },
      fields: [
        { name: 'sectionLabel', type: 'text', defaultValue: 'INFO / 03' },
        { name: 'heading', type: 'text', defaultValue: "FAQ. Fine, we'll explain." },
      ],
    },
    {
      type: 'collapsible', label: 'FAQ Categories', admin: { initCollapsed: false },
      fields: [
        {
          name: 'categories', type: 'array', maxRows: 10,
          fields: [
            { name: 'visible', type: 'checkbox', defaultValue: true, label: 'Show on site' },
            { name: 'name', type: 'text', required: true },
            {
              name: 'questions', type: 'array', maxRows: 10,
              fields: [
                { name: 'visible', type: 'checkbox', defaultValue: true, label: 'Show on site' },
                { name: 'question', type: 'text', required: true },
                { name: 'answer', type: 'textarea', required: true },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible', label: 'Footer CTA', admin: { initCollapsed: true },
      fields: [
        { name: 'showFooterCta', type: 'checkbox', defaultValue: true, label: 'Show on site' },
        { name: 'footerCtaText', type: 'textarea', defaultValue: "Still have questions? We read everything. We reply when there's something to say." },
      ],
    },
  ],
}
