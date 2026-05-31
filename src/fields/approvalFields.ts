import type { Field } from 'payload'
import { isOwnerOrAdmin } from '@/access/utilities'

/**
 * Shared approval workflow fields for Products and Posts.
 * Add these to any collection that needs publish approval.
 */
export const approvalFields: Field[] = [
  // Visual status component (sidebar)
  {
    name: 'approvalStatusUI',
    type: 'ui',
    admin: {
      position: 'sidebar',
      components: {
        Field: '@/components/approval/ApprovalStatus#ApprovalStatus',
      },
    },
  },
  {
    name: 'approvalStatus',
    type: 'select',
    defaultValue: 'draft',
    options: [
      { label: 'Draft', value: 'draft' },
      { label: 'Pending Review', value: 'pending_review' },
      { label: 'Approved', value: 'approved' },
      { label: 'Rejected', value: 'rejected' },
    ],
    admin: {
      position: 'sidebar',
      description: 'Submit for review to get admin approval before publishing.',
    },
    access: {
      read: () => true,
      update: () => true, // Hook enforces valid transitions
    },
  },
  {
    name: 'reviewedBy',
    type: 'relationship',
    relationTo: 'team',
    admin: {
      position: 'sidebar',
      readOnly: true,
      condition: (data) => !!data?.reviewedBy,
    },
  },
  {
    name: 'reviewNotes',
    type: 'textarea',
    admin: {
      position: 'sidebar',
      description: 'Feedback from the reviewer.',
      condition: (data) =>
        data?.approvalStatus === 'rejected' ||
        data?.approvalStatus === 'approved' ||
        !!data?.reviewNotes,
    },
    access: {
      update: ({ req: { user } }) => isOwnerOrAdmin(user),
    },
  },
  {
    name: 'submittedForReviewAt',
    type: 'date',
    admin: {
      position: 'sidebar',
      readOnly: true,
      condition: (data) =>
        data?.approvalStatus === 'pending_review' ||
        data?.approvalStatus === 'approved' ||
        data?.approvalStatus === 'rejected',
    },
  },
]
