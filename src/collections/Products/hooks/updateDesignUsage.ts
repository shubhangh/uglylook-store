import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

function getDesignId(val: any): string | null {
  if (!val) return null
  if (typeof val === 'object') return val.id || null
  return String(val)
}

async function incrementUsage(designId: string, delta: number, payload: any) {
  try {
    const design = await payload.findByID({
      collection: 'designs',
      id: designId,
      depth: 0,
    })
    const current = design?.usageCount || 0
    await payload.update({
      collection: 'designs',
      id: designId,
      data: { usageCount: Math.max(0, current + delta) },
      depth: 0,
      context: { disableRevalidate: true },
    })
  } catch {
    // Design may have been deleted
  }
}

/**
 * After a product is created/updated, adjust the linked design's usageCount.
 */
export const updateDesignUsageAfterChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req: { payload },
}) => {
  const newId = getDesignId(doc?.design)
  const oldId = getDesignId(previousDoc?.design)

  if (newId === oldId) return doc

  if (oldId) await incrementUsage(oldId, -1, payload)
  if (newId) await incrementUsage(newId, 1, payload)

  return doc
}

/**
 * After a product is deleted, decrement the linked design's usageCount.
 */
export const updateDesignUsageAfterDelete: CollectionAfterDeleteHook = async ({
  doc,
  req: { payload },
}) => {
  const designId = getDesignId(doc?.design)
  if (designId) await incrementUsage(designId, -1, payload)
  return doc
}
