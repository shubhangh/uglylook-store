'use client'

import React from 'react'

type StepStatus = 'active' | 'completed' | 'pending'

type Props = {
  step: number
  title: string
  summary?: string
  status: StepStatus
  onExpand?: () => void
  onEdit?: () => void
  onGoBack?: () => void
  children: React.ReactNode
}

export const StepAccordion: React.FC<Props> = ({
  step,
  title,
  summary,
  status,
  onExpand,
  onEdit,
  onGoBack,
  children,
}) => {
  return (
    <div
      className={`bulk-upload__step bulk-upload__step--${status}`}
    >
      <div
        className="bulk-upload__step-header"
        onClick={status === 'completed' && onExpand ? onExpand : undefined}
      >
        <div className="bulk-upload__step-indicator">
          {status === 'completed' ? (
            <span className="bulk-upload__step-check">✓</span>
          ) : (
            <span className="bulk-upload__step-number">{step}</span>
          )}
        </div>
        <div className="bulk-upload__step-title-area">
          <h4 className="bulk-upload__step-title">{title}</h4>
          {status === 'completed' && summary && (
            <p className="bulk-upload__step-summary">{summary}</p>
          )}
        </div>
        <div className="bulk-upload__step-actions">
          {status === 'completed' && onEdit && (
            <button
              className="bulk-upload__btn bulk-upload__btn--small"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
            >
              Edit
            </button>
          )}
          {status === 'active' && onGoBack && (
            <button
              className="bulk-upload__btn bulk-upload__btn--small"
              onClick={(e) => {
                e.stopPropagation()
                onGoBack()
              }}
            >
              ← Back
            </button>
          )}
        </div>
      </div>
      {status === 'active' && (
        <div className="bulk-upload__step-content">
          {children}
        </div>
      )}
    </div>
  )
}
