import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { generateGlobalPreviewPath } from '@/utilities/generateGlobalPreviewPath'
import { revalidateGlobal } from './hooks/revalidateGlobal'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
    update: adminOnly,
  },
  hooks: {
    afterChange: [revalidateGlobal],
  },
  admin: {
    group: 'Site',
    livePreview: {
      url: generateGlobalPreviewPath('footer'),
    },
    preview: () => generateGlobalPreviewPath('footer'),
  },
  fields: [
    // ── Brand Column ──
    {
      type: 'collapsible',
      label: 'Brand Column',
      admin: { initCollapsed: false },
      fields: [
        {
          name: 'showBrandColumn',
          type: 'checkbox',
          defaultValue: true,
          label: 'Show brand column on site',
        },
        {
          type: 'collapsible',
          label: 'Logo Lockup',
          admin: { initCollapsed: true },
          fields: [
            {
              name: 'showLogo',
              type: 'checkbox',
              defaultValue: true,
              label: 'Show logo lockup on site',
              admin: { position: 'sidebar' },
            },
          ],
        },
        {
          type: 'collapsible',
          label: 'Tagline',
          admin: { initCollapsed: true },
          fields: [
            {
              name: 'showTagline',
              type: 'checkbox',
              defaultValue: true,
              label: 'Show tagline on site',
            },
            {
              name: 'tagline',
              type: 'text',
              defaultValue: 'UGLY IS THE NEW SICK',
            },
          ],
        },
        {
          type: 'collapsible',
          label: 'Email Signup',
          admin: { initCollapsed: false },
          fields: [
            {
              name: 'showEmailSignup',
              type: 'checkbox',
              defaultValue: true,
              label: 'Show email signup on site',
            },
            {
              name: 'emailPlaceholder',
              type: 'text',
              defaultValue: 'your@email.com',
              label: 'Input placeholder',
            },
            {
              name: 'emailButtonText',
              type: 'text',
              defaultValue: 'Subscribe',
              label: 'Button text',
            },
            {
              name: 'emailSuccessMessage',
              type: 'text',
              defaultValue: 'Got it. No welcome email. Just drops.',
              label: 'Success message',
            },
            {
              name: 'showEmailNote',
              type: 'checkbox',
              defaultValue: true,
              label: 'Show note below form on site',
            },
            {
              name: 'emailNote',
              type: 'text',
              defaultValue: 'no discount. no welcome series. just drops when they drop.',
              label: 'Note text',
            },
          ],
        },
      ],
    },

    // ── Link Columns ──
    {
      type: 'collapsible',
      label: 'Link Columns',
      admin: { initCollapsed: false },
      fields: [
        {
          name: 'showColumns',
          type: 'checkbox',
          defaultValue: true,
          label: 'Show link columns on site',
        },
        {
          name: 'columns',
          type: 'array',
          maxRows: 4,
          fields: [
            {
              name: 'visible',
              type: 'checkbox',
              defaultValue: true,
              label: 'Show this column on site',
            },
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'links',
              type: 'array',
              maxRows: 8,
              fields: [
                {
                  name: 'visible',
                  type: 'checkbox',
                  defaultValue: true,
                  label: 'Show this link on site',
                },
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'url',
                  type: 'text',
                  required: true,
                  admin: {
                    description: 'Relative path (/shop) or full URL (mailto:…)',
                  },
                },
                {
                  name: 'newTab',
                  type: 'checkbox',
                  defaultValue: false,
                },
              ],
            },
          ],
        },
      ],
    },

    // ── Bottom Bar ──
    {
      type: 'collapsible',
      label: 'Bottom Bar',
      admin: { initCollapsed: false },
      fields: [
        {
          name: 'showBottomBar',
          type: 'checkbox',
          defaultValue: true,
          label: 'Show bottom bar on site',
        },
        {
          type: 'collapsible',
          label: 'Copyright',
          admin: { initCollapsed: true },
          fields: [
            {
              name: 'showCopyright',
              type: 'checkbox',
              defaultValue: true,
              label: 'Show copyright on site',
            },
            {
              name: 'copyrightText',
              type: 'text',
              defaultValue: '© 2026 UglyLook · POD partners: Printful + Gelato',
            },
          ],
        },
        {
          type: 'collapsible',
          label: 'Theme Toggle',
          admin: { initCollapsed: true },
          fields: [
            {
              name: 'showThemeToggle',
              type: 'checkbox',
              defaultValue: true,
              label: 'Show theme toggle on site',
            },
            {
              name: 'themeToggleAlignment',
              type: 'select',
              defaultValue: 'center',
              label: 'Alignment',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
                { label: 'Right', value: 'right' },
              ],
            },
          ],
        },
        {
          type: 'collapsible',
          label: 'Bottom Note',
          admin: { initCollapsed: true },
          fields: [
            {
              name: 'showBottomNote',
              type: 'checkbox',
              defaultValue: true,
              label: 'Show bottom note on site',
            },
            {
              name: 'bottomNote',
              type: 'text',
              defaultValue: 'printed when you ordered it',
            },
          ],
        },
      ],
    },
  ],
}
