import type { Access } from 'payload'
import { isOwnerOrAdmin } from '@/access/utilities'

/**
 * Owner/admin: full access to all docs.
 * Others: only their own document (id match).
 */
export const adminOrSelf: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isOwnerOrAdmin(user)) return true
  return { id: { equals: user.id } }
}
