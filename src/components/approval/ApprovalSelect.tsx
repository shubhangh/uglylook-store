'use client'

import React from 'react'
import { SelectField, useAuth } from '@payloadcms/ui'
import type { SelectFieldClientComponent } from 'payload'

/**
 * Custom select component for approvalStatus field.
 * Filters options based on user role:
 * - Owner/Admin: all options (draft, pending_review, approved, rejected)
 * - Manager/Editor: only draft and pending_review
 */
export const ApprovalSelect: SelectFieldClientComponent = (props) => {
  const { user } = useAuth()
  const u = user as any
  const isAdmin = u?.role && ['owner', 'admin'].includes(u.role)

  const filteredProps = {
    ...props,
    field: {
      ...props.field,
      options: isAdmin
        ? props.field.options
        : (props.field.options || []).filter((opt: any) => {
            const value = typeof opt === 'string' ? opt : opt.value
            return ['draft', 'pending_review'].includes(value)
          }),
    },
  }

  return <SelectField {...filteredProps} />
}
