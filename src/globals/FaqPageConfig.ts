import type { GlobalConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'

export const FaqPageConfig: GlobalConfig = {
  slug: 'faqPage',
  label: 'FAQ Page',
  access: { read: () => true, update: adminOnly },
  fields: [
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
        { name: 'footerCtaText', type: 'textarea', defaultValue: "Still have questions? Contact us. We read everything. We reply when there's something to say." },
      ],
    },
  ],
}
