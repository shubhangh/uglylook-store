import { s3Storage } from '@payloadcms/storage-s3'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { Plugin } from 'payload'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { ecommercePlugin } from '@payloadcms/plugin-ecommerce'

import { stripeAdapter } from '@payloadcms/plugin-ecommerce/payments/stripe'

import type { Field } from 'payload'
import { Page, Product } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

// ── Shared fields for Orders & Transactions ──

const sourceField: Field = {
  name: 'source',
  type: 'select',
  defaultValue: 'storefront',
  options: [
    { label: 'Storefront', value: 'storefront' },
    { label: 'Manual', value: 'manual' },
    { label: 'API', value: 'api' },
  ],
  admin: {
    position: 'sidebar',
    readOnly: true,
    description: 'How this record was created',
  },
}

const isLockedField: Field = {
  name: 'isLocked',
  type: 'checkbox',
  defaultValue: false,
  admin: {
    description: 'Uncheck to unlock core fields for editing (owner/admin only). Re-check after editing to re-lock.',
  },
  access: {
    read: () => true,
    update: ({ req }) => isOwnerOrAdmin(req.user),
  },
}

const notesField: Field = {
  name: 'notes',
  type: 'array',
  admin: {
    description: 'Internal notes — append only. Existing notes cannot be edited or deleted.',
  },
  fields: [
    {
      name: 'text',
      type: 'textarea',
      required: true,
    },
    {
      name: 'addedBy',
      type: 'text',
      admin: { readOnly: true },
    },
    {
      name: 'addedAt',
      type: 'text',
      admin: { readOnly: true },
    },
  ],
}
/**
 * Recursively walks a Payload fields array and adds `access.update` to fields
 * whose names are in `lockedFieldNames`. When the doc is locked, those fields
 * become read-only in both the admin UI and the API.
 */
// Field-level lock: blocked for ALL roles when isLocked=true.
// Owner/admin must uncheck isLocked first to edit.
const lockedFieldAccess = ({ doc }: any) => !doc?.isLocked

function addLockAccess(fields: Field[], lockedFieldNames: Set<string>): Field[] {
  return fields.map((field) => {
    // Handle tabs
    if (field.type === 'tabs' && 'tabs' in field) {
      return {
        ...field,
        tabs: field.tabs.map((tab: any) => ({
          ...tab,
          fields: addLockAccess(tab.fields || [], lockedFieldNames),
        })),
      } as Field
    }

    // Handle rows, collapsibles, groups
    if ('fields' in field && Array.isArray((field as any).fields)) {
      const updated = {
        ...field,
        fields: addLockAccess((field as any).fields, lockedFieldNames),
      } as Field

      // If this group itself is locked (e.g. shippingAddress, billingAddress)
      if ('name' in field && lockedFieldNames.has(field.name)) {
        return {
          ...updated,
          access: {
            ...(field as any).access,
            update: lockedFieldAccess,
          },
        } as Field
      }

      return updated
    }

    // Named field — check if it should be locked
    if ('name' in field && lockedFieldNames.has(field.name)) {
      return {
        ...field,
        access: {
          ...(field as any).access,
          update: lockedFieldAccess,
        },
      } as Field
    }

    return field
  })
}

const LOCKED_ORDER_FIELD_NAMES = new Set([
  'items', 'customer', 'customerEmail', 'shippingAddress', 'transactions', 'accessToken',
])

const LOCKED_TRANSACTION_FIELD_NAMES = new Set([
  'items', 'customer', 'customerEmail', 'billingAddress', 'paymentMethod', 'order', 'cart',
])

import { ProductsCollection } from '@/collections/Products'
import { adminOrPublishedStatus } from '@/access/adminOrPublishedStatus'
import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { customerOnlyFieldAccess } from '@/access/customerOnlyFieldAccess'
import { isAdmin } from '@/access/isAdmin'
import { isDocumentOwner } from '@/access/isDocumentOwner'
import { isOwnerOrAdmin, isAtLeastManager } from '@/access/utilities'
import { pushToPrintify } from '@/hooks/pushToPrintify'
import { lockOrderFields, lockTransactionFields } from '@/hooks/lockOrderFields'
import { stampOrderNotes } from '@/hooks/stampOrderNotes'

