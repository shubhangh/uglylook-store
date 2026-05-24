'use client'

import React from 'react'
import { usePathname } from 'next/navigation'

export const DashboardLink: React.FC = () => {
  const pathname = usePathname()
  const isActive = pathname === '/adm' || pathname === '/adm/'

  return (
    <a
      href="/adm"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        marginBottom: '4px',
        fontSize: '14px',
        fontWeight: 500,
        color: isActive ? 'var(--theme-text)' : 'var(--theme-elevation-600)',
        textDecoration: 'none',
        borderRadius: '4px',
        backgroundColor: isActive ? 'var(--theme-elevation-150)' : 'transparent',
        transition: 'background-color 0.15s, color 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'var(--theme-elevation-100)'
          e.currentTarget.style.color = 'var(--theme-text)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = 'var(--theme-elevation-600)'
        }
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
      Dashboard
    </a>
  )
}
