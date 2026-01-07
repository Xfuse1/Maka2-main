// Loading skeleton for checkout page
export default function CheckoutLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="h-8 w-48 bg-muted rounded animate-pulse mb-8" />
      
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form section skeleton */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section header */}
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          
          {/* Form fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              <div className="h-10 w-full bg-muted rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              <div className="h-10 w-full bg-muted rounded animate-pulse" />
            </div>
          </div>
          
          {/* Address fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-10 w-full bg-muted rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-28 bg-muted rounded animate-pulse" />
              <div className="h-10 w-full bg-muted rounded animate-pulse" />
            </div>
          </div>
          
          {/* Payment section */}
          <div className="h-6 w-36 bg-muted rounded animate-pulse mt-8" />
          <div className="space-y-3">
            <div className="h-14 w-full bg-muted rounded animate-pulse" />
            <div className="h-14 w-full bg-muted rounded animate-pulse" />
          </div>
        </div>
        
        {/* Order summary skeleton */}
        <div className="space-y-4">
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
          
          {/* Cart items */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 border rounded-lg">
              <div className="w-20 h-20 bg-muted rounded animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
          
          {/* Totals */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              <div className="h-4 w-16 bg-muted rounded animate-pulse" />
            </div>
            <div className="flex justify-between">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-4 w-16 bg-muted rounded animate-pulse" />
            </div>
            <div className="flex justify-between pt-2 border-t">
              <div className="h-6 w-20 bg-muted rounded animate-pulse" />
              <div className="h-6 w-20 bg-muted rounded animate-pulse" />
            </div>
          </div>
          
          {/* Submit button */}
          <div className="h-12 w-full bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}
