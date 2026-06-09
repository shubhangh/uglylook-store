import { ProductCardSkeleton } from '@/components/ProductCardSkeleton'

export default function Loading() {
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-16 rounded-full bg-muted/40 animate-pulse" />
          ))}
        </div>
        <div className="h-8 w-28 rounded bg-muted/40 animate-pulse" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