const generateTitle: GenerateTitle<Product | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | UglyLook` : 'UglyLook'
}

const generateURL: GenerateURL<Product | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

export const plugins: Plugin[] = [
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  ecommercePlugin({
    access: {
      adminOnlyFieldAccess,
      adminOrPublishedStatus,
      customerOnlyFieldAccess,
      isAdmin,
      isDocumentOwner,
    },
    customers: {
      slug: 'customers',
    },
    orders: {
      ordersCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        hooks: {
          ...defaultCollection.hooks,
          beforeChange: [
            ...(defaultCollection.hooks?.beforeChange || []),
            lockOrderFields,
            stampOrderNotes,
          ],
          afterChange: [
            ...(defaultCollection.hooks?.afterChange || []),
            pushToPrintify,
          ],
        },
        access: {
          ...defaultCollection.access,
          // Manager: read-only (added to default read which has owner/admin + customer-own).
          read: ({ req }) => {
            if (isAtLeastManager(req.user)) return true
            if (req.user?.id) return { customer: { equals: req.user.id } }
            return false
          },
        },
        fields: [
          isLockedField,
          ...addLockAccess(defaultCollection.fields, LOCKED_ORDER_FIELD_NAMES),
          // ── Order lock & source ──
          sourceField,
          notesField,
          {
            name: 'accessToken',
            type: 'text',
            unique: true,
            index: true,
            admin: {
              position: 'sidebar',
              readOnly: true,
            },
            hooks: {
              beforeValidate: [
                ({ value, operation }) => {
                  if (operation === 'create' || !value) {
                    return crypto.randomUUID()
                  }
                  return value
                },
              ],
            },
          },
          // ── Stripe Fields ──
          {
            name: 'stripeSessionId',
            type: 'text',
            index: true,
            admin: {
              position: 'sidebar',
              readOnly: true,
              description: 'Stripe Checkout Session ID',
            },
          },
          {
            name: 'stripePaymentIntentId',
            type: 'text',
            admin: {
              position: 'sidebar',
              readOnly: true,
              description: 'Stripe Payment Intent ID',
            },
          },
          // ── Fulfillment Source ──
          {
            name: 'fulfillmentSource',
            type: 'select',
            defaultValue: 'pod',
            options: [
              { label: 'Print on Demand', value: 'pod' },
              { label: 'Self-Fulfilled', value: 'self' },
              { label: 'Mixed', value: 'mixed' },
            ],
            admin: {
              position: 'sidebar',
              readOnly: true,
              description: 'Auto-set from product fulfillmentType. POD = Printify, Self = manual fulfillment.',
            },
          },
          // ── Self-Fulfillment Fields ──
          {
            name: 'selfFulfillment',
            type: 'group',
            admin: {
              condition: (data) => data?.fulfillmentSource === 'self' || data?.fulfillmentSource === 'mixed',
              description: 'Manual fulfillment tracking — for self-fulfilled orders.',
            },
            fields: [
              {
                name: 'packedAt',
                type: 'date',
                admin: { description: 'When the order was packed and ready to ship.' },
              },
              {
                name: 'packedBy',
                type: 'relationship',
                relationTo: 'team',
              },
              {
                name: 'shippedAt',
                type: 'date',
              },
              {
                name: 'shippedBy',
                type: 'relationship',
                relationTo: 'team',
              },
              {
                name: 'deliveredAt',
                type: 'date',
              },
              {
                name: 'carrier',
                type: 'select',
                options: [
                  { label: 'USPS', value: 'usps' },
                  { label: 'UPS', value: 'ups' },
                  { label: 'FedEx', value: 'fedex' },
                  { label: 'DHL', value: 'dhl' },
                  { label: 'Other', value: 'other' },
                ],
              },
              {
                name: 'notes',
                type: 'textarea',
                admin: { description: 'Internal notes (packaging, special handling, etc.)' },
              },
            ],
          },
          // ── Printify Fulfillment Fields ──
          {
            name: 'printifyOrderId',
            type: 'text',
            index: true,
            admin: {
              position: 'sidebar',
              readOnly: true,
              description: 'Printify order ID (auto-populated)',
            },
          },
          {
            name: 'fulfillmentStatus',
            type: 'select',
            defaultValue: 'pending',
            options: [
              { label: 'Pending', value: 'pending' },
              { label: 'Sent to Printify', value: 'sent_to_printify' },
              { label: 'In Production', value: 'in_production' },
              { label: 'Shipped', value: 'shipped' },
              { label: 'Delivered', value: 'delivered' },
              { label: 'Cancelled', value: 'cancelled' },
              { label: 'On Hold', value: 'on_hold' },
              { label: 'Failed', value: 'failed' },
              { label: 'Manual', value: 'manual' },
            ],
            admin: {
              position: 'sidebar',
              description: 'Printify fulfillment status',
            },
          },
          {
            name: 'trackingNumber',
            type: 'text',
            admin: {
              position: 'sidebar',
              readOnly: true,
              description: 'Shipping tracking number',
            },
          },
          {
            name: 'trackingCarrier',
            type: 'text',
            admin: {
              position: 'sidebar',
              readOnly: true,
              description: 'Shipping carrier (USPS, UPS, FedEx, etc.)',
            },
          },
          {
            name: 'trackingUrl',
            type: 'text',
            admin: {
              position: 'sidebar',
              readOnly: true,
              description: 'Tracking URL',
            },
          },
          {
            name: 'fulfillmentNote',
            type: 'textarea',
            admin: {
              position: 'sidebar',
              readOnly: true,
              description: 'Last fulfillment update note',
            },
          },
          {
            name: 'fulfillmentHistory',
            type: 'array',
            admin: {
              readOnly: true,
              description: 'Auto-logged fulfillment timeline. Cannot be edited.',
              initCollapsed: true,
            },
            access: {
              update: () => false,
            },
            fields: [
              {
                name: 'status',
                type: 'text',
              },
              {
                name: 'message',
                type: 'text',
              },
              {
                name: 'source',
                type: 'text',
                admin: { description: 'webhook, push, retry, sync, manual' },
              },
              {
                name: 'trackingNumber',
                type: 'text',
              },
              {
                name: 'trackingCarrier',
                type: 'text',
              },
              {
                name: 'trackingUrl',
                type: 'text',
              },
              {
                name: 'timestamp',
                type: 'text',
              },
            ],
          },
        ],
      }),
    },
    carts: {
      cartsCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        access: {
          ...defaultCollection.access,
          // Manager: read-only. Keep customer/guest access for create/update/delete.
          read: ({ req }) => {
            if (isAtLeastManager(req.user)) return true
            // Fall through to default customer/guest logic
            if (isOwnerOrAdmin(req.user)) return true
            if (req.user?.id) return { customer: { equals: req.user.id } }
            return false
          },
        },
      }),
    },
    payments: {
      paymentMethods: [
        stripeAdapter({
          secretKey: process.env.STRIPE_SECRET_KEY!,
          publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
          webhookSecret: process.env.STRIPE_WEBHOOKS_SIGNING_SECRET!,
        }),
      ],
    },
    products: {
      productsCollectionOverride: ProductsCollection,
      variants: {
        variantsCollectionOverride: ({ defaultCollection }) => ({
          ...defaultCollection,
          access: {
            ...defaultCollection.access,
            create: ({ req: { user } }) => isAtLeastManager(user),
            update: ({ req: { user } }) => isAtLeastManager(user),
          },
          fields: [
            ...defaultCollection.fields,
            {
              name: 'printifyVariantId',
              type: 'number',
              admin: {
                position: 'sidebar',
                description: 'Printify variant ID (overrides product-level default)',
              },
            },
          ],
        }),
        variantTypesCollectionOverride: ({ defaultCollection }) => ({
          ...defaultCollection,
          access: {
            ...defaultCollection.access,
            create: ({ req: { user } }) => isAtLeastManager(user),
            update: ({ req: { user } }) => isAtLeastManager(user),
          },
        }),
        variantOptionsCollectionOverride: ({ defaultCollection }) => ({
          ...defaultCollection,
          access: {
            ...defaultCollection.access,
            create: ({ req: { user } }) => isAtLeastManager(user),
            update: ({ req: { user } }) => isAtLeastManager(user),
          },
        }),
      },
    },
    transactions: {
      transactionsCollectionOverride: ({ defaultCollection }) => ({
        ...defaultCollection,
        hooks: {
          ...defaultCollection.hooks,
          beforeChange: [
            ...(defaultCollection.hooks?.beforeChange || []),
            lockTransactionFields,
            stampOrderNotes,
          ],
        },
        access: {
          ...defaultCollection.access,
          // Manager: read-only. Default has isAdmin for all ops.
          read: ({ req }) => {
            if (isAtLeastManager(req.user)) return true
            return isOwnerOrAdmin(req.user)
          },
        },
        fields: [
          isLockedField,
          ...addLockAccess(defaultCollection.fields, LOCKED_TRANSACTION_FIELD_NAMES),
          sourceField,
          notesField,
        ],
      }),
    },
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formSubmissionOverrides: {
      access: {
        delete: isAdmin,
        read: isAdmin,
        update: isAdmin,
      },
      admin: {
        group: 'Content',
      },
    },
    formOverrides: {
      access: {
        delete: isAdmin,
        read: isAdmin,
        update: isAdmin,
        create: isAdmin,
      },
      admin: {
        group: 'Content',
      },
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
  }),
  mcpPlugin({}),
  ...(process.env.R2_BUCKET
    ? [
        s3Storage({
          collections: {
            media: {
              disablePayloadAccessControl: true,
              generateFileURL: ({ filename, prefix }) => {
                const key = prefix ? `${prefix}/${filename}` : filename
                return `${process.env.R2_PUBLIC_URL}/${key}`
              },
            },
          },
          bucket: process.env.R2_BUCKET,
          config: {
            credentials: {
              accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
              secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
            },
            region: 'auto',
            endpoint: process.env.R2_ENDPOINT,
            forcePathStyle: true,
          },
        }),
      ]
    : []),
]
