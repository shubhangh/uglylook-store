import type { Access } from 'payload'
import { isTeamMember } from '@/access/utilities'

/**
 * Team members: full access.
 * Customers: only documents where customer field matches their ID.
 */
export const adminOrCustomerOwner: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isTeamMember(user)) return true
  return { customer: { equals: user.id } }
}
