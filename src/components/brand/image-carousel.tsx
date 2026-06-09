'use client'

import Link from 'next/link'
import { Media } from '@/components/Media'
import type { Media as MediaType, Homepage } from '@/payload-types'
import styles from './image-carousel.module.css'

export type CarouselItem = {
  image: MediaType
  slug: string
}

type Props = {
  items: CarouselItem[]
  data: Homepage
}

export function ImageCarousel({ items, data }: Props) {
  const d = data as any
  if (d.showImageCarousel === false) return null
  if (!items.length) return null

  const labelLeft = d.carouselLabelLeft || 'THE CATALOG'
  const labelRight = d.carouselLabelRight || 'SS27'
  const speed = d.carouselSpeed ?? 40
  const slideW = d.carouselSlideWidth ?? 280
  const slideH = d.carouselSlideHeight ?? 350

  // Duplicate for seamless infinite scroll
  const doubled = [...items, ...items]

  return (
    <section className={styles.section}>
      <div className={styles.labelRow}>
        <span className={styles.label}>{labelLeft}</span>
        <span className={styles.labelLine} aria-hidden="true" />
        <span className={styles.label}>{labelRight}</span>
      </div>
      <div className={styles.track}>
        <div
          className={styles.inner}
          style={{
            animationDuration: speed > 0 ? `${speed}s` : '0s',
          }}
        >
          {doubled.map((item, i) => (
            <Link
              key={`${item.image.id}-${i}`}
              href={`/products/${item.slug}`}
              className={styles.slide}
              style={{ width: slideW, height: slideH }}
            >
              <Media resource={item.image} imgClassName="w-full h-full object-cover" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
