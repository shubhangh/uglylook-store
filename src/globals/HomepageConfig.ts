import type { GlobalConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'
import { generateGlobalPreviewPath } from '@/utilities/generateGlobalPreviewPath'
import { revalidateGlobal } from './hooks/revalidateGlobal'

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
