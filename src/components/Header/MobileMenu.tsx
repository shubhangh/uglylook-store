'use client'

import type { Header } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/providers/Auth'
import { useTheme } from '@/providers/Theme'
import { Sun, Moon } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import styles from './mobile-menu.module.css'

interface Props {
  menu: Header['navItems']
}

export function MobileMenu({ menu }: Props) {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) setIsOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isOpen])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname, searchParams])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <>
      <button
        className={`${styles.hamburger} ${isOpen ? styles.hamburgerOpen : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        style={isOpen ? { zIndex: 51, position: 'fixed', top: 20, right: 24 } : undefined}
      >
        <span className={styles.hamburgerLine} />
        <span className={styles.hamburgerLine} />
        <span className={styles.hamburgerLine} />
      </button>

      {isOpen && (
        <div className={styles.overlay} role="dialog" aria-label="Mobile menu">

          <nav className={styles.mobileNav}>
            <Link href="/" className={styles.mobileNavLink} onClick={() => setIsOpen(false)}>
              Home
            </Link>
            {menu?.map((item) => (
              <span key={item.id} onClick={() => setIsOpen(false)}>
                <CMSLink
                  {...item.link}
                  className={styles.mobileNavLink}
                  appearance="link"
                />
              </span>
            ))}
            {user && (
              <>
                <Link href="/orders" className={styles.mobileNavLink} onClick={() => setIsOpen(false)}>
                  Orders
                </Link>
                <Link href="/logout" className={styles.mobileNavLink} onClick={() => setIsOpen(false)}>
                  Log out
                </Link>
              </>
            )}
          </nav>

          <button className={styles.mobileThemeToggle} onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
      )}
    </>
  )
}
