'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sun, Moon } from 'lucide-react'
import React from 'react'
import { LogoIcon } from '@/components/icons/logo'
import { useTheme } from '@/providers/Theme'
import { useLivePreview } from '@payloadcms/live-preview-react'
import { getClientSideURL } from '@/utilities/getURL'
import styles from './footer.module.css'
import type { Footer } from '@/payload-types'

type Props = {
  footer: Footer
}

export function FooterClient({ footer: initialData }: Props) {
  const { data: footer } = useLivePreview<Footer>({
    initialData,
    serverURL: getClientSideURL(),
    depth: 1,
  })
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => setMounted(true), [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    try {
      await fetch('/next/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer' }),
      })
      setSubscribed(true)
      setEmail('')
    } catch {
      // still show success to avoid leaking subscription status
      setSubscribed(true)
      setEmail('')
    }
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const showBrand = footer.showBrandColumn ?? true
  const showColumns = footer.showColumns ?? true
  const columns = footer.columns || []
  const showBottom = footer.showBottomBar ?? true

  return (
    <footer className={styles.footer}>
      <div className={`${styles.top} container`}>
        {/* Brand column */}
        {showBrand && (
          <div className={styles.brandCol}>
            {(footer.showLogo ?? true) && (
              <Link href="/" className={styles.lockup}>
                <LogoIcon
                  variant={theme === 'light' ? 'light' : 'dark'}
                  className={styles.icon}
                />
                <img
                  src={theme === 'light' ? '/assets/wordmark-dark.svg' : '/assets/wordmark-light.svg'}
                  alt="UglyLook"
                  className={styles.wordmark}
                />
              </Link>
            )}

            {(footer.showTagline ?? true) && (
              <p className={styles.tagline}>{footer.tagline || 'UGLY IS THE NEW SICK'}</p>
            )}

            {(footer.showEmailSignup ?? true) && (
              <>
                {subscribed ? (
                  <p className={styles.note} style={{ color: 'var(--olive-text, #8B9A6B)' }}>
                    {footer.emailSuccessMessage || 'Got it. No welcome email. Just drops.'}
                  </p>
                ) : (
                  <>
                    <form className={styles.emailForm} onSubmit={handleSubmit}>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={footer.emailPlaceholder || 'your@email.com'}
                        required
                        className={styles.emailInput}
                        aria-label="Email address"
                      />
                      <button type="submit" className={styles.emailBtn}>
                        {footer.emailButtonText || 'Subscribe'}
                      </button>
                    </form>

                    {(footer.showEmailNote ?? true) && (
                      <p className={styles.note}>
                        {footer.emailNote || 'no discount. no welcome series. just drops when they drop.'}
                      </p>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Link columns from CMS */}
        {showColumns &&
          columns
            .filter((col) => col.visible ?? true)
            .map((col) => (
              <div key={col.id || col.title} className={styles.linkCol}>
                <h4 className={styles.colTitle}>{col.title}</h4>
                <ul className={styles.colLinks}>
                  {col.links
                    ?.filter((link) => link.visible ?? true)
                    .map((link) => {
                      const isExternal = link.url.startsWith('mailto:') || link.url.startsWith('http')
                      return (
                        <li key={link.id || link.label}>
                          {isExternal || link.newTab ? (
                            <a
                              href={link.url}
                              className={styles.colLink}
                              {...(link.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                            >
                              {link.label}
                            </a>
                          ) : (
                            <Link href={link.url} className={styles.colLink}>
                              {link.label}
                            </Link>
                          )}
                        </li>
                      )
                    })}
                </ul>
              </div>
            ))}
      </div>

      {/* Bottom bar */}
      {showBottom && (
        <div
          className={`${styles.bottom} container`}
          style={{
            justifyContent:
              footer.themeToggleAlignment === 'left'
                ? 'flex-start'
                : footer.themeToggleAlignment === 'right'
                  ? 'flex-end'
                  : undefined,
          }}
        >
          {(footer.showCopyright ?? true) && (
            <span className={styles.bottomText}>{footer.copyrightText || ''}</span>
          )}

          {(footer.showThemeToggle ?? true) && (
            <button
              className={styles.themeToggle}
              onClick={toggleTheme}
              style={{
                order:
                  footer.themeToggleAlignment === 'left'
                    ? -1
                    : footer.themeToggleAlignment === 'right'
                      ? 1
                      : undefined,
              }}
            >
              {mounted && <><Sun size={12} style={{ display: theme === 'dark' ? 'inline' : 'none' }} /><Moon size={12} style={{ display: theme === 'dark' ? 'none' : 'inline' }} /></>}
              <span suppressHydrationWarning>{mounted ? (theme === 'dark' ? 'Light' : 'Dark') : ''}</span>
            </button>
          )}

          {(footer.showBottomNote ?? true) && (
            <span className={styles.bottomText}>{footer.bottomNote || ''}</span>
          )}
        </div>
      )}
    </footer>
  )
}
