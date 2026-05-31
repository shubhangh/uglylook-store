'use client'

import { useState } from 'react'
import styles from './newsletter-cta.module.css'

export function NewsletterCTA() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    try {
      await fetch('/next/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'newsletter-cta' }),
      })
    } catch { /* ignore */ }
    setSubscribed(true)
    setEmail('')
  }

  return (
    <section className={styles.section}>
      <div className={`${styles.inner} container`}>
        <div className={styles.content}>
          <span className={styles.label}>DROP / 00</span>
          <h2 className={styles.heading}>
            Get notified.
            <br />
            No spam. Just drops.
          </h2>
          <p className={styles.subtext}>
            New pieces when they exist. Retired pieces when they don&rsquo;t.
            We email like adults.
          </p>

          {subscribed ? (
            <p className={styles.confirmation}>
              Done. No welcome email. Just drops when they drop.
            </p>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className={styles.input}
                aria-label="Email address"
              />
              <button type="submit" className={styles.button}>
                Subscribe
              </button>
            </form>
          )}
        </div>

        <div className={styles.decorative} aria-hidden="true">
          <div className={styles.silhouette}>
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.shape1}>
              {/* Starburst: 12 radiating lines + 2 concentric circles */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30 * Math.PI) / 180
                return (
                  <line
                    key={i}
                    x1={100 + 30 * Math.cos(angle)}
                    y1={100 + 30 * Math.sin(angle)}
                    x2={100 + 95 * Math.cos(angle)}
                    y2={100 + 95 * Math.sin(angle)}
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                )
              })}
              <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <circle cx="100" cy="100" r="70" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
          </div>
          <div className={styles.silhouette2}>
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.shape2}>
              {/* Concentric offset rings */}
              <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <circle cx="105" cy="95" r="65" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <circle cx="110" cy="90" r="40" stroke="currentColor" strokeWidth="1" fill="none" />
              <circle cx="115" cy="85" r="15" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}
