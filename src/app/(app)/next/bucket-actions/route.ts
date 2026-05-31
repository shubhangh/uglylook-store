import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { isOwnerOrAdmin } from '@/access/utilities'

/**
 * POST /next/bucket-actions
 *
 * Bulk operations on product buckets.
 *
 * Actions:
 *   publish   — publish all products in a bucket (or specific productIds)
 *   unpublish — unpublish all products in a bucket
 *   delete    — delete all products + variants in a bucket (requires confirm: "DELETE")
 *   move      — move products from one bucket to another
 *   copy      — copy products to another bucket (keeps in current)
 *   migrate   — create a bucket and assign all existing products to it
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const payload = await getPayload({ config })
    const requestHeaders = await headers()
    const { user } = await payload.auth({ headers: requestHeaders })

    if (!isOwnerOrAdmin(user)) {
      return Response.json({ error: 'Owner or admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { action } = body

    switch (action) {
      case 'publish':
      case 'unpublish': {
        const { bucketId, bucketIds, productIds } = body
        const newStatus = action === 'publish' ? 'published' : 'draft'

        let targetProductIds: string[] = []

        if (productIds?.length) {
          targetProductIds = productIds
        } else {
          // Get products from bucket(s)
          const ids = bucketIds?.length ? bucketIds : bucketId ? [bucketId] : []
          for (const id of ids) {
            const bucket = await payload.findByID({
              collection: 'buckets',
              id,
              depth: 0,
            })
            const products = (bucket as any).products || []
            targetProductIds.push(
              ...products.map((p: any) => (typeof p === 'object' ? p.id : p)),
            )
          }
        }

        if (targetProductIds.length === 0) {
          return Response.json({ error: 'No products found in bucket' }, { status: 400 })
        }

        // Deduplicate
        const unique = [...new Set(targetProductIds)]
        let affected = 0
        let skipped = 0

        for (const productId of unique) {
          try {
            await payload.update({
              collection: 'products',
              id: productId,
              data: { _status: newStatus } as any,
              context: { disableRevalidate: true },
            })
            affected++
          } catch {
            skipped++
          }
        }

        return Response.json({
          success: true,
          action,
          affected,
          skipped,
          total: unique.length,
        })
      }

      case 'delete': {
        const { bucketId, confirm } = body

        if (confirm !== 'DELETE') {
          return Response.json(
            { error: 'Destructive action requires confirm: "DELETE"' },
            { status: 400 },
          )
        }

        if (!bucketId) {
          return Response.json({ error: 'bucketId required' }, { status: 400 })
        }

        const bucket = await payload.findByID({
          collection: 'buckets',
          id: bucketId,
          depth: 0,
        })

        const productRefs = (bucket as any).products || []
        const productIds = productRefs.map((p: any) =>
          typeof p === 'object' ? p.id : p,
        )

        let deletedProducts = 0
        let deletedVariants = 0

        for (const productId of productIds) {
          try {
            // Delete variants for this product
            const variants = await payload.find({
              collection: 'variants' as any,
              where: { product: { equals: productId } },
              limit: 500,
              depth: 0,
            })

            for (const variant of variants.docs) {
              await payload.delete({
                collection: 'variants' as any,
                id: variant.id,
              })
              deletedVariants++
            }

            // Delete the product
            await payload.delete({
              collection: 'products',
              id: productId,
            })
            deletedProducts++
          } catch {
            // Product may not exist
          }
        }

        // Clear products from bucket
        await payload.update({
          collection: 'buckets',
          id: bucketId,
          data: { products: [] } as any,
        })

        return Response.json({
          success: true,
          action: 'delete',
          deletedProducts,
          deletedVariants,
        })
      }

      case 'move': {
        const { fromBucketId, toBucketId } = body

        if (!fromBucketId || !toBucketId) {
          return Response.json(
            { error: 'fromBucketId and toBucketId required' },
            { status: 400 },
          )
        }

        const fromBucket = await payload.findByID({
          collection: 'buckets',
          id: fromBucketId,
          depth: 0,
        })

        const productRefs = (fromBucket as any).products || []
        const productIds = productRefs.map((p: any) =>
          typeof p === 'object' ? p.id : p,
        )

        // Get existing products in target bucket
        const toBucket = await payload.findByID({
          collection: 'buckets',
          id: toBucketId,
          depth: 0,
        })
        const existingInTarget = ((toBucket as any).products || []).map((p: any) =>
          typeof p === 'object' ? p.id : p,
        )

        // Merge (deduplicate)
        const mergedProducts = [...new Set([...existingInTarget, ...productIds])]

        // Update target bucket
        await payload.update({
          collection: 'buckets',
          id: toBucketId,
          data: { products: mergedProducts } as any,
        })

        // Clear source bucket
        await payload.update({
          collection: 'buckets',
          id: fromBucketId,
          data: { products: [] } as any,
        })

        // Update product references: remove fromBucket, add toBucket
        for (const productId of productIds) {
          try {
            const product = await payload.findByID({
              collection: 'products',
              id: productId,
              depth: 0,
              select: { buckets: true },
            })
            const currentBuckets = ((product as any).buckets || [])
              .map((b: any) => (typeof b === 'object' ? b.id : b))
              .filter((id: string) => id !== fromBucketId)

            if (!currentBuckets.includes(toBucketId)) {
              currentBuckets.push(toBucketId)
            }

            await payload.update({
              collection: 'products',
              id: productId,
              data: { buckets: currentBuckets } as any,
              context: { disableRevalidate: true },
            })
          } catch { /* skip */ }
        }

        return Response.json({
          success: true,
          action: 'move',
          moved: productIds.length,
          from: fromBucketId,
          to: toBucketId,
        })
      }

      case 'copy': {
        const { fromBucketId, toBucketId } = body

        if (!fromBucketId || !toBucketId) {
          return Response.json(
            { error: 'fromBucketId and toBucketId required' },
            { status: 400 },
          )
        }

        const fromBucket = await payload.findByID({
          collection: 'buckets',
          id: fromBucketId,
          depth: 0,
        })

        const productRefs = (fromBucket as any).products || []
        const productIds = productRefs.map((p: any) =>
          typeof p === 'object' ? p.id : p,
        )

        // Get existing products in target bucket
        const toBucket = await payload.findByID({
          collection: 'buckets',
          id: toBucketId,
          depth: 0,
        })
        const existingInTarget = ((toBucket as any).products || []).map((p: any) =>
          typeof p === 'object' ? p.id : p,
        )

        const mergedProducts = [...new Set([...existingInTarget, ...productIds])]

        // Update target bucket
        await payload.update({
          collection: 'buckets',
          id: toBucketId,
          data: { products: mergedProducts } as any,
        })

        // Update product references: add toBucket (keep fromBucket)
        for (const productId of productIds) {
          try {
            const product = await payload.findByID({
              collection: 'products',
              id: productId,
              depth: 0,
              select: { buckets: true },
            })
            const currentBuckets = ((product as any).buckets || []).map((b: any) =>
              typeof b === 'object' ? b.id : b,
            )

            if (!currentBuckets.includes(toBucketId)) {
              currentBuckets.push(toBucketId)
              await payload.update({
                collection: 'products',
                id: productId,
                data: { buckets: currentBuckets } as any,
                context: { disableRevalidate: true },
              })
            }
          } catch { /* skip */ }
        }

        return Response.json({
          success: true,
          action: 'copy',
          copied: productIds.length,
          from: fromBucketId,
          to: toBucketId,
        })
      }

      case 'migrate': {
        const { title = '05-SS26-collection' } = body

        // Check if bucket already exists
        const existing = await payload.find({
          collection: 'buckets',
          where: { title: { equals: title } },
          limit: 1,
        })

        if (existing.docs.length > 0) {
          return Response.json(
            { error: `Bucket "${title}" already exists`, bucketId: existing.docs[0].id },
            { status: 409 },
          )
        }

        // Get all products
        const allProducts = await payload.find({
          collection: 'products',
          limit: 500,
          depth: 0,
        })

        const productIds = allProducts.docs.map((p) => p.id)

        // Create bucket
        const bucket = await payload.create({
          collection: 'buckets',
          data: {
            title,
            slug: title.toLowerCase().replace(/\s+/g, '-'),
            description: `Initial product catalog — ${productIds.length} products.`,
            status: 'active',
            color: 'olive',
            products: productIds,
          } as any,
        })

        // Update all products with bucket reference
        for (const productId of productIds) {
          try {
            await payload.update({
              collection: 'products',
              id: productId,
              data: { buckets: [bucket.id] } as any,
              context: { disableRevalidate: true },
            })
          } catch { /* skip */ }
        }

        return Response.json({
          success: true,
          action: 'migrate',
          bucketId: bucket.id,
          title,
          productsAssigned: productIds.length,
        })
      }

      default:
        return Response.json(
          { error: `Unknown action: ${action}. Valid: publish, unpublish, delete, move, copy, migrate` },
          { status: 400 },
        )
    }
  } catch (error: any) {
    console.error('Bucket action error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
