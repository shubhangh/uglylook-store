import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { isOwnerOrAdmin } from '@/access/utilities'
import { probeVariantCosts } from '@/lib/printify'

/**
 * GET /next/printify-costs?blueprintId=6&providerId=99
 *
 * On-demand cost probe: creates a temp Printify product to read variant costs,
 * then deletes it. Returns a map of variantId -> cost (cents).
 *
 * Caches results in the printify-catalog-cache doc so subsequent opens are instant.
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
    const blueprintId = parseInt(url.searchParams.get('blueprintId') || '', 10)
    const providerId = parseInt(url.searchParams.get('providerId') || '', 10)

    if (!blueprintId || !providerId) {
      return Response.json({ error: 'blueprintId and providerId required' }, { status: 400 })
    }

    // Check if we already have costs cached in the catalog cache doc
    const cached = await payload.find({
      collection: 'printify-catalog-cache' as any,
      where: {
        and: [
          { blueprintId: { equals: blueprintId } },
          { providerId: { equals: providerId } },
        ],
      },
      limit: 1,
      depth: 0,
    })

    const refresh = url.searchParams.get('refresh') === '1'
    const cacheDoc = cached.docs[0] as any
    if (cacheDoc?.minCost > 0 && !refresh) {
      // Already have costs — return from cache
      return Response.json({
        source: 'cache',
        blueprintId,
        providerId,
        minCost: cacheDoc.minCost,
        maxCost: cacheDoc.maxCost,
        variantCosts: (cacheDoc.variants || []).reduce((acc: Record<number, number>, v: any) => {
          if (v.cost > 0) acc[v.variantId] = v.cost
          return acc
        }, {}),
      })
    }

    // Need to probe — get a sample variant ID from the cached variants
    const sampleVariantId = cacheDoc?.variants?.[0]?.variantId
    if (!sampleVariantId) {
      return Response.json({ error: 'No variants found in cache for this SKU' }, { status: 404 })
    }

    // Probe Printify for costs (create temp product → read costs → delete)
    const costMap = await probeVariantCosts(blueprintId, providerId, sampleVariantId)

    if (costMap.size === 0) {
      return Response.json({
        source: 'probe',
        blueprintId,
        providerId,
        minCost: 0,
        maxCost: 0,
        variantCosts: {},
        error: 'Could not retrieve costs from Printify',
      })
    }

    // Update cached variants with costs and recalculate minCost/maxCost
    const costs = Array.from(costMap.values())
    const minCostCents = Math.min(...costs)
    const maxCostCents = Math.max(...costs)
    const minCost = minCostCents / 100
    const maxCost = maxCostCents / 100

    // Update the cache doc with costs
    if (cacheDoc) {
      const updatedVariants = (cacheDoc.variants || []).map((v: any) => ({
        ...v,
        cost: costMap.get(v.variantId) || v.cost || 0,
        costDollars: costMap.has(v.variantId) ? costMap.get(v.variantId)! / 100 : (v.costDollars || 0),
      }))

      // Recalculate margin with real costs
      const shippingCostUs = cacheDoc.shippingCostUs || 0
      const targetRetail = cacheDoc.targetRetail || 0
      const stripeFee = targetRetail * 0.029 + 0.30
      const totalCost = minCost + shippingCostUs + stripeFee
      const profitPerUnit = targetRetail - totalCost
      const marginPercent = targetRetail > 0 ? Math.round((profitPerUnit / targetRetail) * 1000) / 10 : 0

      await payload.update({
        collection: 'printify-catalog-cache' as any,
        id: cacheDoc.id,
        data: {
          minCost,
          maxCost,
          marginPercent,
          profitPerUnit: Math.round(profitPerUnit * 100) / 100,
          variants: updatedVariants,
        } as any,
      })
    }

    return Response.json({
      source: 'probe',
      blueprintId,
      providerId,
      minCost,
      maxCost,
      variantCosts: Object.fromEntries(costMap),
    })
  } catch (error: any) {
    console.error('Printify cost probe error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
