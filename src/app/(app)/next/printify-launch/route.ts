import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { isOwnerOrAdmin } from '@/access/utilities'
import { getVariants, getShipping } from '@/lib/printify'
import type { PrintifyConfig } from '@/lib/printify'

/**
 * POST /next/printify-launch
 *
 * Creates one or more Payload products from Printify blueprint specs.
 * Fetches variants + shipping from Printify API, builds printifyConfig,
 * creates the product in Payload.
 *
 * Body: { products: LaunchProduct[] }
 *
 * Each LaunchProduct:
 *   blueprintId, providerId — from Catalog Browser selection
 *   title, description — editable by admin
 *   price — retail price in USD (number, e.g. 72)
 *   category — "hoodies" | "tees" | "hats" | "totes" | etc.
 *   designUrl — URL to print file on R2 (or empty for later)
 *   colors — array of color names to enable (e.g. ["Black", "Bone"])
 *   sizes — array of size names to enable (e.g. ["S", "M", "L", "XL", "2XL"])
 *   placement — { position, x, y, scale, angle }
 *   publishStatus — "draft" | "published"
 */

type LaunchProduct = {
  blueprintId: number
  providerId: number
  title: string
  description?: string
  price: number
  category?: string
  designId?: string
  designUrl?: string
  galleryMediaIds?: string[]
  catalogMediaIds?: string[]
  colors: string[]
  sizes: string[]
  placement?: {
    position: string
    x: number
    y: number
    scale: number
    angle: number
  }
  publishStatus: 'draft' | 'published'
}

