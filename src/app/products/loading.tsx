// Loading skeleton for product pages
export default function ProductsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header skeleton */}
      <div className="h-8 w-48 bg-muted rounded animate-pulse mb-8" />
      
      {/* Filter bar skeleton */}
      <div className="flex gap-4 mb-6">
        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
      </div>
      
      {/* Products grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            {/* Image skeleton */}
            <div className="aspect-square bg-muted rounded-lg animate-pulse" />
            {/* Title skeleton */}
            <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
            {/* Price skeleton */}
            <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
