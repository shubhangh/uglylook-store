'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from '@payloadcms/ui'

import './BackfillHashButton.scss'

export const BackfillHashButton: React.FC = () => {
  const [unhashed, setUnhashed] = useState<number | null>(null)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [portalTarget, setPortalTarget] = useState<Element | null>(null)

  // Find the title actions container to portal into
  useEffect(() => {
    const findTarget = () => {
      const target = document.querySelector('.list-header__title-actions')
      if (target) setPortalTarget(target)
    }
    findTarget()
    // Retry in case DOM isn't ready yet
    const timer = setTimeout(findTarget, 200)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    fetch('/api/media?where[imageHash][exists]=false&limit=0', {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => setUnhashed(data.totalDocs ?? 0))
      .catch(() => setUnhashed(0))
  }, [])

  const handleBackfill = useCallback(async () => {
    if (running || unhashed === 0) return

    setRunning(true)
    setProgress({ current: 0, total: 0 })

    try {
      const res = await fetch(
        '/api/media?where[imageHash][exists]=false&limit=500&select[filename]=true',
        { credentials: 'include' },
      )
      const data = await res.json()
      const docs = data.docs || []

      if (docs.length === 0) {
        toast.info('All media already have image hashes.')
        setRunning(false)
        setUnhashed(0)
        return
      }

      setProgress({ current: 0, total: docs.length })

      let hashed = 0
      let failed = 0

      for (const doc of docs) {
        try {
          const fileUrl = doc.url || `/api/media/file/${doc.filename}`
          const fileRes = await fetch(fileUrl)
          if (!fileRes.ok) throw new Error('File not found')

          const buffer = await fileRes.arrayBuffer()
          const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
          const hashArray = Array.from(new Uint8Array(hashBuffer))
          const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

          const updateRes = await fetch(`/api/media/${doc.id}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageHash: hash }),
          })

          if (updateRes.ok) hashed++
          else failed++
        } catch {
          failed++
        }

        setProgress({ current: hashed + failed, total: docs.length })
      }

      setUnhashed(0)
      toast.success(
        `Backfill complete. Hashed: ${hashed}${failed > 0 ? `, Failed: ${failed}` : ''}`,
      )
    } catch {
      toast.error('Backfill failed')
    }

    setRunning(false)
  }, [running, unhashed])

  const isDisabled = running || unhashed === null || unhashed === 0

  const button = (
    <button
      className={`media-backfill-btn ${isDisabled ? 'media-backfill-btn--disabled' : ''}`}
      onClick={handleBackfill}
      disabled={isDisabled}
      title={
        unhashed === 0
          ? 'All media have image hashes'
          : running
            ? `Hashing ${progress.current}/${progress.total}...`
            : `${unhashed} media missing hash`
      }
    >
      {running
        ? `Hashing ${progress.current}/${progress.total}`
        : unhashed && unhashed > 0
          ? `Backfill Hashes (${unhashed})`
          : 'All Hashed'}
    </button>
  )

  // Portal into the title actions row if available, otherwise render nothing
  // (the beforeListTable slot renders below the header, which we don't want)
  if (portalTarget) {
    return createPortal(button, portalTarget)
  }

  return null
}
