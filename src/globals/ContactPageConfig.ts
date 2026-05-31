import type { GlobalConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'
import { generateGlobalPreviewPath } from '@/utilities/generateGlobalPreviewPath'
import { revalidateGlobal } from './hooks/revalidateGlobal'

export const ContactPageConfig: GlobalConfig = {
  slug: 'contactPage',
  label: 'Contact Page',
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
    livePreview: { url: generateGlobalPreviewPath('contactPage') },
    preview: () => generateGlobalPreviewPath('contactPage'),
  },
  fields: [
    {
      type: 'collapsible', label: 'Page Metadata', admin: { initCollapsed: true },
      fields: [
        { name: 'metaTitle', type: 'text', defaultValue: 'Contact — UglyLook' },
        { name: 'metaDescription', type: 'textarea', defaultValue: 'Get in touch with UglyLook. We read everything. We reply when there\u2019s something to say.' },
        { name: 'metaImage', type: 'upload', relationTo: 'media', admin: { description: 'Social sharing image (1200×630 recommended).' } },
      ],
    },
    {
      type: 'collapsible', label: 'Section Header', admin: { initCollapsed: false },
      fields: [
        { name: 'sectionNumber', type: 'text', defaultValue: 'SEC / 07' },
        { name: 'heading', type: 'text', defaultValue: 'Contact. If you must.' },
      ],
    },
    {
      type: 'collapsible', label: 'Info Column (Left)', admin: { initCollapsed: false },
      fields: [
        { name: 'showInfoColumn', type: 'checkbox', defaultValue: true, label: 'Show on site' },
        { name: 'infoParagraph', type: 'textarea', defaultValue: "We read everything. We reply when there's something to say. No templates. No auto-responses. Just a person, eventually." },
        { name: 'email', type: 'text', defaultValue: 'hello@uglylook.com' },
        { name: 'showInfoBox', type: 'checkbox', defaultValue: true, label: 'Show info box on site' },
        { name: 'infoBoxLine1', type: 'text', defaultValue: 'No live chat. No chatbot.' },
        { name: 'infoBoxLine2', type: 'text', defaultValue: 'No "how can I help you today" energy.' },
        { name: 'infoBoxLine3', type: 'text', defaultValue: 'No ticket number. No SLA.' },
      ],
    },
    {
      type: 'collapsible', label: 'Form', admin: { initCollapsed: true },
      fields: [
        { name: 'showForm', type: 'checkbox', defaultValue: true, label: 'Show form on site' },
        { name: 'namePlaceholder', type: 'text', defaultValue: 'your name' },
        { name: 'emailPlaceholder', type: 'text', defaultValue: 'you@somewhere.com' },
        { name: 'subjectPlaceholder', type: 'text', defaultValue: 'optional' },
        { name: 'messagePlaceholder', type: 'text', defaultValue: "keep it short or don't. we'll read it either way." },
        { name: 'submitText', type: 'text', defaultValue: 'Send' },
      ],
    },
    {
      type: 'collapsible', label: 'Success State', admin: { initCollapsed: true },
      fields: [
        { name: 'successLabel', type: 'text', defaultValue: 'SENT' },
        { name: 'successHeading', type: 'text', defaultValue: 'Got it.' },
        { name: 'successMessage', type: 'text', defaultValue: "We'll read it eventually. If it needs a reply, you'll get one." },
      ],
    },
  ],
}
