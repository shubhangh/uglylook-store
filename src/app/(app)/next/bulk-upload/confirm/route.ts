import { createLocalReq, getPayload } from 'payload'
import type { CollectionSlug } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { checkRole } from '@/access/utilities'
import { richText } from '@/endpoints/bulk-upload'
import type { VariantOption } from '@/payload-types'

export const maxDuration = 300

type ConfirmProduct = {
  number: string
  title: string
  slug: string
  description: string
  category: string
  finalPrice: number
  hasSizeVariants: boolean
  metaTitle: string
  metaDescription: string
  included: boolean
  mediaIds: string[]
  action: 'create' | 'update'
  existingProductId?: string | null
}

type ConfirmRequest = {
  products: ConfirmProduct[]
  replaceExisting: boolean
}

const SIZE_OPTIONS = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
  { label: 'X Large', value: 'xlarge' },
]

export async function POST(request: Request): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user || !checkRole(['admin'], user)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = (await request.json()) as ConfirmRequest
    const { products: productMeta, replaceExisting } = body

    const productsToProcess = productMeta.filter((p) => p.included)

    if (productsToProcess.length === 0) {
      return Response.json({ error: 'No products selected' }, { status: 400 })
    }

    const toCreate = productsToProcess.filter((p) => p.action === 'create')
    const toUpdate = productsToProcess.filter((p) => p.action === 'update' && p.existingProductId)

    payload.logger.info(
      `[bulk-upload] Processing ${productsToProcess.length} products: ${toCreate.length} create, ${toUpdate.length} update. Replace mode: ${replaceExisting}`,
    )

    const payloadReq = await createLocalReq({ user }, payload)

    // If replace mode, clear existing product data
    if (replaceExisting) {
      payload.logger.info('[bulk-upload] Replace mode — clearing existing products...')
      const collectionsToClean: CollectionSlug[] = [
        'products',
        'variants',
        'variantOptions',
        'variantTypes',
      ]
      for (const collection of collectionsToClean) {
        await payload.db.deleteMany({ collection, req: payloadReq, where: {} })
        if (payload.collections[collection]?.config?.versions) {
          await payload.db.deleteVersions({ collection, req: payloadReq, where: {} })
        }
      }
      payload.logger.info('[bulk-upload] Existing products cleared.')
    }

    // Create/find categories
    payload.logger.info('[bulk-upload] Setting up categories...')
    const categoryMap: Record<string, string> = {}

    const uniqueCategories = [...new Set(productsToProcess.map((p) => p.category))]
    for (const catTitle of uniqueCategories) {
      const existing = await payload.find({
        collection: 'categories',
        where: { title: { equals: catTitle } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        categoryMap[catTitle] = existing.docs[0].id
      } else {
        const created = await payload.create({
          collection: 'categories',
          data: {
            title: catTitle,
            slug: catTitle.toLowerCase().replace(/\s+/g, '-'),
          },
        })
        categoryMap[catTitle] = created.id
      }
    }

    // Create size variant type + options if needed
    let sizeVariantTypeId: string | null = null
    let sizeVariantOptions: VariantOption[] = []

    const needsVariants = productsToProcess.some((p) => p.hasSizeVariants)
    if (needsVariants) {
      const existingType = await payload.find({
        collection: 'variantTypes',
        where: { name: { equals: 'size' } },
        limit: 1,
      })

      if (existingType.docs.length > 0) {
        sizeVariantTypeId = existingType.docs[0].id
        const existingOptions = await payload.find({
          collection: 'variantOptions',
          where: { variantType: { equals: sizeVariantTypeId } },
          limit: 10,
        })
        sizeVariantOptions = existingOptions.docs as VariantOption[]
      } else {
        const sizeType = await payload.create({
          collection: 'variantTypes',
          data: { name: 'size', label: 'Size' },
        })
        sizeVariantTypeId = sizeType.id

        for (const option of SIZE_OPTIONS) {
          const opt = await payload.create({
            collection: 'variantOptions',
            data: { ...option, variantType: sizeVariantTypeId },
          })
          sizeVariantOptions.push(opt)
        }
      }
    }

    const createdProducts: Record<string, { id: string; category: string }> = {}
    const updatedProducts: string[] = []
    const errors: string[] = []

    // ── SMART UPDATES ──
    for (const pm of toUpdate) {
      try {
        const existingId = pm.existingProductId!

        // Fetch existing product for comparison
        const existing = await payload.findByID({
          collection: 'products',
          id: existingId,
          depth: 0,
        }) as any

        // Build update data — only include changed fields
        const updateData: Record<string, unknown> = {}
        let changedCount = 0

        if (existing.title !== pm.title) {
          updateData.title = pm.title
          changedCount++
        }
        if (existing.slug !== pm.slug) {
          updateData.slug = pm.slug
          changedCount++
        }
        if (existing.priceInUSD !== pm.finalPrice) {
          updateData.priceInUSD = pm.finalPrice
          updateData.priceInUSDEnabled = true
          changedCount++
        }

        // Compare description (plain text from richtext)
        const existingDesc = existing.description?.root?.children?.[0]?.children?.[0]?.text || ''
        if (existingDesc !== pm.description) {
          updateData.description = richText(pm.description)
          changedCount++
        }

        // Update gallery if new media provided
        if (pm.mediaIds.length > 0) {
          const existingGalleryIds = (existing.gallery || []).map((g: any) =>
            typeof g.image === 'string' ? g.image : g.image?.id
          ).filter(Boolean)
          const newIds = pm.mediaIds.filter((id) => !existingGalleryIds.includes(id))
          if (newIds.length > 0) {
            // Append new images to existing gallery
            updateData.gallery = [
              ...(existing.gallery || []),
              ...newIds.map((id) => ({ image: id })),
            ]
            changedCount++
          }
        }

        // Update category if changed
        const existingCatId = Array.isArray(existing.categories)
          ? (typeof existing.categories[0] === 'string' ? existing.categories[0] : existing.categories[0]?.id)
          : null
        const newCatId = categoryMap[pm.category]
        if (existingCatId !== newCatId) {
          updateData.categories = [newCatId]
          changedCount++
        }

        // Update meta
        const existingMetaTitle = existing.meta?.title || ''
        const existingMetaDesc = existing.meta?.description || ''
        if (existingMetaTitle !== pm.metaTitle || existingMetaDesc !== pm.metaDescription) {
          updateData.meta = {
            title: pm.metaTitle,
            image: pm.mediaIds[0] || existing.meta?.image || null,
            description: pm.metaDescription,
          }
          changedCount++
        }

        // Clean up relatedProducts — remove stale references that would fail validation
        if (existing.relatedProducts && Array.isArray(existing.relatedProducts)) {
          const validRelated: string[] = []
          for (const rp of existing.relatedProducts) {
            const rpId = typeof rp === 'string' ? rp : rp?.id
            if (!rpId) continue
            try {
              await payload.findByID({ collection: 'products', id: rpId, depth: 0 })
              validRelated.push(rpId)
            } catch {
              // Stale reference — skip it
            }
          }
          if (validRelated.length !== existing.relatedProducts.length) {
            updateData.relatedProducts = validRelated
            changedCount++
          }
        }

        if (changedCount > 0) {
          await payload.update({
            collection: 'products',
            id: existingId,
            data: updateData as any,
          })
          updatedProducts.push(pm.title)
          payload.logger.info(`[bulk-upload] Updated: ${pm.title} (${changedCount} fields changed)`)
        } else {
          payload.logger.info(`[bulk-upload] Skipped: ${pm.title} (no changes)`)
        }

        createdProducts[pm.slug] = { id: existingId, category: pm.category }
      } catch (err) {
        const msg = `Failed to update "${pm.title}": ${err instanceof Error ? err.message : err}`
        payload.logger.error(`[bulk-upload] ${msg}`)
        errors.push(msg)
      }
    }

    // ── NEW PRODUCTS ──
    for (const pm of toCreate) {
      try {
        // Check for duplicate slug in add mode
        if (!replaceExisting) {
          const existing = await payload.find({
            collection: 'products',
            where: { slug: { equals: pm.slug } },
            limit: 1,
          })
          if (existing.docs.length > 0) {
            payload.logger.info(`[bulk-upload] Skipping "${pm.title}" — slug already exists`)
            continue
          }
        }

        const mediaIds = pm.mediaIds || []

        const productData: Record<string, unknown> = {
          _status: 'published',
          title: pm.title,
          slug: pm.slug,
          description: richText(pm.description),
          heroImage: mediaIds[0] || null,
          gallery: mediaIds.map((id) => ({ image: id })),
          categories: [categoryMap[pm.category]],
          relatedProducts: [],
          layout: [],
          meta: {
            title: pm.metaTitle,
            image: mediaIds[0] || null,
            description: pm.metaDescription,
          },
          priceInUSDEnabled: true,
          priceInUSD: pm.finalPrice,
        }

        if (pm.hasSizeVariants && sizeVariantTypeId) {
          productData.enableVariants = true
          productData.variantTypes = [sizeVariantTypeId]
          productData.inventory = 0
        } else {
          productData.inventory = 492
        }

        const product = await payload.create({
          collection: 'products',
          depth: 0,
          data: productData as any,
        })

        createdProducts[pm.slug] = { id: product.id, category: pm.category }

        // Create size variants
        if (pm.hasSizeVariants && sizeVariantTypeId) {
          for (const sizeOption of sizeVariantOptions) {
            await payload.create({
              collection: 'variants',
              depth: 0,
              data: {
                product: product.id,
                options: [sizeOption.id],
                inventory: 492,
                priceInUSDEnabled: true,
                priceInUSD: pm.finalPrice,
                _status: 'published',
              },
            })
          }
        }

        payload.logger.info(`[bulk-upload] Created: ${pm.title} (${mediaIds.length} images)`)
      } catch (err) {
        const msg = `Failed to create "${pm.title}": ${err instanceof Error ? err.message : err}`
        payload.logger.error(`[bulk-upload] ${msg}`)
        errors.push(msg)
      }
    }

    // Wire up related products
    payload.logger.info('[bulk-upload] Linking related products...')
    const byCategory: Record<string, string[]> = {}
    for (const [slug, data] of Object.entries(createdProducts)) {
      if (!byCategory[data.category]) byCategory[data.category] = []
      byCategory[data.category].push(slug)
    }

    for (const group of Object.values(byCategory)) {
      for (const slug of group) {
        const others = group
          .filter((s) => s !== slug)
          .slice(0, 3)
          .map((s) => createdProducts[s].id)

        if (others.length > 0) {
          await payload.update({
            collection: 'products',
            id: createdProducts[slug].id,
            data: { relatedProducts: others },
          })
        }
      }
    }

    const createdCount = toCreate.filter((p) => createdProducts[p.slug]).length
    payload.logger.info(
      `[bulk-upload] Done! Created ${createdCount}, Updated ${updatedProducts.length}. ${errors.length} errors.`,
    )

    return Response.json({
      created: createdCount,
      updated: updatedProducts.length,
      updatedTitles: updatedProducts,
      errors,
      products: Object.entries(createdProducts).map(([slug, data]) => ({
        slug,
        id: data.id,
      })),
    })
  } catch (err) {
    payload.logger.error({ err, message: 'Error in bulk upload confirm' })
    return Response.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 },
    )
  }
}
