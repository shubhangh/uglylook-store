import type { GlobalConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'

export const ThesisPageConfig: GlobalConfig = {
  slug: 'thesisPage',
  label: 'Thesis Page',
  access: { read: () => true, update: adminOnly },
  fields: [
    {
      type: 'collapsible', label: 'Page Metadata', admin: { initCollapsed: true },
      fields: [
        { name: 'metaTitle', type: 'text', defaultValue: 'Thesis — UglyLook' },
      ],
    },
    {
      type: 'collapsible', label: 'Section Header', admin: { initCollapsed: false },
      fields: [
        { name: 'showHeader', type: 'checkbox', defaultValue: true, label: 'Show on site' },
        { name: 'sectionNumber', type: 'text', defaultValue: 'SEC / 03' },
        { name: 'heading', type: 'text', defaultValue: 'The thesis. In writing.' },
        { name: 'subheading', type: 'text', defaultValue: 'Why the name works · why the filter is permanent' },
      ],
    },
    {
      type: 'collapsible', label: 'Lede', admin: { initCollapsed: true },
      fields: [
        { name: 'showLede', type: 'checkbox', defaultValue: true, label: 'Show on site' },
        { name: 'lede', type: 'textarea', defaultValue: 'Every generation invents new slang for "good," and every word started its life meaning bad. We\'re just the first ones putting it on the chest.' },
      ],
    },
    {
      type: 'collapsible', label: 'Content Columns', admin: { initCollapsed: true },
      fields: [
        { name: 'showColumns', type: 'checkbox', defaultValue: true, label: 'Show on site' },
        {
          name: 'columns', type: 'array', maxRows: 4,
          fields: [
            { name: 'visible', type: 'checkbox', defaultValue: true, label: 'Show on site' },
            { name: 'heading', type: 'text', required: true },
            { name: 'paragraph1', type: 'textarea', required: true },
            { name: 'paragraph2', type: 'textarea' },
          ],
        },
      ],
    },
    {
      type: 'collapsible', label: 'Rules Block', admin: { initCollapsed: true },
      fields: [
        { name: 'showRules', type: 'checkbox', defaultValue: true, label: 'Show on site' },
        { name: 'rulesTerm', type: 'text', defaultValue: "What we don't do" },
        { name: 'rulesDefinition', type: 'textarea', defaultValue: '"Curated." Founder selfies. Points programs. Referral wheels. 10%-off-for-your-email popups. Mountain hero shots. Coffee-cup lifestyle. Black Friday in the standard way. Performing Gen Z in the copy. Soft pastel anything. Recoloring the logo. Explaining the joke.' },
      ],
    },
  ],
}
