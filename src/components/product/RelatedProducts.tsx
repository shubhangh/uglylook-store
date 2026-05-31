'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { GridTileImage } from '@/components/Grid/tile'
import type { Media, Product } from '@/payload-types'

interface Props {
  products: Product[]
}

export function RelatedProducts({ products }: Props) {
  const scrollRef = useRef<HTMLUListElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 2)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2)
  }, [])

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [checkScroll])

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' })
  }

  if (!products.length) return null

  return (
    <div className="py-12 group/carousel">
      <div className="mb-6">
        <span className="font-mono text-[10px] uppercase tracking-widest text-olive-text">
          SEC / 03
        </span>
        <h2 className="text-2xl font-bold tracking-[-0.02em] mt-2 text-foreground">
          Related Products
        </h2>
      </div>

      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border border-border rounded-full p-2 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200 cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        <ul
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex w-full gap-4 overflow-x-auto pt-1 scroll-smooth scrollbar-hide"
        >
          {products.map((product) => (
            <li
              className="aspect-square w-full flex-none min-[475px]:w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5"
              key={product.id}
            >
              <Link className="relative h-full w-full" href={`/products/${product.slug}`}>
                <GridTileImage
                  label={{
                    amount: product.priceInUSD!,
                    title: product.title,
                  }}
                  media={product.meta?.image as Media}
                />
              </Link>
            </li>
          ))}
        </ul>

        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm border border-border rounded-full p-2 opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200 cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  )
}
