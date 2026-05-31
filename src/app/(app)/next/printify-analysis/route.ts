import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { isOwnerOrAdmin } from '@/access/utilities'
import type { PrintifyConfig } from '@/lib/printify'

type Recommendation = {
  type: 'cost_saving' | 'margin_alert' | 'new_product' | 'missing_config' | 'info'
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  productId?: string
  productTitle?: string
  data?: Record<string, any>
}

type ProductHealth = {
  id: string
  title: string
  price: number
  category: string
  hasPrintifyConfig: boolean
  hasPrintFile: boolean
  hasDesignUrl: boolean
  blueprintId: number | null
  providerId: number | null
  variantCount: number
  marginPercent: number | null
  status: 'ready' | 'missing_config' | 'missing_design' | 'low_margin' | 'no_variants'
}

/**
 * GET /next/printify-analysis
 *
 * Analyzes current Payload products against their Printify configuration.
 * Returns recommendations, alerts, and catalog health overview.
 */
export async function GET(req: Request): Promise<Response> {
  try {
    const payload = await getPayload({ config })
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!isOwnerOrAdmin(user)) {
      return Response.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Fetch all products
    const productsResult = await payload.find({
      collection: 'products',
      limit: 200,
      depth: 0,
      sort: 'title',
    })

    const products = productsResult.docs
    const recommendations: Recommendation[] = []
    const productHealth: ProductHealth[] = []

    // Stats
    let totalProducts = 0
    let readyProducts = 0
    let missingConfigProducts = 0
    let missingDesignProducts = 0
    let lowMarginProducts = 0
    let totalMargin = 0
    let marginCount = 0

    for (const product of products) {
      const p = product as any
      totalProducts++

      const config: PrintifyConfig | null = p.printifyConfig
      const hasPrintifyConfig = Boolean(
        config?.blueprintId && config?.providerId && Object.keys(config?.variantMap || {}).length > 0,
      )
      const hasPrintFile = Boolean(p.printFile)
      const hasDesignUrl = Boolean(config?.designUrl)
      const price = p.priceInUSD || 0
      const variantCount = Object.keys(config?.variantMap || {}).length

      // Calculate margin if we have enough data
      let marginPercent: number | null = null
      // We don't have live cost data without hitting Printify API,
      // so we estimate based on category
      const categoryPrices: Record<string, number> = {
        hoodies: 20, tees: 10, hats: 12, totes: 8, sweatshirts: 18,
      }

      // Get category from product
      let categorySlug = ''
      if (p.categories?.length) {
        const catId = typeof p.categories[0] === 'object' ? p.categories[0].id : p.categories[0]
        try {
          const cat = await payload.findByID({ collection: 'categories', id: catId, depth: 0 })
          categorySlug = (cat as any).slug || (cat as any).title?.toLowerCase() || ''
        } catch { /* ignore */ }
      }

      const estimatedCost = categoryPrices[categorySlug] || 15
      const estimatedShipping = 5.50
      const stripeFee = price * 0.029 + 0.30
      if (price > 0) {
        const totalCost = estimatedCost + estimatedShipping + stripeFee
        marginPercent = Math.round(((price - totalCost) / price) * 1000) / 10
        totalMargin += marginPercent
        marginCount++
      }

      // Determine status
      let status: ProductHealth['status'] = 'ready'
      if (!hasPrintifyConfig) {
        status = 'missing_config'
        missingConfigProducts++
      } else if (!hasDesignUrl && !hasPrintFile) {
        status = 'missing_design'
        missingDesignProducts++
      } else if (marginPercent !== null && marginPercent < 45) {
        status = 'low_margin'
        lowMarginProducts++
      } else {
        readyProducts++
      }

      if (variantCount === 0 && hasPrintifyConfig) {
        status = 'no_variants'
      }

      productHealth.push({
        id: p.id,
        title: p.title || 'Untitled',
        price,
        category: categorySlug || 'uncategorized',
        hasPrintifyConfig,
        hasPrintFile,
        hasDesignUrl,
        blueprintId: config?.blueprintId || null,
        providerId: config?.providerId || null,
        variantCount,
        marginPercent,
        status,
      })

      // Generate recommendations
      if (!hasPrintifyConfig) {
        recommendations.push({
          type: 'missing_config',
          severity: 'high',
          title: `"${p.title}" has no Printify configuration`,
          description: 'This product cannot be fulfilled via Printify. Use the Product Launcher to set up blueprint, provider, and variant mapping.',
          productId: p.id,
          productTitle: p.title,
        })
      }

      if (hasPrintifyConfig && !hasDesignUrl && !hasPrintFile) {
        recommendations.push({
          type: 'missing_config',
          severity: 'medium',
          title: `"${p.title}" has no design file`,
          description: 'Printify config exists but no design URL or print file is set. Orders will fail. Upload a print-ready PNG via Products editor.',
          productId: p.id,
          productTitle: p.title,
        })
      }

      if (marginPercent !== null && marginPercent < 40) {
        recommendations.push({
          type: 'margin_alert',
          severity: 'high',
          title: `"${p.title}" margin is ${marginPercent}% (below 45% target)`,
          description: `At $${price} retail with estimated $${estimatedCost} POD cost, margin is critically low. Consider raising price to $${Math.ceil((estimatedCost + estimatedShipping + stripeFee) / 0.55)} for 45% margin.`,
          productId: p.id,
          productTitle: p.title,
          data: { currentMargin: marginPercent, price, estimatedCost },
        })
      } else if (marginPercent !== null && marginPercent < 45) {
        recommendations.push({
          type: 'margin_alert',
          severity: 'medium',
          title: `"${p.title}" margin is ${marginPercent}% (borderline)`,
          description: `Close to the 45% target. Consider a small price increase to build buffer.`,
          productId: p.id,
          productTitle: p.title,
          data: { currentMargin: marginPercent, price },
        })
      }

      if (hasPrintifyConfig && variantCount === 0) {
        recommendations.push({
          type: 'missing_config',
          severity: 'high',
          title: `"${p.title}" has no variant mapping`,
          description: 'printifyConfig exists but variantMap is empty. Orders cannot resolve size/color to Printify variant IDs.',
          productId: p.id,
          productTitle: p.title,
        })
      }
    }

    // Summary recommendations
    if (missingConfigProducts === 0 && missingDesignProducts === 0 && lowMarginProducts === 0) {
      recommendations.unshift({
        type: 'info',
        severity: 'low',
        title: 'All products are healthy',
        description: `${readyProducts} products are fully configured and ready for Printify fulfillment.`,
      })
    }

    // Sort recommendations: high first, then medium, then low
    const severityOrder = { high: 0, medium: 1, low: 2 }
    recommendations.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

    const avgMargin = marginCount > 0 ? Math.round((totalMargin / marginCount) * 10) / 10 : null

    return Response.json({
      summary: {
        totalProducts,
        readyProducts,
        missingConfigProducts,
        missingDesignProducts,
        lowMarginProducts,
        avgMargin,
        allHealthy: missingConfigProducts === 0 && missingDesignProducts === 0 && lowMarginProducts === 0,
      },
      recommendations,
      productHealth,
    })
  } catch (error: any) {
    console.error('SKU analysis error:', error)
    return Response.json(
      { error: error?.message || 'Analysis failed' },
      { status: 500 },
    )
  }
}
