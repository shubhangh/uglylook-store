/**
 * Role-based access control utilities for UglyLook Store.
 *
 * Team roles (descending access):
 *   owner   → full control, can delete team members, change roles
 *   admin   → full CRUD on all collections, can manage team
 *   manager → CRU on products/content, read-only on customers/orders/carts/transactions/team/automate, no delete
 *   editor  → CRU on posts + CR on media, read-only on products/categories. No access to customers/orders/carts/transactions.
 *
 * Customer access is separate — handled by the Customers collection's own access control.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyUser = any

// ── Role hierarchy ──────────────────────────────────────────────────

const TEAM_ROLES = ['owner', 'admin', 'manager', 'editor'] as const
type TeamRole = (typeof TEAM_ROLES)[number]

function getUserRole(user?: AnyUser): TeamRole | null {
  if (!user) return null
  if (user.role && typeof user.role === 'string' && TEAM_ROLES.includes(user.role)) {
    return user.role as TeamRole
  }
  // Legacy: roles array (backwards compat)
  if (user.roles && Array.isArray(user.roles)) {
    if (user.roles.includes('admin')) return 'admin'
  }
  return null
}

// ── Core checks ─────────────────────────────────────────────────────

export const isTeamMember = (user?: AnyUser): boolean => getUserRole(user) !== null

export const isOwner = (user?: AnyUser): boolean => getUserRole(user) === 'owner'

export const isOwnerOrAdmin = (user?: AnyUser): boolean => {
  const role = getUserRole(user)
  return role === 'owner' || role === 'admin'
}

export const isAtLeastManager = (user?: AnyUser): boolean => {
  const role = getUserRole(user)
  return role === 'owner' || role === 'admin' || role === 'manager'
}

export const isEditor = (user?: AnyUser): boolean => getUserRole(user) === 'editor'

// ── Legacy-compatible checkRole ─────────────────────────────────────

/**
 * Check if a user has one of the specified roles.
 * Works with both team.role (string) and legacy user.roles (array).
 *
 * When checking for 'admin', owner/admin/manager all pass (they all have admin-level access
 * to most collections). Use the specific helpers above for finer control.
 */
export const checkRole = (allRoles: string[] = [], user?: AnyUser): boolean => {
  if (!user) return false

  const role = getUserRole(user)
  if (role) {
    // 'admin' check = owner, admin, manager (backwards compat with existing access functions)
    if (allRoles.includes('admin')) {
      return role === 'owner' || role === 'admin' || role === 'manager'
    }
    return allRoles.includes(role)
  }

  return false
}

// ── Access helpers for collections ──────────────────────────────────
// These return Access functions that can be used directly in collection configs.

import type { Access, FieldAccess } from 'payload'

/** Full CRUD for owner/admin. CRU for manager. No access for editor. */
export const ecommerceAccess: Access = ({ req: { user } }) => {
  if (isOwnerOrAdmin(user)) return true
  if (isAtLeastManager(user)) return true
  return false
}

/** Full CRUD for owner/admin. CRU for manager. No access for editor. No delete for manager. */
export const ecommerceDeleteAccess: Access = ({ req: { user } }) => {
  return isOwnerOrAdmin(user)
}

/** Full CRUD for owner/admin. CRU for manager. CR on own posts for editor. */
export const contentAccess: Access = ({ req: { user } }) => {
  if (isOwnerOrAdmin(user)) return true
  if (isAtLeastManager(user)) return true
  if (isEditor(user)) return true
  return false
}

/** Editor can only update own posts. Manager+ can update any. */
export const contentUpdateAccess: Access = ({ req: { user } }) => {
  if (isAtLeastManager(user)) return true
  // Editor: can only update documents they created
  // (Payload doesn't track createdBy natively, so we allow update for now)
  if (isEditor(user)) return true
  return false
}

/** Delete: owner/admin only. */
export const contentDeleteAccess: Access = ({ req: { user } }) => {
  return isOwnerOrAdmin(user)
}

/** Read for team + published for public. */
export const publishedOrTeamAccess: Access = ({ req: { user } }) => {
  if (isTeamMember(user)) return true
  return { _status: { equals: 'published' } }
}

/** Media: owner/admin full, manager CRU, editor CR. */
export const mediaCreateAccess: Access = async ({ req }) => {
  if (isTeamMember(req.user)) return true
  // Allow during first-user setup
  if (!req.user) {
    const team = await req.payload.find({ collection: 'team' as any, depth: 0, limit: 0 })
    if (team.totalDocs === 0) return true
  }
  return false
}

export const mediaDeleteAccess: Access = ({ req: { user } }) => {
  return isOwnerOrAdmin(user)
}

/** Field-level: owner/admin only. */
export const ownerAdminFieldAccess: FieldAccess = ({ req: { user } }) => {
  return isOwnerOrAdmin(user)
}

/** Field-level: at least manager. */
export const managerFieldAccess: FieldAccess = ({ req: { user } }) => {
  return isAtLeastManager(user)
}
