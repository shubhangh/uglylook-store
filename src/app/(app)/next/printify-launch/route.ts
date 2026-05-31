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

        // Resolve category — find or create
        let categoryId: string | null = null
        if (p.category) {
          const categorySlug = p.category.toLowerCase()
          const existing = await payload.find({
            collection: 'categories',
            where: { slug: { equals: categorySlug } },
            limit: 1,
          })

          if (existing.docs.length > 0) {
            categoryId = existing.docs[0].id
          } else {
            // Create category
            const created = await payload.create({
              collection: 'categories',
              data: {
                title:
                  categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1),
              } as any,
            })
            categoryId = created.id
          }
        }

        // Create the Payload product
        const product = await payload.create({
          collection: 'products',
          data: {
            title: p.title,
            ...(p.description ? { description: { root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text: p.description }] }] } } } : {}),
            priceInUSD: p.price,
            ...(resolvedDesignId ? { design: resolvedDesignId } : {}),
            ...(resolvedPrintFileId ? { printFile: resolvedPrintFileId } : {}),
            ...(p.galleryMediaIds?.length ? { gallery: p.galleryMediaIds.map((id) => ({ image: id })) } : {}),
            printifyConfig: printifyConfig as any,
            ...(categoryId ? { categories: [categoryId] } : {}),
            _status: p.publishStatus,
          } as any,
          draft: p.publishStatus === 'draft',
        })

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
