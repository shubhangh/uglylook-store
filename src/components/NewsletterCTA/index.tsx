'use client'

import { useState } from 'react'
import styles from './newsletter-cta.module.css'

export function NewsletterCTA() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubscribed(true)
      setEmail('')
    }
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
            <svg viewBox="0 0 200 280" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.tee}>
              <path d="M60 0 L0 40 L20 60 L40 50 L40 280 L160 280 L160 50 L180 60 L200 40 L140 0 Z" fill="currentColor" />
            </svg>
          </div>
          <div className={styles.silhouette2}>
            <svg viewBox="0 0 200 320" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.hoodie}>
              <path d="M70 0 L60 20 Q80 30 100 30 Q120 30 140 20 L130 0 Z" fill="currentColor" />
              <path d="M60 20 L0 60 L20 80 L40 70 L40 320 L160 320 L160 70 L180 80 L200 60 L140 20 Z" fill="currentColor" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}
