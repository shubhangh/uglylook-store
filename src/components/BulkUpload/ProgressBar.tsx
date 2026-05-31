'use client'

import React from 'react'

type Props = {
  current: number
  total: number
  label: string
}

export const ProgressBar: React.FC<Props> = ({ current, total, label }) => {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div className="bulk-upload__progress">
      <div className="bulk-upload__progress-label">
        {label} ({current}/{total})
      </div>
      <div className="bulk-upload__progress-bar">
        <div
          className="bulk-upload__progress-fill"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="bulk-upload__progress-percent">{percent}%</div>
    </div>
  )
}
