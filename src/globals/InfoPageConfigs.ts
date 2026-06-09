import type { GlobalConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'
import { generateGlobalPreviewPath } from '@/utilities/generateGlobalPreviewPath'
import { revalidateGlobal } from './hooks/revalidateGlobal'
import { imageDisplayFields } from '@/fields/imageDisplay'

// Helper to create a simple section with numbered paragraphs
function textSection(name: string, label: string, defaultTitle: string, defaultContent: string) {
  return {
    type: 'collapsible' as const,
    label,
    admin: { initCollapsed: true },
    fields: [
      { name: `show_${name}`, type: 'checkbox' as const, defaultValue: true, label: 'Show on site' },
      { name: `${name}_title`, type: 'text' as const, defaultValue: defaultTitle },
      { name: `${name}_content`, type: 'textarea' as const, defaultValue: defaultContent },
    ],
  }
}

// ── Shipping & Returns ──
export const ShippingReturnsConfig: GlobalConfig = {
  slug: 'shippingReturnsPage',
  label: 'Shipping & Returns',
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
    livePreview: { url: generateGlobalPreviewPath('shippingReturnsPage') },
    preview: () => generateGlobalPreviewPath('shippingReturnsPage'),
  },
  fields: [
    {
      type: 'collapsible', label: 'Page Metadata', admin: { initCollapsed: true },
      fields: [
        { name: 'metaTitle', type: 'text', defaultValue: 'Shipping & Returns — UglyLook' },
        { name: 'metaDescription', type: 'text', defaultValue: 'Shipping info, return policy, and international fulfillment details.' },
        { name: 'metaImage', type: 'upload' as const, relationTo: 'media' as const, admin: { description: 'Social sharing image (1200×630 recommended).' } },
      ],
    },
    {
      type: 'collapsible', label: 'Section Header', admin: { initCollapsed: false },
      fields: [
        { name: 'sectionLabel', type: 'text', defaultValue: 'INFO / 01' },
        { name: 'heading', type: 'text', defaultValue: 'Shipping & Returns.' },
      ],
    },
    textSection('howItWorks', 'How It Works', 'How it works',
      "Every piece is print-on-demand. Nothing sits in a warehouse. When you order, your item gets printed, pressed, and packed — then shipped directly to you.\n\nFulfillment partners: Printful (US, EU) and Gelato (global). Facilities in Charlotte, Berlin, and Riga — your order ships from the nearest hub."),
    {
      type: 'collapsible', label: 'Shipping Times Table', admin: { initCollapsed: true },
      fields: [
        { name: 'show_shippingTable', type: 'checkbox', defaultValue: true, label: 'Show on site' },
        { name: 'shippingTableTitle', type: 'text', defaultValue: 'Shipping times' },
        {
          name: 'shippingRows', type: 'array', maxRows: 10,
          fields: [
            { name: 'visible', type: 'checkbox', defaultValue: true, label: 'Show on site' },
            { name: 'region', type: 'text', required: true },
            { name: 'production', type: 'text', required: true },
            { name: 'transit', type: 'text', required: true },
          ],
        },
        { name: 'shippingTableNote', type: 'text', defaultValue: 'Total delivery: 5–10 business days for most orders. Customs delays are on customs.' },
      ],
    },
    textSection('returns', 'Returns Policy', 'Returns',
      "30-day return window. Unworn, unwashed, tags still on. That's it.\n\nEmail hello@uglylook.com with your order number and reason. We'll send a return label within 48 hours.\n\nRefunds hit your original payment method within 5–10 business days after we receive the item. No restocking fees. No store credit games."),
    {
      type: 'collapsible', label: "What We Don't Take Back", admin: { initCollapsed: true },
      fields: [
        { name: 'show_noReturns', type: 'checkbox', defaultValue: true, label: 'Show on site' },
        { name: 'noReturnsTitle', type: 'text', defaultValue: "What we don't take back" },
        {
          name: 'noReturnsList', type: 'array', maxRows: 8,
          fields: [
            { name: 'visible', type: 'checkbox', defaultValue: true, label: 'Show on site' },
            { name: 'text', type: 'text', required: true },
          ],
        },
      ],
    },
    textSection('damaged', 'Damaged/Wrong Item', 'Damaged or wrong item',
      "If it arrived damaged or we sent the wrong thing — email us with photos. We'll replace it or refund it. No argument."),
  ],
}

