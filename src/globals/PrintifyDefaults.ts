import type { GlobalConfig } from 'payload'
import { isAdmin } from '@/access/isAdmin'

export const PrintifyDefaults: GlobalConfig = {
  slug: 'printify-defaults',
  label: 'Printify Defaults',
  admin: {
    group: 'Printify',
    description: 'Default Printify configuration per product category. Used by the Product Launcher for auto-populating blueprint, provider, sizes, colors, and placement.',
  },
  access: {
    read: isAdmin,
    update: isAdmin,
  },
  fields: [
    {
      name: 'marginTarget',
      type: 'number',
      label: 'Margin Target (%)',
      defaultValue: 45,
      min: 0,
      max: 90,
      admin: {
        description: 'Minimum acceptable margin percentage. Products below this will be flagged in SKU Analysis.',
      },
    },
    {
      name: 'defaultSizes',
      type: 'json',
      label: 'Default Sizes',
      defaultValue: ['S', 'M', 'L', 'XL', '2XL'],
      admin: {
        description: 'Default sizes to enable when launching new products. JSON array of size strings.',
      },
    },
    {
      name: 'brandColors',
      type: 'json',
      label: 'Brand Colors',
      defaultValue: ['Black', 'Bone'],
      admin: {
        description: 'Default garment colors to auto-select when launching. JSON array of color names.',
      },
    },
    {
      name: 'editorialShotCount',
      type: 'number',
      label: 'Editorial Shots per Product',
      defaultValue: 3,
      min: 1,
      max: 10,
      admin: {
        description: 'Number of AI-generated editorial images per product.',
      },
    },
    {
      name: 'categoryDefaults',
      type: 'array',
      label: 'Category Defaults',
      admin: {
        description: 'Default Printify blueprint and provider per product category.',
      },
      fields: [
        {
          name: 'category',
          type: 'select',
          required: true,
          options: [
            { label: 'Hoodies', value: 'hoodies' },
            { label: 'Tees', value: 'tees' },
            { label: 'Hats', value: 'hats' },
            { label: 'Totes', value: 'totes' },
            { label: 'Sweatshirts', value: 'sweatshirts' },
          ],
        },
        {
          name: 'blueprintId',
          type: 'number',
          label: 'Blueprint ID',
          admin: {
            description: 'Printify blueprint ID (from Catalog Browser)',
          },
        },
        {
          name: 'providerId',
          type: 'number',
          label: 'Provider ID',
          admin: {
            description: 'Printify print provider ID',
          },
        },
        {
          name: 'defaultPrice',
          type: 'number',
          label: 'Default Retail Price (USD)',
          admin: {
            description: 'Default retail price for this category',
          },
        },
        {
          name: 'designKey',
          type: 'select',
          label: 'Default Design',
          options: [
            { label: 'Horizontal Logo (Light — for dark garments)', value: 'logo-horiz-light' },
            { label: 'Horizontal Logo (Dark — for light garments)', value: 'logo-horiz-dark' },
            { label: 'Icon (Light)', value: 'logo-icon-light' },
            { label: 'Icon (Dark)', value: 'logo-icon-dark' },
            { label: 'Wordmark (Light)', value: 'logo-word-light' },
            { label: 'Wordmark (Dark)', value: 'logo-word-dark' },
          ],
          admin: {
            description: 'Default design to use for this category (can be overridden per product)',
          },
        },
        {
          name: 'placement',
          type: 'group',
          label: 'Default Placement',
          fields: [
            {
              name: 'position',
              type: 'select',
              defaultValue: 'front',
              options: [
                { label: 'Front', value: 'front' },
                { label: 'Back', value: 'back' },
              ],
            },
            {
              name: 'x',
              type: 'number',
              defaultValue: 0.5,
              min: 0,
              max: 1,
              admin: { step: 0.05, description: '0 = left, 0.5 = center, 1 = right' },
            },
            {
              name: 'y',
              type: 'number',
              defaultValue: 0.45,
              min: 0,
              max: 1,
              admin: { step: 0.05, description: '0 = top, 0.5 = center, 1 = bottom' },
            },
            {
              name: 'scale',
              type: 'number',
              defaultValue: 0.8,
              min: 0.1,
              max: 1,
              admin: { step: 0.05, description: '0.1 = tiny, 0.5 = half, 1.0 = fill print area' },
            },
          ],
        },
      ],
    },
    {
      name: 'scoringWeights',
      type: 'group',
      label: 'Scoring Weights',
      admin: {
        description: 'Weights for the SKU scoring algorithm in the Catalog Browser. Must sum to 100.',
        condition: () => true,
      },
      fields: [
        { name: 'margin', type: 'number', defaultValue: 30, label: 'Margin', admin: { width: '25%' } },
        { name: 'blankQuality', type: 'number', defaultValue: 20, label: 'Blank Quality', admin: { width: '25%' } },
        { name: 'colorAvailability', type: 'number', defaultValue: 15, label: 'Color Availability', admin: { width: '25%' } },
        { name: 'sizeRange', type: 'number', defaultValue: 10, label: 'Size Range', admin: { width: '25%' } },
        { name: 'printArea', type: 'number', defaultValue: 10, label: 'Print Area', admin: { width: '25%' } },
        { name: 'providerLocation', type: 'number', defaultValue: 5, label: 'Provider Location', admin: { width: '25%' } },
        { name: 'shippingCost', type: 'number', defaultValue: 5, label: 'Shipping Cost', admin: { width: '25%' } },
        { name: 'printMethod', type: 'number', defaultValue: 5, label: 'Print Method', admin: { width: '25%' } },
      ],
    },
  ],
}
