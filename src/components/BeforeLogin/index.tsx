import React from 'react'

export const BeforeLogin: React.FC = () => {
  return (
    <div
      style={{
        textAlign: 'center',
        marginBottom: '24px',
      }}
    >
      <p
        style={{
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--theme-elevation-500)',
          margin: 0,
        }}
      >
        Store Administration
      </p>
    </div>
  )
}