// ── Size Guide ──
export const SizeGuideConfig: GlobalConfig = {
  slug: 'sizeGuidePage',
  label: 'Size Guide',
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
    livePreview: { url: generateGlobalPreviewPath('sizeGuidePage') },
    preview: () => generateGlobalPreviewPath('sizeGuidePage'),
  },
  fields: [
    {
      type: 'collapsible', label: 'Page Metadata', admin: { initCollapsed: true },
      fields: [
        { name: 'metaTitle', type: 'text', defaultValue: 'Size Guide — UglyLook' },
        { name: 'metaDescription', type: 'text', defaultValue: 'Sizing charts and fit guide for UglyLook apparel.' },
        { name: 'metaImage', type: 'upload' as const, relationTo: 'media' as const, admin: { description: 'Social sharing image (1200×630 recommended).' } },
      ],
    },
    {
      type: 'collapsible', label: 'Section Header', admin: { initCollapsed: false },
      fields: [
        { name: 'sectionLabel', type: 'text', defaultValue: 'INFO / 02' },
        { name: 'heading', type: 'text', defaultValue: 'Size Guide.' },
        { name: 'subtext', type: 'text', defaultValue: "Boxy fit. Relaxed shoulders. If you're between sizes, size down. These run generous on purpose." },
      ],
    },
    {
      type: 'collapsible', label: 'Size Tables', admin: { initCollapsed: false },
      fields: [
        {
          name: 'sizeTables', type: 'array', maxRows: 5,
          fields: [
            { name: 'visible', type: 'checkbox', defaultValue: true, label: 'Show on site' },
            { name: 'title', type: 'text', required: true },
            {
              name: 'rows', type: 'array', maxRows: 10,
              fields: [
                { name: 'size', type: 'text', required: true },
                { name: 'chest', type: 'text', required: true },
                { name: 'length', type: 'text', required: true },
                { name: 'sleeve', type: 'text', required: true },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible', label: 'Size Guide Image', admin: { initCollapsed: true },
      fields: [
        { name: 'sizeGuideImage', type: 'upload' as const, relationTo: 'media' as const, admin: { description: 'Measurement diagram or product photo showing how to measure. Displayed alongside the size tables.' } },
        ...imageDisplayFields('sizeGuideImage'),
      ],
    },
    {
      type: 'collapsible', label: 'How to Measure', admin: { initCollapsed: true },
      fields: [
        { name: 'show_howToMeasure', type: 'checkbox', defaultValue: true, label: 'Show on site' },
        { name: 'measureTitle', type: 'text', defaultValue: 'How to measure' },
        { name: 'measureChest', type: 'textarea', defaultValue: 'Measure across the chest, 1 inch below the armhole, from edge to edge. Double it.' },
        { name: 'measureLength', type: 'textarea', defaultValue: 'From the highest point of the shoulder to the bottom hem.' },
        { name: 'measureSleeve', type: 'textarea', defaultValue: 'Tees: from shoulder seam to sleeve hem. Hoodies: from center back neck, across the shoulder, down to the cuff.' },
      ],
    },
    {
      type: 'collapsible', label: 'Fit Note', admin: { initCollapsed: true },
      fields: [
        { name: 'show_fitNote', type: 'checkbox', defaultValue: true, label: 'Show on site' },
        { name: 'fitNoteLabel', type: 'text', defaultValue: 'Fit note' },
        { name: 'fitNoteContent', type: 'textarea', defaultValue: "All garments are pre-shrunk. Cold wash, hang dry, and they'll hold their shape. Hot wash at your own risk — we warned you." },
      ],
    },
  ],
}

// ── Privacy Policy ──
export const PrivacyConfig: GlobalConfig = {
  slug: 'privacyPage',
  label: 'Privacy Policy',
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
    livePreview: { url: generateGlobalPreviewPath('privacyPage') },
    preview: () => generateGlobalPreviewPath('privacyPage'),
  },
  fields: [
    {
      type: 'collapsible', label: 'Page Metadata', admin: { initCollapsed: true },
      fields: [
        { name: 'metaTitle', type: 'text', defaultValue: 'Privacy Policy — UglyLook' },
        { name: 'metaDescription', type: 'text', defaultValue: 'How UglyLook handles your data. Short version: carefully.' },
        { name: 'metaImage', type: 'upload' as const, relationTo: 'media' as const, admin: { description: 'Social sharing image (1200×630 recommended).' } },
      ],
    },
    {
      type: 'collapsible', label: 'Page Header', admin: { initCollapsed: false },
      fields: [
        { name: 'sectionLabel', type: 'text', defaultValue: 'LEGAL / 01' },
        { name: 'heading', type: 'text', defaultValue: 'Privacy.' },
        { name: 'lastUpdated', type: 'text', defaultValue: 'January 2026' },
      ],
    },
    {
      type: 'collapsible', label: 'Sections', admin: { initCollapsed: false },
      fields: [
        {
          name: 'sections', type: 'array', maxRows: 12,
          fields: [
            { name: 'visible', type: 'checkbox', defaultValue: true, label: 'Show on site' },
            { name: 'number', type: 'text', required: true },
            { name: 'title', type: 'text', required: true },
            {
              name: 'listItems', type: 'array', maxRows: 8,
              fields: [
                { name: 'visible', type: 'checkbox', defaultValue: true, label: 'Show on site' },
                { name: 'text', type: 'text', required: true },
              ],
            },
            { name: 'paragraph', type: 'textarea' },
          ],
        },
      ],
    },
  ],
}

// ── Terms of Service ──
export const TermsConfig: GlobalConfig = {
  slug: 'termsPage',
  label: 'Terms of Service',
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
    livePreview: { url: generateGlobalPreviewPath('termsPage') },
    preview: () => generateGlobalPreviewPath('termsPage'),
  },
  fields: [
    {
      type: 'collapsible', label: 'Page Metadata', admin: { initCollapsed: true },
      fields: [
        { name: 'metaTitle', type: 'text', defaultValue: 'Terms of Service — UglyLook' },
        { name: 'metaDescription', type: 'text', defaultValue: 'Terms and conditions for using UglyLook.' },
        { name: 'metaImage', type: 'upload' as const, relationTo: 'media' as const, admin: { description: 'Social sharing image (1200×630 recommended).' } },
      ],
    },
    {
      type: 'collapsible', label: 'Page Header', admin: { initCollapsed: false },
      fields: [
        { name: 'sectionLabel', type: 'text', defaultValue: 'LEGAL / 02' },
        { name: 'heading', type: 'text', defaultValue: 'Terms.' },
        { name: 'lastUpdated', type: 'text', defaultValue: 'January 2026' },
      ],
    },
    {
      type: 'collapsible', label: 'Sections', admin: { initCollapsed: false },
      fields: [
        {
          name: 'sections', type: 'array', maxRows: 12,
          fields: [
            { name: 'visible', type: 'checkbox', defaultValue: true, label: 'Show on site' },
            { name: 'number', type: 'text', required: true },
            { name: 'title', type: 'text', required: true },
            { name: 'content', type: 'textarea', required: true },
          ],
        },
      ],
    },
    {
      type: 'collapsible', label: 'Footer CTA', admin: { initCollapsed: true },
      fields: [
        { name: 'showFooterCta', type: 'checkbox', defaultValue: true, label: 'Show on site' },
        { name: 'footerCtaText', type: 'textarea', defaultValue: 'Questions about these terms? Email hello@uglylook.com. We\'ll respond in plain language.' },
      ],
    },
  ],
}
