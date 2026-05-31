import type { Access } from 'payload'
import { isTeamMember } from '@/access/utilities'

/** Team members see all (including drafts). Public sees only published. */
export const adminOrPublishedStatus: Access = ({ req: { user } }) => {
  if (isTeamMember(user)) return true
  return { _status: { equals: 'published' } }
}
