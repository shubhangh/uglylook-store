'use client'

import React from 'react'
import { useAuth } from '@payloadcms/ui'
import { usePathname } from 'next/navigation'

export const Avatar: React.FC = () => {
  const { user } = useAuth()
  const pathname = usePathname()
  const isActive = pathname === '/adm/account'

  // Get avatar URL from user's avatar upload field
  const avatarUrl =
    user &&
    'avatar' in user &&
    user.avatar &&
    typeof user.avatar === 'object' &&
    'url' in user.avatar
      ? (user.avatar.url as string)
      : null

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() || '?'

  const size = 36
  const borderRadius = 5

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt="Account"
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          borderRadius,
          objectFit: 'cover',
          border: isActive
            ? '2px solid var(--theme-text)'
            : '1px solid var(--theme-elevation-200)',
        }}
      />
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
    >
      <rect
        x="0.5"
        y="0.5"
        width={size - 1}
        height={size - 1}
        rx={borderRadius}
        ry={borderRadius}
        fill={isActive ? 'var(--theme-elevation-500)' : 'var(--theme-elevation-50)'}
        stroke={isActive ? 'var(--theme-text)' : 'var(--theme-elevation-200)'}
        strokeWidth="1"
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fill={isActive ? 'var(--theme-text)' : 'var(--theme-elevation-400)'}
        fontSize="13"
        fontWeight="600"
        fontFamily="var(--font-body, sans-serif)"
      >
        {initials}
      </text>
    </svg>
  )
}
