import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'

/**
 * GET /next/designs?category=tees&search=logo&limit=50
 *
 * Returns active designs for the design picker.
 * Sorted: pinned first, then newest.
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
    const category = url.searchParams.get('category')
    const search = url.searchParams.get('search')
    const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 100)

    const where: any = {
      status: { equals: 'active' },
    }

    // Filter by category if provided
    if (category) {
      where.or = [
        { forCategories: { contains: category } },
        { forCategories: { contains: 'all' } },
      ]
    }

    // Search by title or printText
    if (search) {
      const searchWhere = {
        or: [
          { title: { like: search } },
          { printText: { like: search } },
        ],
      }
      // Merge search with existing where
      where.and = [searchWhere]
    }

    const result = await payload.find({
      collection: 'designs',
      where,
      sort: '-isPinned,-createdAt',
      limit,
      depth: 1, // populate designFile for thumbnail URL
    })

    const designs = result.docs.map((d: any) => ({
      id: d.id,
      title: d.title,
      designUrl: d.designUrl || '',
      thumbnailUrl: d.thumbnail?.url || d.designFile?.url || '',
      type: d.type,
      designLane: d.designLane,
      emotionTier: d.emotionTier,
      printText: d.printText,
      forCategories: d.forCategories,
      isPinned: d.isPinned,
      usageCount: d.usageCount || 0,
    }))

    return Response.json({ designs, total: result.totalDocs })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
