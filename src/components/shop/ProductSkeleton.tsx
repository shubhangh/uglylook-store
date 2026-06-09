'use client'

export function ProductSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card animate-pulse">
      <div className="aspect-[4/5] bg-muted" />
      <div className="px-4 py-4 md:px-5 md:py-5 h-[60px] flex items-center">
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-12" />
        </div>
      </div>
    </div>
  )
}
