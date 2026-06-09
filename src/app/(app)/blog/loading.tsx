export default function BlogLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-8 w-32 bg-muted/40 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[16/9] bg-muted/40 rounded-lg" />
            <div className="h-5 w-3/4 bg-muted/40 rounded" />
            <div className="h-4 w-1/2 bg-muted/40 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
