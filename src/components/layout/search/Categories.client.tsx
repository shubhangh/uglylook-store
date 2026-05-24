'use client'
import React from 'react'

import { Category } from '@/payload-types'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import clsx from 'clsx'

type Props = {
  category: Category
}

export const CategoryItem: React.FC<Props> = ({ category }) => {
  const pathname = usePathname()
  const href = `/shop/${category.slug}`
  const isActive = pathname === href

  return (
    <Link
      href={href}
      className={clsx('hover:cursor-pointer hover:text-foreground transition-colors', {
        'underline text-foreground': isActive,
        'text-muted-foreground': !isActive,
      })}
    >
      {category.title}
    </Link>
  )
}
