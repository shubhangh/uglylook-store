import React from 'react'

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="aspect-square bg-muted animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-3 bg-muted rounded animate-pulse w-1/3" />
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <div>
      <div className="mb-6 h-4 bg-muted rounded animate-pulse w-24" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array(12)
          .fill(0)
          .map((_, index) => (
            <SkeletonCard key={index} />
          ))}
      </div>
    </div>
  )
}
