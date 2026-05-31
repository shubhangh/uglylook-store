'use client'

import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import type { Category } from '@/payload-types'

interface Props {
  categories: Category[]
  activeCategory?: string
}

export function ShopControls({ categories, activeCategory }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentSort = searchParams.get('sort') || 'title'

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', value)
    router.push(`/shop?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
      <div className="flex flex-wrap gap-2">
        <Link
          href="/shop"
          className={`font-mono text-[11px] uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors ${
            !activeCategory
              ? 'border-foreground text-foreground bg-foreground/5'
              : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground'
          }`}
        >
          All
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/shop/${cat.slug}`}
            className={`font-mono text-[11px] uppercase tracking-widest px-3 py-1.5 rounded-full border transition-colors ${
              activeCategory === cat.slug
                ? 'border-foreground text-foreground bg-foreground/5'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground'
            }`}
          >
            {cat.title}
          </Link>
        ))}
      </div>

      <select
        value={currentSort}
        onChange={(e) => handleSort(e.target.value)}
        className="font-mono text-[11px] uppercase tracking-widest bg-transparent border border-border rounded-[4px] px-3 py-2 text-muted-foreground focus:text-foreground focus:border-foreground outline-none cursor-pointer"
      >
        <option value="title">A–Z</option>
        <option value="-title">Z–A</option>
        <option value="-createdAt">Newest</option>
        <option value="priceInUSD">Price: Low–High</option>
        <option value="-priceInUSD">Price: High–Low</option>
      </select>
    </div>
  )
}
