'use client'

import clsx from 'clsx'
import React from 'react'

export function LogoIcon({
  variant = 'dark',
  ...props
}: React.ComponentProps<'img'> & { variant?: 'dark' | 'light' }) {
  const src = variant === 'light' ? '/assets/icon-light.svg' : '/assets/icon-dark.svg'
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="UglyLook icon"
      {...props}
      className={clsx('rounded-[5px]', props.className)}
    />
  )
}
