'use client'
import { Cart } from '@/components/Cart'
import { OpenCartButton } from '@/components/Cart/OpenCart'
import Link from 'next/link'
import React, { Suspense } from 'react'

import { MobileMenu } from './MobileMenu'
import type { Header } from '@/payload-types'

import { LogoIcon } from '@/components/icons/logo'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/providers/Theme'
import styles from './header.module.css'

type Props = {
  header: Header
}

export function HeaderClient({ header }: Props) {
  const allItems = header.navItems || []
  const menu = allItems.filter((item) => (item as any).visible ?? true)
  const pathname = usePathname()
  const { theme } = useTheme()

  const showLogo = (header as any).showLogo ?? true
  const showWordmark = (header as any).showWordmark ?? true
  const showNav = (header as any).showNav ?? true
  const showCart = (header as any).showCart ?? true

  return (
    <header className={styles.header}>
      <div className={`${styles.inner} container`}>
        {/* Left: hamburger (mobile) + lockup */}
        <div className={styles.leftGroup}>
          {showNav && (
            <div className={styles.mobileOnly}>
              <Suspense fallback={null}>
                <MobileMenu menu={menu} />
              </Suspense>
            </div>
          )}

          <Link href="/" className={styles.lockup}>
            {showLogo && (
              <LogoIcon
                variant={theme === 'light' ? 'light' : 'dark'}
                className={styles.icon}
              />
            )}
            {showWordmark && (
              <img
                src={theme === 'light' ? '/assets/wordmark-dark.svg' : '/assets/wordmark-light.svg'}
                alt="UglyLook"
                className={styles.wordmark}
              />
            )}
          </Link>
        </div>

        {/* Center: desktop nav */}
        {showNav && (
          <nav className={styles.nav} aria-label="Main navigation">
            {menu.map((item) => {
              const url = item.link.url || '/'
              const label = item.link.label || ''
              const isActive = url !== '/' && pathname.startsWith(url)

              return (
                <Link
                  key={item.id}
                  href={url}
                  className={`${styles.navLink}${isActive ? ` ${styles.active}` : ''}`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        )}

        {/* Right: cart */}
        {showCart && (
          <div className={styles.actions}>
            <Suspense fallback={<OpenCartButton />}>
              <Cart />
            </Suspense>
          </div>
        )}
      </div>
    </header>
  )
}
