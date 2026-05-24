import type { GlobalConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { link } from '@/fields/link'

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    // ── Logo & Wordmark ──
    {
      type: 'collapsible',
      label: 'Logo & Wordmark',
      admin: { initCollapsed: false },
      fields: [
        {
          name: 'showLogo',
          type: 'checkbox',
          defaultValue: true,
          label: 'Show logo icon on site',
        },
        {
          name: 'logo',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Logo icon (square, ~36px). Leave empty to use default UglyLook icon.',
          },
        },
        {
          name: 'showWordmark',
          type: 'checkbox',
          defaultValue: true,
          label: 'Show wordmark on site',
        },
        {
          name: 'wordmarkLight',
          label: 'Wordmark (for dark backgrounds)',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'SVG or PNG wordmark displayed on dark theme. Leave empty for default.',
          },
        },
        {
          name: 'wordmarkDark',
          label: 'Wordmark (for light backgrounds)',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'SVG or PNG wordmark displayed on light theme. Leave empty for default.',
          },
        },
      ],
    },

    // ── Navigation ──
    {
      type: 'collapsible',
      label: 'Navigation',
      admin: { initCollapsed: false },
      fields: [
        {
          name: 'showNav',
          type: 'checkbox',
          defaultValue: true,
          label: 'Show navigation on site',
        },
        {
          name: 'navItems',
          type: 'array',
          maxRows: 8,
          fields: [
            {
              name: 'visible',
              type: 'checkbox',
              defaultValue: true,
              label: 'Show this link on site',
            },
            link({
              appearances: false,
            }),
          ],
        },
      ],
    },

    // ── Cart ──
    {
      type: 'collapsible',
      label: 'Cart',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'showCart',
          type: 'checkbox',
          defaultValue: true,
          label: 'Show cart / bag button on site',
        },
      ],
    },
  ],
}
