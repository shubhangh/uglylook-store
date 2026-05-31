import type { Access } from 'payload'
import { isOwnerOrAdmin } from '@/access/utilities'

/** Allows access for owner and admin roles only. */
export const isAdmin: Access = ({ req }) => {
  return isOwnerOrAdmin(req.user)
}
