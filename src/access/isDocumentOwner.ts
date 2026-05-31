import type { Access } from 'payload'
import { isOwnerOrAdmin } from '@/access/utilities'

/**
 * Owner/admin: full access.
 * Customers: only documents where customer field matches their ID.
 * Manager/editor/guests: no access (ecommerce write ops restricted to owner/admin).
 */
export const isDocumentOwner: Access = ({ req }) => {
  if (isOwnerOrAdmin(req.user)) return true
  if (req.user?.id) return { customer: { equals: req.user.id } }
  return false
}
