import type { GlobalConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'
import { generateGlobalPreviewPath } from '@/utilities/generateGlobalPreviewPath'
import { revalidateGlobal } from './hooks/revalidateGlobal'
import { imageDisplayFields } from '@/fields/imageDisplay'

export const HomepageConfig: GlobalConfig = {
  slug: 'homepage',
  label: 'Homepage',
  access: {
    read: () => true,
    update: adminOnly,
  },
  versions: {
    drafts: { autosave: true },
    max: 25,
  },
  hooks: {
    afterChange: [revalidateGlobal],
  },
  admin: {
    group: 'Globals',
    livePreview: {
      url: generateGlobalPreviewPath('homepage'),
    },
    preview: () => generateGlobalPreviewPath('homepage'),
  },
  fields: [
    // ── Metadata ──
    {
      type: 'collapsible',
      label: 'Page Metadata',
      admin: { initCollapsed: true },
      fields: [
        { name: 'metaTitle', type: 'text', defaultValue: 'UglyLook — Ugly is the new sick.' },
        { name: 'metaDescription', type: 'textarea', defaultValue: 'Tees, hoodies and objects too loud for the For You page. 240gsm cotton, boxy fit, dry copy, printed when you order.' },
        { name: 'metaImage', type: 'upload', relationTo: 'media', admin: { description: 'Social sharing image (1200×630 recommended).' } },
      ],
    },

    // ── Frame Marks ──
    {
      type: 'collapsible',
      label: 'Frame Marks',
      admin: { initCollapsed: true },
      fields: [
        { name: 'showFrameMarks', type: 'checkbox', defaultValue: true, label: 'Show frame marks on site' },
      ],
    },

    // ── Hero Section ──
    {
      type: 'collapsible',
      label: 'Hero Section',
      admin: { initCollapsed: false },
      fields: [
        { name: 'showHero', type: 'checkbox', defaultValue: true, label: 'Show hero section on site' },
        { name: 'heroImage', type: 'upload', relationTo: 'media', admin: { description: 'Campaign hero image — model/editorial photo displayed alongside headline.' } },
        ...imageDisplayFields('heroImage'),
        { name: 'heroStamp', type: 'text', defaultValue: 'SS27 \u00B7 QUIET BUILD' },
        { name: 'heroClock', type: 'text', defaultValue: '23:14 UTC' },
        { name: 'heroFileLabel', type: 'text', defaultValue: 'FILE / 01 \u2014 LANDING' },
        { name: 'heroLine1', type: 'text', defaultValue: 'Good is over.', label: 'Headline line 1' },
        { name: 'heroLine2', type: 'text', defaultValue: 'Ugly is the new', label: 'Headline line 2' },
        { name: 'heroLine3', type: 'text', defaultValue: 'sick.', label: 'Headline line 3' },
        { name: 'heroSubtitle', type: 'textarea', defaultValue: "Tees, hoodies and objects too loud for the For You page. 240gsm cotton, boxy fit, dry copy, printed when you order. None of it is for the people who'll call it ugly. All of it is for the people who'll call it ugly and mean it." },
        { name: 'heroCta1Text', type: 'text', defaultValue: 'See the catalog', label: 'CTA button 1 text' },
        { name: 'heroCta1Url', type: 'text', defaultValue: '/shop', label: 'CTA button 1 URL' },
        { name: 'heroCta2Text', type: 'text', defaultValue: 'Read the thesis', label: 'CTA button 2 text' },
        { name: 'heroCta2Url', type: 'text', defaultValue: '#manifesto', label: 'CTA button 2 URL' },
        { name: 'heroNote', type: 'text', defaultValue: 'no email required · no popup · ever.' },
        {
          type: 'collapsible',
          label: 'Tag Card',
          admin: { initCollapsed: true },
          fields: [
            { name: 'showTagCard', type: 'checkbox', defaultValue: true, label: 'Show tag card on site' },
            {
              name: 'heroTagRows',
              type: 'array',
              maxRows: 8,
              fields: [
                { name: 'visible', type: 'checkbox', defaultValue: true, label: 'Show on site' },
                { name: 'label', type: 'text', required: true },
                { name: 'value', type: 'text', required: true },
                { name: 'highlight', type: 'checkbox', defaultValue: false, label: 'Highlight (olive)' },
              ],
            },
          ],
        },
      ],
    },

    // ── Marquee ──
    {
      type: 'collapsible',
      label: 'Marquee Tape',
      admin: { initCollapsed: true },
      fields: [
        { name: 'showMarquee', type: 'checkbox', defaultValue: true, label: 'Show marquee on site' },
        {
          name: 'marqueeWords',
          type: 'array',
          fields: [
            { name: 'word', type: 'text', required: true },
            { name: 'highlight', type: 'checkbox', defaultValue: false, label: 'Highlight this word' },
          ],
        },
        { name: 'marqueeSeparator', type: 'text', defaultValue: '✕' },
      ],
    },

    // ── Pull Quote ──
    {
      type: 'collapsible',
      label: 'Pull Quote',
      admin: { initCollapsed: true },
      fields: [
        { name: 'showPullQuote', type: 'checkbox', defaultValue: true, label: 'Show pull quote on site' },
        { name: 'pullQuoteMetaLeft', type: 'text', defaultValue: 'FN.01' },
        { name: 'pullQuoteText', type: 'text', defaultValue: 'Coolness is always the inversion of an insult.' },
        { name: 'pullQuoteEmWord', type: 'text', defaultValue: 'inversion', label: 'Emphasized word (italic)' },
        { name: 'pullQuoteMetaRight', type: 'text', defaultValue: 'UL · SS27' },
      ],
    },

    // ── Featured Products ──
    {
      type: 'collapsible',
      label: 'Featured Products',
      admin: { initCollapsed: true },
      fields: [
        { name: 'showFeaturedProducts', type: 'checkbox', defaultValue: true, label: 'Show featured products section on site' },
        { name: 'featuredHeading', type: 'text', defaultValue: 'Featured' },
        { name: 'featuredCtaText', type: 'text', defaultValue: 'Shop all', label: 'CTA text' },
        { name: 'featuredCtaUrl', type: 'text', defaultValue: '/shop', label: 'CTA URL' },
        {
          name: 'featuredProducts',
          type: 'relationship',
          relationTo: 'products',
          hasMany: true,
          maxRows: 6,
          admin: { description: 'Select up to 6 products to feature. Leave empty to auto-select newest.' },
        },
      ],
    },

    // ── Hero Carousel Settings ──
    {
      type: 'collapsible',
      label: 'Hero Carousel Settings',
      admin: { initCollapsed: true },
      fields: [
        { name: 'heroCarouselSpeed', type: 'number', defaultValue: 3, label: 'Auto-slide interval (seconds)', admin: { description: 'How many seconds between slides. Set 0 to disable auto-slide.' } },
        { name: 'heroStampText', type: 'text', defaultValue: 'UGLY ON PURPOSE', label: 'Stamp badge text (on carousel)' },
        { name: 'heroCarouselTilt', type: 'number', defaultValue: -2, label: 'Carousel tilt (degrees)', admin: { description: 'Rotation angle. Negative = tilt left, positive = tilt right. 0 = no tilt.' } },
      ],
    },

    // ── Brand Statement ──
    {
      type: 'collapsible',
      label: 'Brand Statement',
      admin: { initCollapsed: true },
      fields: [
        { name: 'showBrandStatement', type: 'checkbox', defaultValue: true, label: 'Show brand statement section on site' },
        { name: 'brandLede', type: 'textarea', defaultValue: 'Every generation invents new slang for "good." Every word started its life meaning bad. We\'re just the first ones putting it on the chest.' },
        { name: 'brandEmWord', type: 'text', defaultValue: 'bad', label: 'Emphasized word (olive color)' },
        {
          name: 'brandSpecs',
          type: 'array',
          label: 'Spec pills',
          maxRows: 6,
          fields: [
            { name: 'text', type: 'text', required: true },
          ],
          defaultValue: [
            { text: '240gsm cotton' },
            { text: 'Boxy fit' },
            { text: 'Printed when you order' },
          ],
        },
        { name: 'brandWatermark', type: 'text', defaultValue: 'UGLY', label: 'Background watermark text' },
        { name: 'brandStamp1', type: 'text', defaultValue: 'NOT FOR EVERYONE', label: 'Stamp badge 1' },
        { name: 'brandStamp2', type: 'text', defaultValue: 'FILTER: AGGRESSIVE', label: 'Stamp badge 2' },
      ],
    },

    // ── Image Carousel ──
    {
      type: 'collapsible',
      label: 'Image Carousel (pre-footer)',
      admin: { initCollapsed: true },
      fields: [
        { name: 'showImageCarousel', type: 'checkbox', defaultValue: true, label: 'Show image carousel above newsletter' },
        { name: 'carouselLabelLeft', type: 'text', defaultValue: 'THE CATALOG', label: 'Left label text' },
        { name: 'carouselLabelRight', type: 'text', defaultValue: 'SS27', label: 'Right label text' },
        { name: 'carouselSpeed', type: 'number', defaultValue: 40, label: 'Scroll speed (seconds for full loop)', admin: { description: 'Higher = slower. 40 is default. Set 0 to pause.' } },
        { name: 'carouselSlideWidth', type: 'number', defaultValue: 280, label: 'Slide width (px)' },
        { name: 'carouselSlideHeight', type: 'number', defaultValue: 350, label: 'Slide height (px)' },
      ],
    },

    // ── Manifesto Section ──
    {
      type: 'collapsible',
      label: 'Manifesto Section',
      admin: { initCollapsed: true },
      fields: [
        { name: 'showManifesto', type: 'checkbox', defaultValue: true, label: 'Show manifesto on site' },
        { name: 'manifestoNumber', type: 'text', defaultValue: 'SEC / 03' },
        { name: 'manifestoTitle', type: 'text', defaultValue: 'The thesis. In writing.' },
        { name: 'manifestoLede', type: 'textarea', defaultValue: 'Every generation inverts new slang for "good," and every word started its life meaning bad. We\'re just the first ones putting it on the chest.' },
        {
          name: 'manifestoColumns',
          type: 'array',
          maxRows: 4,
          fields: [
            { name: 'visible', type: 'checkbox', defaultValue: true, label: 'Show on site' },
            { name: 'heading', type: 'text', required: true },
            { name: 'paragraph1', type: 'textarea', required: true },
            { name: 'paragraph2', type: 'textarea' },
          ],
        },
        {
          type: 'collapsible',
          label: 'Rules Block',
          admin: { initCollapsed: true },
          fields: [
            { name: 'showRules', type: 'checkbox', defaultValue: true, label: 'Show rules block on site' },
            { name: 'rulesTerm', type: 'text', defaultValue: "What we don't do" },
            { name: 'rulesDefinition', type: 'textarea', defaultValue: '"Curated." Founder selfies. Points programs. Referral wheels. 10%-off-for-your-email popups. Mountain hero shots. Coffee-cup lifestyle. Black Friday in the standard way. Performing Gen Z in the copy. Soft pastel anything. Recoloring the logo. Explaining the joke.' },
          ],
        },
      ],
    },

    // ── Spec Section ──
    {
      type: 'collapsible',
      label: 'Spec Section',
      admin: { initCollapsed: true },
      fields: [
        { name: 'showSpec', type: 'checkbox', defaultValue: true, label: 'Show spec section on site' },
        { name: 'specNumber', type: 'text', defaultValue: 'SEC / 05' },
        { name: 'specHeading', type: 'text', defaultValue: 'The joke has weight. Literally.' },
        { name: 'specSubtext', type: 'textarea', defaultValue: 'The line is dry on purpose. The garment is heavy on purpose. If the irony floats, the brand floats with it. So we anchor every product in one concrete number.' },
        {
          name: 'specRows',
          type: 'array',
          maxRows: 12,
          fields: [
            { name: 'visible', type: 'checkbox', defaultValue: true, label: 'Show on site' },
            { name: 'label', type: 'text', required: true },
            { name: 'value', type: 'text', required: true },
          ],
        },
      ],
    },

    // ── Drop Section ──
    {
      type: 'collapsible',
      label: 'Drop Section',
      admin: { initCollapsed: true },
      fields: [
        { name: 'showDrop', type: 'checkbox', defaultValue: true, label: 'Show drop section on site' },
        { name: 'dropLabel', type: 'textarea', defaultValue: "SEC / 06 · Next drop · we're not counting because urgency is for amateurs but here's the number anyway." },
        { name: 'dropHeading', type: 'text', defaultValue: 'SS27 / 01 — opens when it opens.' },
        { name: 'dropTargetDate', type: 'date', defaultValue: '2027-01-14T14:00:00.000Z', admin: { date: { pickerAppearance: 'dayAndTime' } } },
      ],
    },
  ],
}
