'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'

export function AllCategoryLink() {
  const pathname = usePathname()
  const isActive = pathname === '/shop'

  return (
    <Link
      href="/shop"
      className={clsx('hover:cursor-pointer hover:text-foreground transition-colors', {
        'underline text-foreground': isActive,
        'text-muted-foreground': !isActive,
      })}
    >
      All
    </Link>
  )
}
