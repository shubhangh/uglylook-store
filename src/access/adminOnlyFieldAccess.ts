import type { FieldAccess } from 'payload'
import { isAtLeastManager } from '@/access/utilities'

/** Field-level access for owner, admin, and manager roles. */
export const adminOnlyFieldAccess: FieldAccess = ({ req: { user } }) => {
  return isAtLeastManager(user)
}
