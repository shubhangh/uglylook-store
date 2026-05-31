import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { checkRole } from '@/access/utilities'

type CheckCacheRequest = {
  hashes: Array<{
    hash: string
    productName: string
    number: string
  }>
}

export async function POST(request: Request): Promise<Response> {
  const payload = await getPayload({ config })
  const requestHeaders = await headers()

  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user || !checkRole(['admin'], user)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = (await request.json()) as CheckCacheRequest

    if (!body.hashes || body.hashes.length === 0) {
      return Response.json({ cacheStatus: [], mediaStatus: [] })
    }

    const hashValues = body.hashes.map((h) => h.hash)

    // 1. Check AI analysis cache — get all versions per hash
    const cacheResult = await payload.find({
      collection: 'ai-product-analysis-cache' as any,
      where: { imageHash: { in: hashValues } },
      sort: '-createdAt',
      limit: hashValues.length * 5, // max 5 versions per hash
    })

    // Group cache entries by hash — include full analysis for version picker
    const cacheByHash = new Map<string, Array<{
      id: string
      version: number
      model: string
      createdAt: string
      analysis: any
    }>>()
    for (const doc of cacheResult.docs) {
      const d = doc as any
      if (!cacheByHash.has(d.imageHash)) {
        cacheByHash.set(d.imageHash, [])
      }
      cacheByHash.get(d.imageHash)!.push({
        id: d.id,
        version: d.version,
        model: d.model,
        createdAt: d.createdAt,
        analysis: d.analysis,
      })
    }

    // 2. Check media collection for existing images with matching hashes
    const mediaResult = await payload.find({
      collection: 'media',
      where: { imageHash: { in: hashValues } },
      limit: hashValues.length,
      select: { imageHash: true, alt: true, filename: true } as any,
    })

    const mediaByHash = new Map<string, { id: string; alt: string; filename: string }>()
    for (const doc of mediaResult.docs) {
      const d = doc as any
      if (d.imageHash) {
        mediaByHash.set(d.imageHash, {
          id: d.id,
          alt: d.alt,
          filename: d.filename,
        })
      }
    }

    // 3. Check which media are linked to products
    const mediaIds = [...mediaByHash.values()].map((m) => m.id)
    let productsByMedia = new Map<string, { title: string; slug: string; price: number }>()

    if (mediaIds.length > 0) {
      const productResult = await payload.find({
        collection: 'products',
        where: {
          'gallery.image': { in: mediaIds },
        },
        limit: 100,
        select: { title: true, slug: true, priceInUSD: true, gallery: true } as any,
      })

      for (const doc of productResult.docs) {
        const p = doc as any
        for (const galleryItem of p.gallery || []) {
          const imgId = typeof galleryItem.image === 'string' ? galleryItem.image : galleryItem.image?.id
          if (imgId && mediaIds.includes(imgId)) {
            productsByMedia.set(imgId, {
              title: p.title,
              slug: p.slug,
              price: p.priceInUSD,
            })
          }
        }
      }
    }

    // Build response
    const cacheStatus = body.hashes.map((h) => {
      const versions = cacheByHash.get(h.hash) || []
      const media = mediaByHash.get(h.hash)
      const product = media ? productsByMedia.get(media.id) : null

      return {
        number: h.number,
        productName: h.productName,
        hash: h.hash,
        // AI cache info
        cached: versions.length > 0,
        versionCount: versions.length,
        versions: versions.slice(0, 5),
        latestModel: versions[0]?.model || null,
        latestAnalyzedAt: versions[0]?.createdAt || null,
        // Media/product existence info
        existsInMedia: !!media,
        existsInStore: !!product,
        existingProduct: product
          ? {
              title: product.title,
              slug: product.slug,
              price: product.price,
            }
          : null,
      }
    })

    return Response.json({ cacheStatus })
  } catch (err) {
    payload.logger.error({ err, message: 'Error checking cache' })
    return Response.json({ error: 'Cache check failed' }, { status: 500 })
  }
}
