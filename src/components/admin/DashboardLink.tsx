'use client'

import React, { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// Sidebar nav group ordering
const GROUP_ORDER = ['site', 'globals', 'ecommerce', 'printify', 'content', 'team', 'api keys', 'automate', 'mcp']

function reorderNavGroups() {
  const navWrap = document.querySelector('.nav__wrap')
  if (!navWrap) return

  const groups = Array.from(navWrap.querySelectorAll(':scope > .nav-group'))
  const controls = navWrap.querySelector(':scope > .nav__controls')
  if (groups.length < 2) return

  const sorted = [...groups].sort((a, b) => {
    const aLabel = a.querySelector('.nav-group__toggle')?.textContent?.trim().toLowerCase() || ''
    const bLabel = b.querySelector('.nav-group__toggle')?.textContent?.trim().toLowerCase() || ''
    const aIdx = GROUP_ORDER.findIndex((g) => aLabel.includes(g))
    const bIdx = GROUP_ORDER.findIndex((g) => bLabel.includes(g))
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx)
  })

  for (const group of sorted) {
    navWrap.appendChild(group)
  }
  if (controls) {
    navWrap.appendChild(controls)
  }
}

export const DashboardLink: React.FC = () => {
  const pathname = usePathname()
  const isActive = pathname === '/adm' || pathname === '/adm/'

  // Reorder sidebar nav groups on mount
  useEffect(() => {
    const timer = setTimeout(reorderNavGroups, 100)
    return () => clearTimeout(timer)
  }, [])

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
