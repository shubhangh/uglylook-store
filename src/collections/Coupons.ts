import type { CollectionConfig } from 'payload'
import { approvalFields } from '@/fields/approvalFields'
import { approvalWorkflow } from '@/hooks/approvalWorkflow'
import { ecommerceAccess, ecommerceDeleteAccess, isOwnerOrAdmin } from '@/access/utilities'

export const Coupons: CollectionConfig = {
  slug: 'coupons',
  labels: { singular: 'Coupon', plural: 'Coupons' },
  admin: {
    group: 'Ecommerce',
    useAsTitle: 'title',
    defaultColumns: ['title', 'code', 'type', 'value', 'active', 'approvalStatus', 'expiresAt'],
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
      admin: { description: 'Internal name (e.g., "Summer 20% Off Code")' },
    },
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Customer-facing code (e.g., "UGLY20"). Auto-uppercased.' },
      hooks: {
        beforeValidate: [
          ({ value }) => {
            if (typeof value === 'string') {
              return value.toUpperCase().replace(/[^A-Z0-9-]/g, '')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'Internal notes about this coupon.' },
    },

    // ── Discount ──
    {
      type: 'row',
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          defaultValue: 'percentage',
          options: [
            { label: 'Percentage Off', value: 'percentage' },
            { label: 'Fixed Amount Off', value: 'fixed_amount' },
            { label: 'Free Shipping', value: 'free_shipping' },
          ],
        },
        {
          name: 'value',
          type: 'number',
          required: true,
          min: 0,
          admin: {
            description: 'Percentage (e.g., 20 = 20%) or amount in cents (e.g., 1000 = $10.00).',
          },
          validate: (val: number | null | undefined, { siblingData }: any) => {
            if (siblingData?.type === 'free_shipping') return true
            if (!val || val <= 0) return 'Value must be greater than 0'
            if (siblingData?.type === 'percentage' && val > 100) return 'Percentage cannot exceed 100'
            return true
          },
        },
      ],
    },

    // ── Limits ──
    {
      type: 'collapsible',
      label: 'Limits & Conditions',
      admin: { initCollapsed: true },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'minOrderAmount',
              type: 'number',
              defaultValue: 0,
              min: 0,
              admin: { description: 'Minimum cart total in cents (0 = no minimum).' },
            },
            {
              name: 'maxDiscountAmount',
              type: 'number',
              defaultValue: 0,
              min: 0,
              admin: { description: 'Max discount in cents for percentage type (0 = no cap).' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'maxUses',
              type: 'number',
              defaultValue: 0,
              min: 0,
              admin: { description: 'Total uses allowed (0 = unlimited).' },
            },
            {
              name: 'maxUsesPerCustomer',
              type: 'number',
              defaultValue: 0,
              min: 0,
              admin: { description: 'Per-customer limit (0 = unlimited).' },
            },
          ],
        },
        {
          name: 'usedCount',
          type: 'number',
          defaultValue: 0,
          admin: { readOnly: true, description: 'Auto-incremented when coupon is applied at checkout.' },
        },
        {
          name: 'stackable',
          type: 'checkbox',
          defaultValue: false,
          label: 'Can be combined with other coupons',
        },
        {
          name: 'firstOrderOnly',
          type: 'checkbox',
          defaultValue: false,
          label: 'First order only',
        },
      ],
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
          name: 'expiresAt',
          type: 'date',
          required: true,
          admin: { date: { pickerAppearance: 'dayAndTime' } },
          validate: (val: any, { siblingData }: any) => {
            if (val && siblingData?.startsAt && new Date(val) <= new Date(siblingData.startsAt)) {
              return 'Expiry must be after start date'
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
        {
          name: 'excludeCategories',
          type: 'relationship',
          relationTo: 'categories',
          hasMany: true,
          admin: { description: 'Categories excluded even from "all products".' },
        },
        {
          name: 'excludeProducts',
          type: 'relationship',
          relationTo: 'products',
          hasMany: true,
          admin: { description: 'Products excluded even from applicable categories.' },
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
