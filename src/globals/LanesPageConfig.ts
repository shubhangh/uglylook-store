import type { GlobalConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'

export const LanesPageConfig: GlobalConfig = {
  slug: 'lanesPage',
  label: 'Lanes Page',
  access: { read: () => true, update: adminOnly },
  fields: [
    {
      type: 'collapsible', label: 'Page Metadata', admin: { initCollapsed: true },
      fields: [
        { name: 'metaTitle', type: 'text', defaultValue: 'Lanes — UglyLook' },
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
