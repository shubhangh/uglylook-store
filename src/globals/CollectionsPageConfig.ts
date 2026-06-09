import type { GlobalConfig } from 'payload'
import { adminOnly } from '@/access/adminOnly'
import { generateGlobalPreviewPath } from '@/utilities/generateGlobalPreviewPath'
import { revalidateGlobal } from './hooks/revalidateGlobal'

export const CollectionsPageConfig: GlobalConfig = {
  slug: 'collectionsPage',
  label: 'Collections Page',
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
    livePreview: { url: generateGlobalPreviewPath('collectionsPage') },
    preview: () => generateGlobalPreviewPath('collectionsPage'),
  },
  fields: [
    {
      type: 'collapsible',
      label: 'Page Metadata',
      admin: { initCollapsed: true },
      fields: [
        { name: 'metaTitle', type: 'text', defaultValue: 'Collections' },
        {
          name: 'metaDescription',
          type: 'textarea',
          defaultValue: 'Explore UglyLook collections. Seasonal drops, curated edits, and themed groupings.',
        },
        {
          name: 'metaImage',
          type: 'upload',
          relationTo: 'media',
          admin: { description: 'Social sharing image (1200x630 recommended).' },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Page Content',
      admin: { initCollapsed: false },
      fields: [
        { name: 'heading', type: 'text', defaultValue: 'Collections' },
        { name: 'subtext', type: 'textarea', defaultValue: 'Seasonal drops and curated edits.' },
      ],
    },
    {
      type: 'collapsible',
      label: 'Collections',
      admin: { initCollapsed: false },
      fields: [
        {
          name: 'collections',
          type: 'array',
          admin: {
            description: 'Select which categories to display and how each card looks. Leave empty to auto-show all storefront categories.',
          },
          fields: [
            {
              name: 'category',
              type: 'relationship',
              relationTo: 'categories',
              required: true,
              filterOptions: () => ({ showOnStorefront: { equals: true } }),
              admin: { description: 'Pick from storefront-enabled categories.' },
            },
            {
              name: 'displayMode',
              type: 'select',
              defaultValue: 'image',
              options: [
                { label: 'Single Image', value: 'image' },
                { label: 'Product Carousel', value: 'carousel' },
              ],
              admin: { description: 'Image: show a single thumbnail. Carousel: show top products\' hero images.' },
            },
            {
              name: 'thumbnail',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Custom thumbnail for this collection card. Overrides the category\'s cover image.',
                condition: (_, siblingData) => siblingData?.displayMode === 'image',
              },
            },
            {
              name: 'carouselProducts',
              type: 'relationship',
              relationTo: 'products',
              hasMany: true,
              maxRows: 5,
              admin: {
                description: 'Pick up to 5 products for the carousel. Leave empty to auto-use the latest 5 products in this category.',
                condition: (_, siblingData) => siblingData?.displayMode === 'carousel',
              },
            },
          ],
        },
      ],
    },
  ],
}
