'use client'

import React from 'react'

export const BulkReads: React.FC = () => {
  return (
    <div style={{ padding: 24, maxWidth: 1400, fontSize: 15 }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 600 }}>
        Bulk Reads Upload
      </h3>
      <p style={{ margin: 0, color: 'var(--theme-elevation-500)', fontSize: '0.9375rem' }}>
        Bulk upload blog posts and reads content. Coming soon.
      </p>
      <div
        style={{
          marginTop: 32,
          padding: '48px 24px',
          border: '1px dashed var(--theme-elevation-200)',
          borderRadius: 8,
          textAlign: 'center',
          color: 'var(--theme-elevation-400)',
          fontSize: '0.9375rem',
        }}
      >
        This feature is under development.
      </div>
    </div>
  )
}
