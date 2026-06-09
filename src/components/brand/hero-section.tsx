'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import styles from './hero-section.module.css'
import Link from 'next/link'
import { Media } from '@/components/Media'
import { getImageDisplayStyles } from '@/utilities/imageDisplay'
import type { Homepage, Product, Media as MediaType } from '@/payload-types'

type CarouselSlide = { image: MediaType; slug: string }

type Props = {
  data: Homepage
  featuredProducts?: Product[]
}

export function HeroSection({ data, featuredProducts }: Props) {
  const line1 = data.heroLine1 || 'Good is over.'
  const line1Words = line1.split(' ')
  const strikeWord = line1Words[0]
  const restOfLine1 = line1Words.slice(1).join(' ')

  const hasHeroImage = data.heroImage && typeof data.heroImage === 'object'

  // Collect hero images + slugs from featured products for auto-sliding carousel
  const carouselSlides: CarouselSlide[] = (featuredProducts || [])
    .map((p) => {
      const hero = p.heroImage && typeof p.heroImage === 'object' ? p.heroImage : null
      const fallback = p.gallery?.[0]?.image && typeof p.gallery[0].image === 'object' ? p.gallery[0].image as MediaType : null
      const image = hero || fallback
      return image ? { image, slug: p.slug || '' } : null
    })
    .filter((s): s is CarouselSlide => s !== null)
    .slice(0, 5)

  const hasCarousel = !hasHeroImage && carouselSlides.length > 0

  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const carouselSpeed = ((data as any).heroCarouselSpeed ?? 3) * 1000
  const stampText = (data as any).heroStampText || 'UGLY ON PURPOSE'
  const tiltDeg = (data as any).heroCarouselTilt ?? -2

  useEffect(() => {
    if (!hasCarousel || carouselSlides.length <= 1 || carouselSpeed === 0 || isPaused) return
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length)
    }, carouselSpeed)
    return () => clearInterval(interval)
  }, [hasCarousel, carouselSlides.length, carouselSpeed, isPaused])

  return (
    <section className={styles.hero}>
      <div className={styles.wrap}>
        <div className={(hasHeroImage || hasCarousel) ? styles.splitRow : undefined}>
          <div>
            <h1 className={styles.headline}>
              <span className={styles.line1}>
                <span className={styles.strike}>{strikeWord}</span> {restOfLine1}
              </span>
              <span className={styles.line2}>{data.heroLine2 || 'Ugly is the new'}</span>
              <span className={styles.line3}>
                <span className={styles.invert}>{data.heroLine3 || 'sick.'}</span>
              </span>
            </h1>

            <p className={styles.subtitle}>
              {data.heroSubtitle || "Tees, hoodies and objects too loud for the For You page. 240gsm cotton, boxy fit, dry copy, printed when you order."}
            </p>

            <div className={styles.actions}>
              <Link href={data.heroCta1Url || '/shop'} className={styles.btnPrimary}>
                {data.heroCta1Text || 'Shop now'}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ marginLeft: 6 }}>
                  <path d="M1 7h11M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href={data.heroCta2Url || '/about'} className={styles.btnSecondary}>
                {data.heroCta2Text || 'Our story'}
              </Link>
            </div>
          </div>

          {/* Hero image (uploaded via CMS) */}
          {hasHeroImage && (() => {
            const { containerClass, imageClass } = getImageDisplayStyles(
              (data as any).heroImageSize,
              (data as any).heroImageAspect,
            )
            return (
              <div className={`${styles.heroImage} ${containerClass}`}>
                <Media resource={data.heroImage!} imgClassName={imageClass} priority />
              </div>
            )
          })()}

          {/* Auto-sliding product carousel (when no hero image) */}
          {hasCarousel && (
            <div
              className={styles.carouselWrap}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div className={styles.carousel} style={{ transform: `rotate(${tiltDeg}deg)` }}>
                {carouselSlides.map((slide, i) => (
                  <Link
                    key={slide.image.id}
                    href={`/products/${slide.slug}`}
                    className={styles.carouselSlide}
                    style={{
                      opacity: i === currentSlide ? 1 : 0,
                      transform: i === currentSlide ? 'scale(1)' : 'scale(0.95)',
                      pointerEvents: i === currentSlide ? 'auto' : 'none',
                    }}
                  >
                    <Media resource={slide.image} imgClassName="w-full h-full object-cover" priority={i === 0} />
                  </Link>
                ))}

                {/* Slide indicators */}
                <div className={styles.dots} style={{ transform: `translateX(-50%) rotate(${-tiltDeg}deg)` }}>
                  {carouselSlides.map((_, i) => (
                    <button
                      key={i}
                      className={`${styles.dot} ${i === currentSlide ? styles.dotActive : ''}`}
                      onClick={() => setCurrentSlide(i)}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
              </div>

              {stampText && (
                <div className={styles.carouselStamp}>
                  {stampText.split(' ').map((word: string, i: number) => (
                    <span key={i}>{word}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
