import type { CollectionBeforeChangeHook } from 'payload'
import { isOwnerOrAdmin } from '@/access/utilities'

/**
 * Approval workflow hook for Products and Posts.
 *
 * Rules:
 * - Owner/admin: can publish directly, can approve/reject, bypass all checks
 * - Manager/editor: cannot publish unless approvalStatus is 'approved'
 * - Manager/editor editing published content: resets to draft, requires fresh approval
 * - Manager/editor: can only set approvalStatus to 'draft' or 'pending_review'
 * - Setting to 'pending_review' auto-sets submittedForReviewAt
 * - Setting to 'approved'/'rejected' auto-sets reviewedBy to current user
 */
export const approvalWorkflow: CollectionBeforeChangeHook = ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  const user = req.user as any
  if (!user) return data

  const isAdmin = isOwnerOrAdmin(user)
  const currentApproval = data.approvalStatus || originalDoc?.approvalStatus || 'draft'
  const previousApproval = originalDoc?.approvalStatus || 'draft'
  const wasPublished = originalDoc?._status === 'published'

  // ── Owner/Admin: full control ──
  if (isAdmin) {
    if (currentApproval === 'approved' && previousApproval !== 'approved') {
      data.reviewedBy = user.id
    }
    if (currentApproval === 'rejected' && previousApproval !== 'rejected') {
      data.reviewedBy = user.id
    }
    // Admin can publish freely — no restrictions
    return data
  }

  // ── Manager/Editor: restricted ──

  // Block manager/editor from setting approvalStatus to 'approved' or 'rejected'
  if (currentApproval === 'approved' || currentApproval === 'rejected') {
    data.approvalStatus = previousApproval
  }

  // If editing already-published content: reset approval, revert to draft
  // This ensures every change to live content requires fresh approval
  if (operation === 'update' && wasPublished) {
    // Check if any content fields actually changed (not just approvalStatus)
    const contentChanged = hasContentChanged(data, originalDoc)

    if (contentChanged) {
      // Revert to draft — published version stays live until re-approved
      data._status = 'draft'
      data.approvalStatus = 'pending_review'
      data.submittedForReviewAt = new Date().toISOString()
      data.reviewedBy = null
      data.reviewNotes = null
      return data
    }
  }

  // When submitting for review, set the timestamp
  if (
    data.approvalStatus === 'pending_review' &&
    previousApproval !== 'pending_review'
  ) {
    data.submittedForReviewAt = new Date().toISOString()
  }

  // Block publish unless approved
  if (data._status === 'published') {
    const effectiveApproval = data.approvalStatus || previousApproval
    if (effectiveApproval !== 'approved') {
      // Revert to draft — cannot publish without approval
      data._status = 'draft'

      // Auto-submit for review
      if (effectiveApproval === 'draft') {
        data.approvalStatus = 'pending_review'
        data.submittedForReviewAt = new Date().toISOString()
      }
    }
  }

  // Clear review notes when re-submitting after rejection
  if (
    data.approvalStatus === 'pending_review' &&
    previousApproval === 'rejected'
  ) {
    data.reviewNotes = null
    data.reviewedBy = null
  }

  return data
}

/**
 * Check if content fields changed (ignore meta/approval fields).
 * This avoids resetting approval when only approvalStatus itself changes.
 */
function hasContentChanged(data: any, originalDoc: any): boolean {
  if (!originalDoc) return false

  const contentFields = [
    'title',
    'slug',
    'description',
    'content',
    'excerpt',
    'gallery',
    'categories',
    'priceInUSD',
    'priceInUSDEnabled',
    'inventory',
    'enableVariants',
    'coverImage',
    'author',
    'layout',
    // Coupon fields
    'code',
    'type',
    'value',
    'minOrderAmount',
    'maxDiscountAmount',
    'maxUses',
    'maxUsesPerCustomer',
    'startsAt',
    'expiresAt',
    'endsAt',
    'applicableTo',
    'products',
    'excludeCategories',
    'excludeProducts',
    'stackable',
    'firstOrderOnly',
    // Offer fields
    'buyQuantity',
    'getQuantity',
    'bundleProducts',
    'bundlePrice',
    'showBanner',
    'bannerText',
    'bannerPosition',
    'showBadge',
    'badgeText',
    'priority',
    'autoApply',
  ]

  for (const field of contentFields) {
    if (data[field] !== undefined) {
      const newVal = JSON.stringify(data[field])
      const oldVal = JSON.stringify(originalDoc[field])
      if (newVal !== oldVal) return true
    }
  }

  return false
}
