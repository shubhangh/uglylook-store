'use client'

import type { Media as MediaType, Product } from '@/payload-types'

import { Media } from '@/components/Media'
import { GridTileImage } from '@/components/Grid/tile'
import { useSearchParams } from 'next/navigation'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

import { Carousel, CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { DefaultDocumentIDType } from 'payload'

type Props = {
  gallery: NonNullable<Product['gallery']>
}

export const Gallery: React.FC<Props> = ({ gallery }) => {
  const searchParams = useSearchParams()
  const [current, setCurrent] = useState(0)
  const [api, setApi] = useState<CarouselApi>()
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    if (!api) return
  }, [api])

  useEffect(() => {
    const values = Array.from(searchParams.values())
    if (values && api) {
      const index = gallery.findIndex((item) => {
        if (!item.variantOption) return false
        let variantID: DefaultDocumentIDType
        if (typeof item.variantOption === 'object') {
          variantID = item.variantOption.id
        } else variantID = item.variantOption
        return Boolean(values.find((value) => value === String(variantID)))
      })
      if (index !== -1) {
        setCurrent(index)
        api.scrollTo(index, true)
      }
    }
  }, [searchParams, api, gallery])

  return (
    <div>
      {/* Main image with cross-fade */}
      <div
        className="relative w-full overflow-hidden mb-8 aspect-square cursor-zoom-in"
        onClick={() => setLightboxOpen(true)}
      >
        {gallery.map((item, i) => (
          <div
            key={typeof item.image === 'object' ? item.image.id : i}
            className="absolute inset-0 transition-opacity duration-300"
            style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? 'auto' : 'none' }}
          >
            <Media
              resource={item.image}
              className="w-full h-full"
              imgClassName="w-full h-full object-cover rounded-lg"
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      {/* Thumbnail carousel */}
      <Carousel setApi={setApi} className="w-full" opts={{ align: 'start', loop: false }}>
        <CarouselContent>
          {gallery.map((item, i) => {
            if (typeof item.image !== 'object') return null
            return (
              <CarouselItem
                className="basis-1/5"
                key={`${item.image.id}-${i}`}
                onClick={() => setCurrent(i)}
              >
                <GridTileImage active={i === current} media={item.image} />
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>

      {/* Lightbox */}
      {lightboxOpen && (
        <GalleryLightbox
          gallery={gallery}
          current={current}
          setCurrent={setCurrent}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  )
}

function GalleryLightbox({
  gallery,
  current,
  setCurrent,
  onClose,
}: {
  gallery: Props['gallery']
  current: number
  setCurrent: (i: number) => void
  onClose: () => void
}) {
  const touchStartX = useRef(0)
  const len = gallery.length

  const goPrev = useCallback(() => setCurrent((current - 1 + len) % len), [current, len, setCurrent])
  const goNext = useCallback(() => setCurrent((current + 1) % len), [current, len, setCurrent])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose, goNext, goPrev])

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
      onTouchEnd={(e) => {
        const delta = e.changedTouches[0].clientX - touchStartX.current
        if (Math.abs(delta) > 50) {
          delta > 0 ? goPrev() : goNext()
        }
      }}
    >
      <button
        className="absolute top-4 right-4 text-white/70 hover:text-white z-10 p-2"
        onClick={onClose}
        aria-label="Close lightbox"
      >
        <X size={28} />
      </button>

      {len > 1 && (
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white z-10 p-2"
          onClick={(e) => { e.stopPropagation(); goPrev() }}
          aria-label="Previous image"
        >
          <ChevronLeft size={32} />
        </button>
      )}

      <div className="max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <Media
          resource={gallery[current].image}
          imgClassName="max-w-[90vw] max-h-[90vh] object-contain"
        />
      </div>

      {len > 1 && (
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white z-10 p-2"
          onClick={(e) => { e.stopPropagation(); goNext() }}
          aria-label="Next image"
        >
          <ChevronRight size={32} />
        </button>
      )}

      <span className="absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-xs text-white/40 tracking-widest">
        {current + 1} / {len}
      </span>
    </div>,
    document.body,
  )
}
