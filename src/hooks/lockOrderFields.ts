import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Prevents modification of core order fields once the order is locked.
 * Locked for ALL roles. Owner/admin must uncheck isLocked first to edit.
 *
 * Lock rules:
 * - source: 'storefront' → locked immediately on create
 * - source: 'manual' → locked once status is finalized (completed/cancelled/refunded)
 * - source: 'api' → locked immediately on create
 *
 * Locked fields (order data): items, customer, customerEmail, shippingAddress, accessToken
 * Always editable: status, fulfillmentStatus, tracking*, fulfillmentNote, notes, isLocked, source
 */

// Fields that become immutable once locked
const LOCKED_ORDER_FIELDS = [
  'items',
  'customer',
  'customerEmail',
  'shippingAddress',
  'accessToken',
]

const LOCKED_TRANSACTION_FIELDS = [
  'items',
  'customer',
  'customerEmail',
  'billingAddress',
  'paymentMethod',
  'order',
  'cart',
]

function isOrderLocked(data: any, originalDoc: any): boolean {
  // Check the isLocked flag on the existing doc
  if (originalDoc?.isLocked) return true

  // On create, storefront and api orders are locked immediately
  if (!originalDoc) {
    const source = data?.source || 'storefront'
    return source !== 'manual'
  }

  return false
}

function isTransactionLocked(data: any, originalDoc: any): boolean {
  if (originalDoc?.isLocked) return true

  // On create, all transactions from storefront/api are locked
  if (!originalDoc) {
    const source = data?.source || 'storefront'
    return source !== 'manual'
  }

  return false
}

function stripLockedFields(
  data: Record<string, any>,
  originalDoc: Record<string, any>,
  lockedFields: string[],
): Record<string, any> {
  const cleaned = { ...data }
  for (const field of lockedFields) {
    if (field in cleaned && originalDoc && field in originalDoc) {
      // Restore original value — silently block the edit
      cleaned[field] = originalDoc[field]
    }
  }
  return cleaned
}

export const lockOrderFields: CollectionBeforeChangeHook = ({
  data,
  originalDoc,
  operation,
  context,
}) => {
  // Internal operations (seed, webhooks, etc.) can bypass
  if (context?.bypassLock) return data

  if (operation === 'create') {
    // Set source if not provided
    if (!data.source) data.source = 'storefront'

    // Auto-lock non-manual orders
    if (data.source !== 'manual') {
      data.isLocked = true
    }

    return data
  }

  if (operation === 'update') {
    // Auto-lock manual orders when status moves to a finalized state
    const finalizedStatuses = ['completed', 'cancelled', 'refunded']
    if (
      originalDoc?.source === 'manual' &&
      !originalDoc?.isLocked &&
      data.status &&
      finalizedStatuses.includes(data.status)
    ) {
      data.isLocked = true
    }

    // If locked, strip protected fields
    if (isOrderLocked(data, originalDoc)) {
      return stripLockedFields(data, originalDoc, LOCKED_ORDER_FIELDS)
    }
  }

  return data
}

export const lockTransactionFields: CollectionBeforeChangeHook = ({
  data,
  originalDoc,
  operation,
  context,
}) => {
  if (context?.bypassLock) return data

  if (operation === 'create') {
    if (!data.source) data.source = 'storefront'
    if (data.source !== 'manual') {
      data.isLocked = true
    }
    return data
  }

  if (operation === 'update') {
    // Auto-lock manual transactions when status is finalized
    const finalizedStatuses = ['succeeded', 'failed', 'refunded']
    if (
      originalDoc?.source === 'manual' &&
      !originalDoc?.isLocked &&
      data.status &&
      finalizedStatuses.includes(data.status)
    ) {
      data.isLocked = true
    }

    if (isTransactionLocked(data, originalDoc)) {
      return stripLockedFields(data, originalDoc, LOCKED_TRANSACTION_FIELDS)
    }
  }

  return data
}
