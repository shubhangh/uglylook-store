import type { FieldAccess } from 'payload'
import { isTeamMember } from '@/access/utilities'

/** Field-level access for customers only (not team members). */
export const customerOnlyFieldAccess: FieldAccess = ({ req: { user } }) => {
  if (!user) return false
  // If user is a team member, deny (this is customer-only)
  if (isTeamMember(user)) return false
  // Must be a customer (has id but no team role)
  return !!user.id
}
