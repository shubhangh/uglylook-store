import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

/**
 * GET /next/photos
 *
 * Fetch approved photos for library browsing / picker.
 *
 * Query params:
 *   photoType — filter by type (campaign-hero, on-model, etc.)
 *   product   — filter by product ID
 *   design    — filter by design ID
 *   search    — search by title or tags
 *   limit     — max results (default 20)
 *   status    — filter by status (default: active)
 */
export async function GET(req: Request): Promise<Response> {
  try {
    const payload = await getPayload({ config })
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 })
    }

    const url = new URL(req.url)
    const photoType = url.searchParams.get('photoType')
    const productId = url.searchParams.get('product')
    const designId = url.searchParams.get('design')
    const search = url.searchParams.get('search')
    const limit = parseInt(url.searchParams.get('limit') || '20', 10)
    const status = url.searchParams.get('status') || 'active'

    const where: any = {
      and: [
        { status: { equals: status } },
      ],
    }

    if (photoType) {
      where.and.push({ photoType: { equals: photoType } })
    }
    if (productId) {
      where.and.push({ products: { contains: productId } })
    }
    if (designId) {
      where.and.push({ designs: { contains: designId } })
    }
    if (search) {
      where.and.push({
        or: [
          { title: { like: search } },
          { tags: { contains: search } },
        ],
      })
    }

    const result = await payload.find({
      collection: 'photos' as any,
      where,
      sort: '-createdAt',
      limit,
      depth: 1,
    })

    const photos = result.docs.map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      imageUrl: doc.imageUrl || doc.imageFile?.url || '',
      photoType: doc.photoType,
      background: doc.background,
      mood: doc.mood,
      products: doc.products,
      designs: doc.designs,
      usageCount: doc.usageCount || 0,
      isPinned: doc.isPinned || false,
      createdAt: doc.createdAt,
    }))

    return Response.json({
      photos,
      totalDocs: result.totalDocs,
      hasNextPage: result.hasNextPage,
    })
  } catch (error: any) {
    console.error('[photos] Error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
