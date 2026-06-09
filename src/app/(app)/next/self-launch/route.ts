import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { isOwnerOrAdmin } from '@/access/utilities'

/**
 * POST /next/self-launch
 *
 * Creates a self-fulfilled product in Payload.
 * No Printify involvement — just creates the product doc with fulfillmentType: "self".
 *
 * Body: {
 *   title: string
 *   description?: string
 *   price: number
 *   category?: string    — category slug to match
 *   designId?: string    — optional design from Design Library
 *   galleryMediaIds?: string[]  — uploaded image media IDs
 *   publishStatus: "draft" | "published"
 *   variants?: { color: string; size: string; price?: number }[]
 * }
 */

type SelfLaunchProduct = {
  title: string
  description?: string
  price: number
  category?: string
  designId?: string
  galleryMediaIds?: string[]
  publishStatus: 'draft' | 'published'
  variants?: { color: string; size: string; price?: number }[]
}

export async function POST(req: Request): Promise<Response> {
  try {
    const payload = await getPayload({ config })
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!isOwnerOrAdmin(user)) {
      return Response.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body: SelfLaunchProduct = await req.json()

    if (!body.title?.trim()) {
      return Response.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!body.price || body.price <= 0) {
      return Response.json({ error: 'Price must be greater than 0' }, { status: 400 })
    }

    // Match category by slug
    let categoryId: string | undefined
    if (body.category) {
      const cats = await payload.find({
        collection: 'categories',
        where: { slug: { equals: body.category } },
        limit: 1,
        depth: 0,
      })
      if (cats.docs.length > 0) {
        categoryId = cats.docs[0].id
      }
    }

    // Build gallery from uploaded media IDs
    const gallery = (body.galleryMediaIds || []).map((id) => ({
      image: id,
    }))

    // Generate slug from title (with uniqueness suffix to avoid collisions)
    const baseSlug = body.title.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 70)

    // Check if slug already exists, append short hash if so
    const existingSlugs = await payload.find({
      collection: 'products',
      where: { slug: { like: baseSlug } },
      limit: 1,
      depth: 0,
      select: { slug: true },
    })
    const slug = existingSlugs.totalDocs > 0
      ? `${baseSlug}-${Date.now().toString(36).slice(-4)}`
      : baseSlug

    // Create product
    const product = await payload.create({
      collection: 'products',
      data: {
        title: body.title.trim(),
        slug,
        fulfillmentType: 'self',
        priceInUSD: body.price,
        ...(body.description ? { description: { root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text: body.description }] }] } } } : {}),
        ...(categoryId ? { categories: [categoryId] } : {}),
        ...(body.designId ? { design: body.designId } : {}),
        ...(gallery.length > 0 ? { gallery, heroImage: gallery[0].image } : {}),
        _status: body.publishStatus || 'draft',
      } as any,
    })

    // Create variants if provided
    let variantCount = 0
    if (body.variants?.length) {
      // Get or create variant types for Color and Size
      const colorType = await getOrCreateVariantType(payload, 'Color')
      const sizeType = await getOrCreateVariantType(payload, 'Size')

      // Enable variants on the product
      await payload.update({
        collection: 'products',
        id: product.id,
        data: {
          enableVariants: true,
          variantTypes: [colorType.id, sizeType.id],
        } as any,
      })

      // Collect unique colors and sizes
      const uniqueColors = [...new Set(body.variants.map((v) => v.color))]
      const uniqueSizes = [...new Set(body.variants.map((v) => v.size))]

      // Create variant options
      const colorOptionMap = new Map<string, string>()
      for (const color of uniqueColors) {
        const opt = await getOrCreateVariantOption(payload, colorType.id, color)
        colorOptionMap.set(color, opt.id)
      }

      const sizeOptionMap = new Map<string, string>()
      for (const size of uniqueSizes) {
        const opt = await getOrCreateVariantOption(payload, sizeType.id, size)
        sizeOptionMap.set(size, opt.id)
      }

      // Create variant docs
      for (const v of body.variants) {
        const colorOptId = colorOptionMap.get(v.color)
        const sizeOptId = sizeOptionMap.get(v.size)
        if (!colorOptId || !sizeOptId) continue

        await payload.create({
          collection: 'variants',
          data: {
            product: product.id,
            options: [colorOptId, sizeOptId],
            priceInUSD: v.price || body.price,
            stock: 0,
            isActive: true,
          } as any,
        })
        variantCount++
      }
    }

    return Response.json({
      success: true,
      productId: product.id,
      title: body.title,
      variantCount,
      summary: `Created "${body.title}" (self-fulfilled)${variantCount > 0 ? ` with ${variantCount} variants` : ''}`,
    })
  } catch (error: any) {
    console.error('[self-launch] Error:', error)
    return Response.json(
      { error: error?.message || 'Failed to create product' },
      { status: 500 },
    )
  }
}

// ── Helpers ──

async function getOrCreateVariantType(payload: any, label: string) {
  const existing = await payload.find({
    collection: 'variantTypes' as any,
    where: { label: { equals: label } },
    limit: 1,
    depth: 0,
  })
  if (existing.docs.length > 0) return existing.docs[0]

  const name = label.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return payload.create({
    collection: 'variantTypes' as any,
    data: { label, name },
  })
}

async function getOrCreateVariantOption(payload: any, variantTypeId: string, label: string) {
  const existing = await payload.find({
    collection: 'variantOptions' as any,
    where: {
      and: [
        { variantType: { equals: variantTypeId } },
        { label: { equals: label } },
      ],
    },
    limit: 1,
    depth: 0,
  })
  if (existing.docs.length > 0) return existing.docs[0]

  const value = label.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return payload.create({
    collection: 'variantOptions' as any,
    data: { variantType: variantTypeId, label, value },
  })
}
