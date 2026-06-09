'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { ProductGridItem } from '@/components/ProductGridItem'
import { ProductSkeleton } from './ProductSkeleton'
import type { Product } from '@/payload-types'

interface Props {
  initialProducts: Partial<Product>[]
  totalDocs: number
  sort: string
  category?: string
  searchQuery?: string
}

export function ProductGrid({ initialProducts, totalDocs, sort, category, searchQuery }: Props) {
  const [products, setProducts] = useState<Partial<Product>[]>(initialProducts)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialProducts.length < totalDocs)
  const [displayTotal, setDisplayTotal] = useState(totalDocs)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)
  const loadMoreRef = useRef<() => void>(undefined)

  // Reset when filters change (server re-renders with new initialProducts)
  useEffect(() => {
    setProducts(initialProducts)
    setPage(1)
    setHasMore(initialProducts.length < totalDocs)
    setDisplayTotal(totalDocs)
  }, [initialProducts, totalDocs])

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return
    loadingRef.current = true
    setLoading(true)

    const nextPage = page + 1
    const params = new URLSearchParams({
      page: String(nextPage),
      limit: '12',
      sort,
    })
    if (category) params.set('category', category)
    if (searchQuery) params.set('q', searchQuery)

    try {
      const res = await fetch(`/next/shop-products?${params.toString()}`)
      const data = await res.json()

      setProducts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id))
        const newDocs = data.docs.filter((p: Partial<Product>) => !existingIds.has(p.id))
        return [...prev, ...newDocs]
      })
      setPage(nextPage)
      setHasMore(data.hasNextPage)
      setDisplayTotal(data.totalDocs)
    } catch (err) {
      console.error('Failed to load more products:', err)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [page, hasMore, sort, category, searchQuery])

  // Keep loadMoreRef in sync without re-creating the observer
  useEffect(() => {
    loadMoreRef.current = loadMore
  }, [loadMore])

  // Single observer — only re-created when sentinel appears/disappears
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMoreRef.current?.()
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore])

  // After new products render, re-check if sentinel is still in viewport
  // Handles the case where content grows but user is already at the bottom
  useEffect(() => {
    if (!hasMore || loading) return
    const sentinel = sentinelRef.current
    if (!sentinel) return

    requestAnimationFrame(() => {
      const rect = sentinel.getBoundingClientRect()
      if (rect.top < window.innerHeight + 200) {
        loadMoreRef.current?.()
      }
    })
  }, [products.length, hasMore, loading])

  return (
    <div>
      <div className="grid grid-flow-row gap-4 grid-cols-2 lg:grid-cols-3 md:gap-8">
        {products.map((product, i) => (
          <ProductGridItem key={product.id} product={product} priority={i < 4} />
        ))}
        {loading &&
          Array.from({ length: 3 }).map((_, i) => <ProductSkeleton key={`skeleton-${i}`} />)}
      </div>

      {hasMore && <div ref={sentinelRef} className="h-px" />}

      <p className="mt-6 text-center text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
        Showing {products.length} of {displayTotal}
      </p>
    </div>
  )
}
