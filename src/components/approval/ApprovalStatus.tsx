'use client'

import React from 'react'
import { useAuth, useDocumentInfo, useFormFields } from '@payloadcms/ui'

import './ApprovalStatus.scss'

/**
 * Sidebar component showing approval status with contextual actions.
 * - Manager/editor: shows status + "Submit for Review" button
 * - Admin/owner: shows status + approve/reject buttons
 * - Rejected: shows rejection banner with reviewer notes
 */
export const ApprovalStatus: React.FC = () => {
  const { user } = useAuth()
  const { id } = useDocumentInfo()
  const u = user as any

  const approvalStatus = useFormFields(([fields]) => fields?.approvalStatus?.value as string)
  const reviewNotes = useFormFields(([fields]) => fields?.reviewNotes?.value as string)
  const reviewedBy = useFormFields(([fields]) => fields?.reviewedBy?.value)

  if (!id) return null // Don't show on create

  const isAdmin = u?.role && ['owner', 'admin'].includes(u.role)
  const status = approvalStatus || 'draft'

  return (
    <div className="approval-status">
      <div className="approval-status__label">Approval Status</div>

      <div className={`approval-status__badge approval-status__badge--${status}`}>
        {status === 'draft' && 'Draft'}
        {status === 'pending_review' && 'Pending Review'}
        {status === 'approved' && 'Approved'}
        {status === 'rejected' && 'Rejected'}
      </div>

      {/* Rejection banner */}
      {status === 'rejected' && reviewNotes && (
        <div className="approval-status__rejection">
          <div className="approval-status__rejection-label">Reviewer feedback:</div>
          <p>{reviewNotes}</p>
        </div>
      )}

      {/* Pending review info */}
      {status === 'pending_review' && !isAdmin && (
        <p className="approval-status__hint">
          Waiting for admin/owner to review and approve.
        </p>
      )}

      {/* Approved — ready to publish */}
      {status === 'approved' && !isAdmin && (
        <p className="approval-status__hint approval-status__hint--success">
          Approved. You can now publish this content.
        </p>
      )}

      {/* Draft — submit for review hint for manager/editor */}
      {status === 'draft' && !isAdmin && (
        <p className="approval-status__hint">
          Set "Approval Status" to "Pending Review" and save to submit for admin review.
        </p>
      )}

      {/* Admin: pending review indicator */}
      {status === 'pending_review' && isAdmin && (
        <p className="approval-status__hint">
          Set to "Approved" or "Rejected" (add notes) and save.
        </p>
      )}
    </div>
  )
}
