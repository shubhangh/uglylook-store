import type { GlobalConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'
import { revalidateGlobal } from './hooks/revalidateGlobal'

export const AnnouncementBar: GlobalConfig = {
  slug: 'announcementBar',
  label: 'Announcement Bar',
  access: {
    read: () => true,
    update: adminOnly,
  },
  hooks: {
    afterChange: [revalidateGlobal],
  },
  admin: {
    group: 'Site',
    livePreview: { url: '/' },
    preview: () => '/',
  },
  fields: [
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: false,
      label: 'Show announcement bar on site',
    },
    {
      name: 'text',
      type: 'text',
      required: true,
      defaultValue: 'Free shipping on orders over $75',
    },
    {
      name: 'link',
      type: 'text',
      admin: {
        description: 'Optional URL. If set, the bar becomes clickable.',
      },
    },
    {
      name: 'backgroundColor',
      type: 'select',
      defaultValue: 'olive',
      options: [
        { label: 'Olive (#5A6242)', value: 'olive' },
        { label: 'Petrol (#264A4F)', value: 'petrol' },
        { label: 'Bone (#D9D2C2)', value: 'bone' },
        { label: 'Black (#111111)', value: 'black' },
      ],
    },
    {
      name: 'textColor',
      type: 'select',
      defaultValue: 'light',
      options: [
        { label: 'Light (cream)', value: 'light' },
        { label: 'Dark (black)', value: 'dark' },
      ],
    },
    {
      name: 'dismissible',
      type: 'checkbox',
      defaultValue: true,
      label: 'Allow visitors to dismiss',
    },
  ],
}
