import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { isOwnerOrAdmin } from '@/access/utilities'

/**
 * GET /next/printify-catalog
 *
 * Reads scored SKUs from MongoDB (printify-catalog-cache collection).
 * Sub-second response — no Printify API calls.
 *
 * Catalog data is populated by the background sync worker
 * (triggered via POST /next/printify-sync).
 *
 * Query params:
 *   category  — filter by category (hoodies, tees, hats, totes, sweatshirts, all)
 *   minMargin — minimum margin % to include (default 0)
 *   color     — require this brand color (black, bone, white, olive)
 *   limit     — max results (default 50, max 200)
 *   sort      — sort by: score (default), margin, cost, brand
 */
export async function GET(req: Request): Promise<Response> {
  try {
    const payload = await getPayload({ config })
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!isOwnerOrAdmin(user)) {
      return Response.json({ error: 'Admin access required' }, { status: 403 })
    }

    const url = new URL(req.url)
    const categoryFilter = url.searchParams.get('category') || 'all'
    const minMargin = parseFloat(url.searchParams.get('minMargin') || '0')
    const colorFilter = url.searchParams.get('color') || ''
    const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') || '24', 10)))
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
    const sort = url.searchParams.get('sort') || 'score'

    // Build query
    const where: any = {
      status: { equals: 'active' },
    }

    if (categoryFilter !== 'all') {
      where.category = { equals: categoryFilter }
    }

    if (minMargin > 0) {
      where.marginPercent = { greater_than_equal: minMargin }
    }

    // Sort mapping
    let sortField = '-score'
    switch (sort) {
      case 'margin':
        sortField = '-marginPercent'
        break
      case 'cost':
        sortField = 'minCost'
        break
      case 'brand':
        sortField = 'blueprintBrand'
        break
      default:
        sortField = '-score'
    }

    // Fetch from MongoDB with pagination
    // If color filter is needed, we must fetch more and post-filter, then paginate manually
    let filteredDocs: any[]
    let totalFiltered: number

    if (colorFilter) {
      // Color is stored as JSON array — can't query in Payload, must post-filter
      const allResults = await payload.find({
        collection: 'printify-catalog-cache' as any,
        where,
        sort: sortField,
        limit: 10000,
        depth: 0,
      })
      filteredDocs = (allResults.docs as any[]).filter((d: any) =>
        d.brandColorsAvailable?.includes(colorFilter.toLowerCase()),
      )
      totalFiltered = filteredDocs.length
      // Manual pagination
      filteredDocs = filteredDocs.slice((page - 1) * limit, page * limit)
    } else {
      const results = await payload.find({
        collection: 'printify-catalog-cache' as any,
        where,
        sort: sortField,
        limit,
        page,
        depth: 0,
      })
      filteredDocs = results.docs as any[]
      totalFiltered = results.totalDocs
    }

    // Get category counts (from all active SKUs, no filters)
    const allActive = await payload.find({
      collection: 'printify-catalog-cache' as any,
      where: { status: { equals: 'active' } },
      limit: 10000,
      depth: 0,
      select: { category: true },
    })

    const categoryCounts: Record<string, number> = {}
    for (const doc of allActive.docs) {
      const cat = (doc as any).category
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
    }

    // Get last sync time
    const lastSync = await payload.find({
      collection: 'printify-sync-log' as any,
      limit: 1,
      sort: '-completedAt',
      where: { status: { in: ['completed', 'partial'] } },
      depth: 0,
      select: { completedAt: true },
    })

    const lastSyncAt = (lastSync.docs[0] as any)?.completedAt || null

    return Response.json({
      results: filteredDocs.map((d: any) => ({
        blueprintId: d.blueprintId,
        blueprintTitle: d.blueprintTitle,
        blueprintBrand: d.blueprintBrand,
        blueprintModel: d.blueprintModel,
        blueprintImages: d.blueprintImages || [],
        providerId: d.providerId,
        providerTitle: d.providerTitle,
        decorationMethods: d.decorationMethods || [],
        category: d.category,
        minCost: d.minCost,
        maxCost: d.maxCost,
        shippingCostUs: d.shippingCostUs,
        handlingTime: d.handlingTime,
        targetRetail: d.targetRetail,
        marginPercent: d.marginPercent,
        profitPerUnit: d.profitPerUnit,
        totalVariants: d.totalVariants,
        enabledVariants: d.enabledVariants,
        availableColors: d.availableColors || [],
        brandColorsAvailable: d.brandColorsAvailable || [],
        brandColorCount: d.brandColorCount,
        availableSizes: d.availableSizes || [],
        sizeRange: d.sizeRange,
        hasSizeS: d.availableSizes?.includes('S'),
        hasSizeM: d.availableSizes?.includes('M'),
        hasSizeL: d.availableSizes?.includes('L'),
        hasSizeXL: d.availableSizes?.includes('XL'),
        hasSize2XL: d.availableSizes?.includes('2XL'),
        printAreaFront: d.printAreaFront,
        printAreaBack: d.printAreaBack,
        printAreaCount: d.printAreaCount,
        isUsProvider: true,
        variants: d.variants || [],
        score: d.score,
        scoreBreakdown: d.scoreBreakdown || {},
      })),
      total: totalFiltered,
      page,
      limit,
      totalPages: Math.ceil(totalFiltered / limit),
      categoryCounts,
      cachedAt: lastSyncAt,
      lastSyncedAt: lastSyncAt,
      syncAge: lastSyncAt ? getAge(lastSyncAt) : null,
      isStale: lastSyncAt ? Date.now() - new Date(lastSyncAt).getTime() > 24 * 60 * 60 * 1000 : true,
      filters: {
        category: categoryFilter,
        minMargin,
        color: colorFilter,
        sort,
        limit,
      },
    })
  } catch (error: any) {
    console.error('Printify catalog error:', error)
    return Response.json(
      { error: error?.message || 'Failed to fetch catalog' },
      { status: 500 },
    )
  }
}

function getAge(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ${mins % 60}m ago`
  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h ago`
}
