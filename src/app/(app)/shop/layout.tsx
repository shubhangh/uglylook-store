import { Categories } from '@/components/layout/search/Categories'
import { FilterList } from '@/components/layout/search/filter'
import { sorting } from '@/lib/constants'
import { Search } from '@/components/Search'
import React, { Suspense } from 'react'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <div className="min-h-screen bg-card">
      <div className="container py-16">
        {/* Section header */}
        <header className="grid grid-cols-[80px_1fr_auto] items-baseline gap-4 border-b border-input pb-6 mb-12 max-md:grid-cols-1">
          <span className="font-mono text-xs text-olive-text tracking-[0.06em] uppercase whitespace-nowrap">
            SEC / 02
          </span>
          <h1 className="text-[clamp(36px,4.5vw,64px)] font-bold tracking-[-0.03em] leading-[0.95]">
            Catalog. As of now.
          </h1>
          <p className="font-mono text-[11px] text-muted-foreground uppercase text-right max-w-[280px] leading-relaxed max-md:text-left">
            printed when you order · filtered on purpose
          </p>
        </header>

        <Search className="mb-10" />

        <div className="flex flex-col md:flex-row items-start justify-between gap-12 md:gap-8">
          <div className="w-full flex-none flex flex-col gap-6 md:gap-8 basis-1/5">
            <Categories />
            <FilterList list={sorting} title="Sort by" />
          </div>
          <div className="min-h-screen w-full">{children}</div>
        </div>

        <div className="mt-12 font-mono text-[11px] text-muted-foreground">
          no &quot;only 3 left&quot; energy · we print until we don&rsquo;t
        </div>
      </div>
      </div>
    </Suspense>
  )
}
