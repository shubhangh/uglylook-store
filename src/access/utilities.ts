import type { User } from '@/payload-types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const checkRole = (allRoles: User['roles'] = [], user?: any): boolean => {
  if (user && allRoles && Array.isArray(user.roles)) {
    return allRoles.some((role) => {
      return (user.roles as string[]).some((individualRole) => {
        return individualRole === role
      })
    })
  }

  return false
}
