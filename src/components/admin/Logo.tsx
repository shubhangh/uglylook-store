import React from 'react'

export const Logo: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      <img
        src="/assets/icon-dark.svg"
        alt="UglyLook"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '4px',
        }}
      />
      <span
        style={{
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontSize: '18px',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          textTransform: 'uppercase',
          color: 'var(--theme-text)',
        }}
      >
        UglyLook
      </span>
    </div>
  )
}
