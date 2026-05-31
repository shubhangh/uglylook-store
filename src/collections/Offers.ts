import type { CollectionConfig } from 'payload'
import { approvalFields } from '@/fields/approvalFields'
import { approvalWorkflow } from '@/hooks/approvalWorkflow'
import { ecommerceAccess, ecommerceDeleteAccess } from '@/access/utilities'

export const Offers: CollectionConfig = {
  slug: 'offers',
  labels: { singular: 'Offer', plural: 'Offers' },
  admin: {
    group: 'Ecommerce',
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'value', 'active', 'approvalStatus', 'startsAt', 'endsAt'],
  },
  access: {
    read: ecommerceAccess,
    create: ecommerceAccess,
    update: ecommerceAccess,
    delete: ecommerceDeleteAccess,
  },
  hooks: {
    beforeChange: [approvalWorkflow],
  },
  fields: [
    // ── Core ──
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { description: 'Display name (e.g., "Summer Sale").' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'URL-friendly identifier.' },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'Longer description for storefront display.' },
    },

    // ── Discount Type ──
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'percentage',
      options: [
        { label: 'Percentage Off', value: 'percentage' },
        { label: 'Fixed Amount Off', value: 'fixed_amount' },
        { label: 'Buy X Get Y Free', value: 'buy_x_get_y' },
        { label: 'Free Shipping', value: 'free_shipping' },
        { label: 'Bundle Price', value: 'bundle' },
      ],
    },

    // ── Value fields (conditional on type) ──
    {
      name: 'value',
      type: 'number',
      min: 0,
      admin: {
        description: 'Percentage (e.g., 20 = 20%) or amount in cents (e.g., 1000 = $10.00).',
        condition: (data) => data?.type === 'percentage' || data?.type === 'fixed_amount',
      },
      validate: (val: number | null | undefined, { siblingData }: any) => {
        if (siblingData?.type !== 'percentage' && siblingData?.type !== 'fixed_amount') return true
        if (!val || val <= 0) return 'Value must be greater than 0'
        if (siblingData?.type === 'percentage' && val > 100) return 'Percentage cannot exceed 100'
        return true
      },
    },
    {
      type: 'row',
      admin: {
        condition: (data) => data?.type === 'buy_x_get_y',
      },
      fields: [
        {
          name: 'buyQuantity',
          type: 'number',
          min: 1,
          admin: { description: 'Buy X items...' },
        },
        {
          name: 'getQuantity',
          type: 'number',
          min: 1,
          admin: { description: '...get Y free (cheapest free).' },
        },
      ],
    },
    {
      name: 'bundleProducts',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      admin: {
        description: 'Products included in the bundle.',
        condition: (data) => data?.type === 'bundle',
      },
    },
    {
      name: 'bundlePrice',
      type: 'number',
      min: 0,
      admin: {
        description: 'Special bundle price in cents.',
        condition: (data) => data?.type === 'bundle',
      },
    },

    // ── Dates ──
    {
      type: 'row',
      fields: [
        {
          name: 'startsAt',
          type: 'date',
          required: true,
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
        {
          name: 'endsAt',
          type: 'date',
          required: true,
          admin: { date: { pickerAppearance: 'dayAndTime' } },
          validate: (val: any, { siblingData }: any) => {
            if (val && siblingData?.startsAt && new Date(val) <= new Date(siblingData.startsAt)) {
              return 'End date must be after start date'
            }
            return true
          },
        },
      ],
    },

    // ── Applicability ──
    {
      type: 'collapsible',
      label: 'Applicable Products',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'applicableTo',
          type: 'select',
          required: true,
          defaultValue: 'all_products',
          options: [
            { label: 'All Products', value: 'all_products' },
            { label: 'Specific Categories', value: 'specific_categories' },
            { label: 'Specific Products', value: 'specific_products' },
          ],
        },
        {
          name: 'categories',
          type: 'relationship',
          relationTo: 'categories',
          hasMany: true,
          admin: {
            condition: (data) => data?.applicableTo === 'specific_categories',
          },
        },
        {
          name: 'products',
          type: 'relationship',
          relationTo: 'products',
          hasMany: true,
          admin: {
            condition: (data) => data?.applicableTo === 'specific_products',
          },
        },
      ],
    },

    // ── Display ──
    {
      type: 'collapsible',
      label: 'Storefront Display',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'showBanner',
          type: 'checkbox',
          defaultValue: false,
          label: 'Show promotional banner',
        },
        {
          name: 'bannerText',
          type: 'text',
          admin: {
            description: 'Banner text (e.g., "20% off everything — ends Sunday").',
            condition: (data) => data?.showBanner,
          },
        },
        {
          name: 'bannerPosition',
          type: 'select',
          defaultValue: 'all',
          options: [
            { label: 'Header (all pages)', value: 'header' },
            { label: 'Product Pages', value: 'product_page' },
            { label: 'Cart', value: 'cart' },
            { label: 'All Positions', value: 'all' },
          ],
          admin: {
            condition: (data) => data?.showBanner,
          },
        },
        {
          name: 'showBadge',
          type: 'checkbox',
          defaultValue: false,
          label: 'Show discount badge on product cards',
        },
        {
          name: 'badgeText',
          type: 'text',
          admin: {
            description: 'Badge text (e.g., "SALE", "-20%", "2 FOR 1").',
            condition: (data) => data?.showBadge,
          },
        },
      ],
    },

    // ── Behavior ──
    {
      type: 'row',
      fields: [
        {
          name: 'priority',
          type: 'number',
          defaultValue: 0,
          admin: { description: 'Higher priority wins when multiple offers overlap.' },
        },
        {
          name: 'autoApply',
          type: 'checkbox',
          defaultValue: true,
          label: 'Auto-apply at checkout',
          admin: { description: 'If false, offer is display-only (no automatic discount).' },
        },
      ],
    },

    // ── Status ──
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: false,
      label: 'Active (live on site)',
      admin: {
        position: 'sidebar',
        description: 'Must be approved before activation takes effect.',
      },
    },

    // ── Approval ──
    ...approvalFields,
  ],
}
