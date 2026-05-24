import type { GlobalConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'

export const DropPageConfig: GlobalConfig = {
  slug: 'dropPage',
  label: 'Drop Page',
  access: { read: () => true, update: adminOnly },
  fields: [
    {
      type: 'collapsible', label: 'Section Header', admin: { initCollapsed: false },
      fields: [
        { name: 'showHeader', type: 'checkbox', defaultValue: true, label: 'Show on site' },
        { name: 'sectionNumber', type: 'text', defaultValue: 'SEC / 06' },
        { name: 'heading', type: 'text', defaultValue: 'SS27 / 01 — opens when it opens.' },
        { name: 'subheading', type: 'text', defaultValue: "We're not counting because urgency is for amateurs · but here's the number anyway" },
      ],
    },
    {
      type: 'collapsible', label: 'Countdown', admin: { initCollapsed: false },
      fields: [
        { name: 'showCountdown', type: 'checkbox', defaultValue: true, label: 'Show on site' },
        { name: 'targetDate', type: 'date', defaultValue: '2027-01-14T14:00:00.000Z', admin: { date: { pickerAppearance: 'dayAndTime' } } },
      ],
    },
    {
      type: 'collapsible', label: 'Footer Note', admin: { initCollapsed: true },
      fields: [
        { name: 'showFooterNote', type: 'checkbox', defaultValue: true, label: 'Show on site' },
        { name: 'footerNote', type: 'text', defaultValue: 'No early access. No waitlist. No "notify me."' },
      ],
    },
  ],
}
