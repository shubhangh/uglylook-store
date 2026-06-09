import { CallToAction } from '@/blocks/CallToAction/config'
import { Content } from '@/blocks/Content/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { slugField } from 'payload'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import { approvalFields } from '@/fields/approvalFields'
import { approvalWorkflow } from '@/hooks/approvalWorkflow'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { DefaultDocumentIDType, Where } from 'payload'
import { isAtLeastManager, isTeamMember } from '@/access/utilities'
import { revalidateProduct, revalidateDeleteProduct } from './hooks/revalidateProduct'
import { syncDesignToProduct } from './hooks/syncDesignToProduct'
import { updateDesignUsageAfterChange, updateDesignUsageAfterDelete } from './hooks/updateDesignUsage'

export const ProductsCollection: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  access: {
    ...defaultCollection?.access,
    // Manager: CRU (no delete). Editor: read-only (via adminOrPublishedStatus which includes isTeamMember).
    create: ({ req: { user } }) => isAtLeastManager(user),
    update: ({ req: { user } }) => isAtLeastManager(user),
    // read: kept from default (adminOrPublishedStatus — team sees all, public sees published)
    // delete: kept from default (isAdmin = owner/admin only)
    // Editor read-only: add editor to read access
    read: ({ req: { user } }) => {
      if (isTeamMember(user)) return true
      return { _status: { equals: 'published' } }
    },
  },
  hooks: {
    ...defaultCollection?.hooks,
    beforeChange: [
      ...(defaultCollection?.hooks?.beforeChange || []),
      approvalWorkflow,
      syncDesignToProduct,
    ],
    afterChange: [
      ...(defaultCollection?.hooks?.afterChange || []),
      revalidateProduct,
      updateDesignUsageAfterChange,
    ],
    afterDelete: [
      ...(defaultCollection?.hooks?.afterDelete || []),
      revalidateDeleteProduct,
      updateDesignUsageAfterDelete,
    ],
  },
  admin: {
    ...defaultCollection?.admin,
    defaultColumns: ['title', 'enableVariants', '_status', 'variants.variants'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'products',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'products',
        req,
      }),
    useAsTitle: 'title',
  },
  defaultPopulate: {
    ...defaultCollection?.defaultPopulate,
    title: true,
    slug: true,
    heroImage: true,
    variantOptions: true,
    variants: true,
    enableVariants: true,
    gallery: true,
    priceInUSD: true,
    inventory: true,
    meta: true,
    fulfillmentType: true,
    printifyConfig: true,
    design: true,
    printFile: true,
    catalogImages: true,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      // Hero image acts as the product's thumbnail — the single canonical image
      // shown in shop grids, carousels, cart, checkout, OG tags, and anywhere
      // the product appears as a card. The full gallery is only used on the
      // product detail page (PDP). Admin picks this explicitly so the storefront
      // image is always intentional, not just "whatever is first in the gallery."
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'The primary product image — used as the thumbnail in shop grids, carousels, cart, and social sharing. Pick the single best shot.',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'description',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                  ]
                },
              }),
              label: false,
              required: false,
            },
            {
              name: 'gallery',
              type: 'array',
              minRows: 1,
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
                {
                  name: 'variantOption',
                  type: 'relationship',
                  relationTo: 'variantOptions',
                  admin: {
                    condition: (data) => {
                      return data?.enableVariants === true && data?.variantTypes?.length > 0
                    },
                  },
                  filterOptions: ({ data }) => {
                    if (data?.enableVariants && data?.variantTypes?.length) {
                      const variantTypeIDs = data.variantTypes.map((item: any) => {
                        if (typeof item === 'object' && item?.id) {
                          return item.id
                        }
                        return item
                      }) as DefaultDocumentIDType[]

                      if (variantTypeIDs.length === 0)
                        return {
                          variantType: {
                            in: [],
                          },
                        }

                      const query: Where = {
                        variantType: {
                          in: variantTypeIDs,
                        },
                      }

                      return query
                    }

                    return {
                      variantType: {
                        in: [],
                      },
                    }
                  },
                },
              ],
            },

            {
              name: 'layout',
              type: 'blocks',
              blocks: [CallToAction, Content, MediaBlock],
            },
          ],
          label: 'Content',
        },
        {
          fields: [
            ...defaultCollection.fields,
            {
              name: 'relatedProducts',
              type: 'relationship',
              filterOptions: ({ id }) => {
                if (id) {
                  return {
                    id: {
                      not_in: [id],
                    },
                  }
                }

                // ID comes back as undefined during seeding so we need to handle that case
                return {
                  id: {
                    exists: true,
                  },
                }
              },
              hasMany: true,
              relationTo: 'products',
            },
          ],
          label: 'Product Details',
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'categories',
      type: 'relationship',
      admin: {
        position: 'sidebar',
        sortOptions: 'title',
      },
      hasMany: true,
      relationTo: 'categories',
    },
    {
      name: 'fulfillmentType',
      type: 'select',
      defaultValue: 'pod',
      options: [
        { label: 'Print on Demand (Printify)', value: 'pod' },
        { label: 'Self-Fulfilled', value: 'self' },
      ],
      admin: {
        position: 'sidebar',
        description: 'How this product is produced and shipped. Self-fulfilled items bypass Printify entirely.',
      },
    },
    {
      name: 'buckets',
      type: 'relationship',
      relationTo: 'buckets',
      hasMany: true,
      admin: {
        position: 'sidebar',
        description: 'Admin-only grouping. Not visible to customers.',
      },
    },
    slugField(),
    ...approvalFields,
    // ── Design Link ──
    {
      name: 'design',
      type: 'relationship',
      relationTo: 'designs',
      admin: {
        position: 'sidebar',
        description: 'Linked design from the Design Library. Auto-populates printFile and designUrl.',
      },
    },
    // ── Catalog / Raw Images ──
    // Printify blueprint mockups (blank garment before design is applied).
    // Auto-populated by Product Launcher when mockups are generated.
    // Used by Photo Studio as reference for AI image consistency.
    {
      name: 'catalogImages',
      type: 'array',
      admin: {
        description: 'Raw catalog/mockup images (blank garment from Printify). Auto-populated by launcher.',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'label',
          type: 'text',
          admin: { description: 'e.g. "Front", "Back", "Side"' },
        },
      ],
    },
    // ── Printify Fulfillment ──
    {
      name: 'printFile',
      type: 'upload',
      relationTo: 'media',
      admin: {
        position: 'sidebar',
        description: 'Print-ready design file (PNG, transparent bg). Sent to Printify for printing.',
        condition: (data) => data?.fulfillmentType !== 'self',
      },
    },
    {
      name: 'printifyConfig',
      type: 'json',
      admin: {
        position: 'sidebar',
        description: 'Printify fulfillment config: blueprintId, providerId, designUrl, placement, variantMap. Auto-populated by Product Launcher or set manually.',
        condition: (data) => data?.fulfillmentType !== 'self',
      },
    },
  ],
})
