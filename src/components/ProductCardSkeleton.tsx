export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="aspect-[4/5] bg-muted/40 animate-pulse" />
      <div className="px-4 py-4 md:px-5 md:py-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="h-4 w-2/3 rounded bg-muted/40 animate-pulse" />
          <div className="h-4 w-14 rounded bg-muted/40 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
