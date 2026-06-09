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
    <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between md:mb-8">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        <Link
          href="/shop"
          className={`text-[11px] font-medium uppercase tracking-wide px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
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
            className={`text-[11px] font-medium uppercase tracking-wide px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
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
        className="text-[11px] font-medium uppercase tracking-wide bg-transparent border border-border rounded-[4px] px-3 py-2 text-muted-foreground focus:text-foreground focus:border-foreground outline-none cursor-pointer"
      >
        <option value="title" className="bg-background text-foreground">A–Z</option>
        <option value="-title" className="bg-background text-foreground">Z–A</option>
        <option value="-createdAt" className="bg-background text-foreground">Newest</option>
        <option value="priceInUSD" className="bg-background text-foreground">Price: Low–High</option>
        <option value="-priceInUSD" className="bg-background text-foreground">Price: High–Low</option>
      </select>
    </div>
  )
}
