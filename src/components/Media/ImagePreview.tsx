'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDocumentInfo } from '@payloadcms/ui'

import './ImagePreview.scss'

export const ImagePreview: React.FC = () => {
  const { id } = useDocumentInfo()
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/media/${id}?select[filename]=true&select[mimeType]=true&select[url]=true`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((doc) => {
        if (doc.url) {
          setImgSrc(doc.url)
        } else if (doc.filename) {
          setImgSrc(`/media/${doc.filename}`)
        }
      })
      .catch(() => setImgError(true))
  }, [id])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
    },
    [],
  )

  useEffect(() => {
    if (lightboxOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = ''
      }
    }
  }, [lightboxOpen, handleKeyDown])

  if (!id || imgError) return null

  return (
    <>
      <div className="media-preview">
        <div className="media-preview__label">Preview</div>
        {imgSrc ? (
          <img
            src={imgSrc}
            alt="Media preview"
            className="media-preview__image"
            onClick={() => setLightboxOpen(true)}
          />
        ) : (
          <div className="media-preview__loading">Loading...</div>
        )}
        {imgSrc && (
          <div className="media-preview__hint">Click to enlarge</div>
        )}
      </div>

      {/* Lightbox — rendered via portal to document.body to escape all stacking contexts */}
      {lightboxOpen && imgSrc && createPortal(
        <div
          className="media-lightbox"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="media-lightbox__close">&times;</div>
          <img
            src={imgSrc}
            alt="Full size preview"
            className="media-lightbox__image"
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body,
      )}
    </>
  )
}