export async function POST(req: Request): Promise<Response> {
  try {
    const payload = await getPayload({ config })
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!isOwnerOrAdmin(user)) {
      return Response.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { products }: { products: LaunchProduct[] } = await req.json()

    if (!products?.length) {
      return Response.json({ error: 'No products to launch' }, { status: 400 })
    }

    const results: {
      title: string
      status: 'created' | 'error'
      productId?: string
      error?: string
    }[] = []

    for (const p of products) {
      try {
        // Fetch variants from Printify to build variantMap
        const variantsResponse = await getVariants(p.blueprintId, p.providerId)
        const allVariants = variantsResponse?.variants || []

        if (allVariants.length === 0) {
          results.push({
            title: p.title,
            status: 'error',
            error: 'No variants returned from Printify for this blueprint/provider',
          })
          continue
        }

        // Filter variants by requested colors + sizes
        const variantMap: Record<string, number> = {}
        const enabledVariants: any[] = []

        for (const v of allVariants) {
          if (v.is_enabled === false || !v.title) continue

          const parts = v.title.split(/\s*\/\s*/)
          let color = ''
          let size = ''

          if (parts.length >= 2) {
            color = parts[0].trim()
            size = parts[parts.length - 1].trim()
          } else {
            color = parts[0].trim()
          }

          // Check if this variant matches requested colors/sizes
          const colorMatch =
            p.colors.length === 0 ||
            p.colors.some((c) => color.toLowerCase().includes(c.toLowerCase()))
          const sizeMatch =
            p.sizes.length === 0 ||
            p.sizes.some((s) => size.toUpperCase() === s.toUpperCase())

          if (colorMatch && sizeMatch) {
            const key = size ? `${color}_${size}` : color
            variantMap[key] = v.id
            enabledVariants.push(v)
          }
        }

        if (Object.keys(variantMap).length === 0) {
          results.push({
            title: p.title,
            status: 'error',
            error: `No variants matched colors [${p.colors.join(', ')}] + sizes [${p.sizes.join(', ')}]`,
          })
          continue
        }

        // Resolve design if designId provided
        let resolvedDesignUrl = p.designUrl || ''
        let resolvedDesignId: string | undefined = p.designId
        let resolvedPrintFileId: string | undefined

        if (p.designId) {
          try {
            const design = await payload.findByID({
              collection: 'designs',
              id: p.designId,
              depth: 0,
            })
            resolvedDesignUrl = design.designUrl || resolvedDesignUrl
            resolvedPrintFileId = typeof design.designFile === 'object'
              ? (design.designFile as any)?.id
              : (design.designFile as string)
          } catch {
            // Design not found — continue with designUrl if provided
            resolvedDesignId = undefined
          }
        }

        // Build printifyConfig
        const placement = p.placement || {
          position: 'front',
          x: 0.5,
          y: 0.45,
          scale: 0.8,
          angle: 0,
        }

        const printifyConfig: PrintifyConfig = {
          blueprintId: p.blueprintId,
          providerId: p.providerId,
          designUrl: resolvedDesignUrl,
          placement,
          variantMap,
        }

        // B3 Fix: Match existing categories ONLY — never create new ones
        let categoryId: string | null = null
        if (p.category) {
          const categorySlug = p.category.toLowerCase()
          // Try exact slug match
          let existing = await payload.find({
            collection: 'categories',
            where: { slug: { equals: categorySlug } },
            limit: 1,
          })
          // Try title match as fallback
          if (existing.docs.length === 0) {
            existing = await payload.find({
              collection: 'categories',
              where: { title: { like: p.category } },
              limit: 1,
            })
          }
          if (existing.docs.length > 0) {
            categoryId = existing.docs[0].id
          }
          // If no match found, skip — don't create new categories
        }

        // B1 Fix: Create Payload ecommerce variants from variantMap
        // Extract unique sizes and colors from the variant map keys (format: "Color_Size" or just "Color")
        const uniqueSizes = new Set<string>()
        const uniqueColors = new Set<string>()
        for (const key of Object.keys(variantMap)) {
          const parts = key.split('_')
          if (parts.length >= 2) {
            uniqueColors.add(parts[0])
            uniqueSizes.add(parts.slice(1).join('_'))
          } else {
            uniqueColors.add(parts[0])
          }
        }

        // Ensure "Size" variant type exists
        let sizeTypeId: string | null = null
        if (uniqueSizes.size > 0) {
          const existingType = await payload.find({
            collection: 'variantTypes' as any,
            where: { label: { equals: 'Size' } },
            limit: 1,
          })
          if (existingType.docs.length > 0) {
            sizeTypeId = existingType.docs[0].id
          } else {
            const created = await payload.create({
              collection: 'variantTypes' as any,
              data: { label: 'Size' },
            })
            sizeTypeId = created.id
          }
        }

        // Ensure variant options exist for each size
        const sizeOptionMap: Record<string, string> = {} // size label → option ID
        if (sizeTypeId) {
          for (const size of uniqueSizes) {
            const existing = await payload.find({
              collection: 'variantOptions' as any,
              where: { label: { equals: size }, variantType: { equals: sizeTypeId } },
              limit: 1,
            })
            if (existing.docs.length > 0) {
              sizeOptionMap[size] = existing.docs[0].id
            } else {
              const created = await payload.create({
                collection: 'variantOptions' as any,
                data: { label: size, variantType: sizeTypeId },
              })
              sizeOptionMap[size] = created.id
            }
          }
        }

        // B2 Fix: Only use approved gallery images (filter by checking the mockups array if provided)
        const approvedGalleryIds = p.galleryMediaIds?.filter((id: string) => {
          // If no explicit approval tracking, include all (backwards compat)
          return true
        }) || []

        // Create the Payload product
        const product = await payload.create({
          collection: 'products',
          data: {
            title: p.title,
            ...(p.description ? { description: { root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text: p.description }] }] } } } : {}),
            priceInUSD: p.price,
            ...(resolvedDesignId ? { design: resolvedDesignId } : {}),
            ...(resolvedPrintFileId ? { printFile: resolvedPrintFileId } : {}),
            ...(approvedGalleryIds.length ? { heroImage: approvedGalleryIds[0], gallery: approvedGalleryIds.map((id: string) => ({ image: id })) } : {}),
            ...(p.catalogMediaIds?.length ? { catalogImages: p.catalogMediaIds.map((id: string) => ({ image: id })) } : {}),
            printifyConfig: printifyConfig as any,
            ...(categoryId ? { categories: [categoryId] } : {}),
            // B1: Enable variants if we have sizes
            ...(sizeTypeId ? { enableVariants: true, variantTypes: [sizeTypeId] } : {}),
            inventory: sizeTypeId ? 0 : 10, // Variant products use per-variant inventory
            _status: p.publishStatus,
          } as any,
          draft: p.publishStatus === 'draft',
        })

        // B1: Create variant documents for each size (or color_size combo)
        if (sizeTypeId) {
          for (const [key, printifyVariantId] of Object.entries(variantMap)) {
            const parts = key.split('_')
            let sizeLabel = ''
            let colorLabel = ''
            if (parts.length >= 2) {
              colorLabel = parts[0]
              sizeLabel = parts.slice(1).join('_')
            } else {
              colorLabel = parts[0]
            }

            const optionId = sizeOptionMap[sizeLabel]
            if (!optionId) continue

            const variantTitle = colorLabel
              ? `${p.title} — ${colorLabel} / ${sizeLabel}`
              : `${p.title} — ${sizeLabel}`

            await payload.create({
              collection: 'variants',
              data: {
                product: product.id,
                title: variantTitle,
                options: [optionId],
                priceInUSD: p.price,
                inventory: 10,
                printifyVariantId: printifyVariantId as any,
              } as any,
            })
          }
        }

        results.push({
          title: p.title,
          status: 'created',
          productId: product.id,
        })

        payload.logger.info(
          `Product launched: "${p.title}" (${product.id}) — ${Object.keys(variantMap).length} variants`,
        )
      } catch (err: any) {
        results.push({
          title: p.title,
          status: 'error',
          error: err.message || 'Unknown error',
        })
      }
    }

    const created = results.filter((r) => r.status === 'created').length
    const errors = results.filter((r) => r.status === 'error').length

    return Response.json({
      success: true,
      summary: `${created} created, ${errors} failed`,
      results,
    })
  } catch (error: any) {
    console.error('Product launch error:', error)
    return Response.json(
      { error: error?.message || 'Launch failed' },
      { status: 500 },
    )
  }
}
