import { Search } from '@/components/Search'
import React, { Suspense } from 'react'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <div className="bg-card">
        <div className="container py-8 md:py-12">
          <Search className="mb-6" />
          <div className="w-full">{children}</div>
        </div>
      </div>
    </Suspense>
  )
}
