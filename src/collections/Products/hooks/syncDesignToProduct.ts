import type { CollectionBeforeChangeHook } from 'payload'

/**
 * When a design is linked to a product, auto-populate:
 * - printFile → design's designFile (media ID)
 * - printifyConfig.designUrl → design's designUrl (R2 URL)
 *
 * When design is cleared, clear both fields.
 * Skips if the design hasn't changed.
 */
export const syncDesignToProduct: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req: { payload },
}) => {
  const newDesignId = typeof data.design === 'object' ? data.design?.id : data.design
  const oldDesignId = typeof originalDoc?.design === 'object' ? originalDoc?.design?.id : originalDoc?.design

  // No change
  if (newDesignId === oldDesignId) return data

  // Design cleared
  if (!newDesignId) {
    return {
      ...data,
      printFile: null,
      printifyConfig: {
        ...(typeof data.printifyConfig === 'object' ? data.printifyConfig : {}),
        designUrl: '',
      },
    }
  }

  // Design set or changed — fetch the design
  try {
    const design = await payload.findByID({
      collection: 'designs',
      id: newDesignId,
      depth: 0,
    })

    const designFileId = typeof design.designFile === 'object'
      ? (design.designFile as any)?.id
      : design.designFile

    return {
      ...data,
      printFile: designFileId || data.printFile,
      printifyConfig: {
        ...(typeof data.printifyConfig === 'object' ? data.printifyConfig : {}),
        designUrl: design.designUrl || '',
      },
    }
  } catch (err) {
    payload.logger.error(`syncDesignToProduct: Failed to fetch design ${newDesignId}: ${err}`)
    return data
  }
}
