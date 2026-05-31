'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLivePreview } from '@payloadcms/live-preview-react'
import { getClientSideURL } from '@/utilities/getURL'
import type { AnnouncementBar } from '@/payload-types'
import styles from './announcement-bar.module.css'

const DISMISS_KEY = 'ul-announcement-dismissed'

const BG_MAP: Record<string, string> = {
  olive: '#5A6242',
  petrol: '#264A4F',
  bone: '#D9D2C2',
  black: '#111111',
}

type Props = { data: AnnouncementBar }

export function AnnouncementBarClient({ data: initialData }: Props) {
  const { data } = useLivePreview<AnnouncementBar>({
    initialData,
    serverURL: getClientSideURL(),
    depth: 1,
  })

  const [dismissed, setDismissed] = useState(true) // start hidden to avoid flash

  useEffect(() => {
    if (!data.enabled) {
      setDismissed(true)
      return
    }
    if (data.dismissible) {
      const stored = localStorage.getItem(DISMISS_KEY)
      setDismissed(stored === data.text) // dismiss resets when text changes
    } else {
      setDismissed(false)
    }
  }, [data.enabled, data.dismissible, data.text])

  if (!data.enabled || dismissed) return null

  const bg = BG_MAP[data.backgroundColor || 'olive'] || BG_MAP.olive
  const fg = data.textColor === 'dark' ? '#111111' : '#F5F2EC'

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, data.text)
    setDismissed(true)
  }

  const content = (
    <span className={styles.text}>{data.text}</span>
  )

  return (
    <div className={styles.bar} style={{ backgroundColor: bg, color: fg }}>
      <div className={styles.inner}>
        {data.link ? (
          <Link href={data.link} className={styles.link} style={{ color: fg }}>
            {content}
          </Link>
        ) : (
          content
        )}
        {data.dismissible && (
          <button
            className={styles.close}
            onClick={handleDismiss}
            aria-label="Dismiss announcement"
            style={{ color: fg }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
