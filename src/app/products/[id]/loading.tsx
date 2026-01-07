// Loading skeleton for single product page
export default function ProductLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Image gallery skeleton */}
        <div className="space-y-4">
          <div className="aspect-square bg-muted rounded-lg animate-pulse" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-20 h-20 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
        
        {/* Product info skeleton */}
        <div className="space-y-6">
          {/* Title */}
          <div className="h-8 w-3/4 bg-muted rounded animate-pulse" />
          
          {/* Price */}
          <div className="h-10 w-1/3 bg-muted rounded animate-pulse" />
          
          {/* Rating */}
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-5 h-5 bg-muted rounded animate-pulse" />
            ))}
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-full bg-muted rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
          </div>
          
          {/* Size options */}
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-12 h-10 bg-muted rounded animate-pulse" />
            ))}
          </div>
          
          {/* Add to cart button */}
          <div className="h-12 w-full bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}
