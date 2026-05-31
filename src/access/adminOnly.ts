import type { Access } from 'payload'
import { isAtLeastManager } from '@/access/utilities'

/** Allows access for owner, admin, and manager roles. */
export const adminOnly: Access = ({ req: { user } }) => {
  return isAtLeastManager(user)
}
