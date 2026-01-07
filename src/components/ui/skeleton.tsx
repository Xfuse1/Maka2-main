import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("bg-muted animate-pulse rounded", className)} />
  )
}

// Product card skeleton for reuse
export function ProductCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-square rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}

// Product grid skeleton
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Hero section skeleton
export function HeroSkeleton() {
  return (
    <div className="relative w-full aspect-[21/9] md:aspect-[3/1] bg-muted animate-pulse rounded-lg">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
        <Skeleton className="h-10 w-64 md:w-96" />
        <Skeleton className="h-6 w-48 md:w-72" />
        <Skeleton className="h-12 w-32" />
      </div>
    </div>
  )
}

// Section heading skeleton
export function SectionHeadingSkeleton() {
  return (
    <div className="flex items-center justify-between mb-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-8 w-24" />
    </div>
  )
}

// Category card skeleton
export function CategoryCardSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="aspect-square rounded-lg" />
      <Skeleton className="h-5 w-3/4 mx-auto" />
    </div>
  )
}

// Categories grid skeleton
export function CategoriesGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CategoryCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Cart item skeleton
export function CartItemSkeleton() {
  return (
    <div className="flex gap-4 p-4 border rounded-lg">
      <Skeleton className="w-20 h-20 rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  )
}

// Table skeleton
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 p-4 border-b bg-muted/30">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className={cn("h-4", i === 1 ? "flex-1 w-32" : "w-20")} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4 border-b last:border-0">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} className={cn("h-4", colIndex === 1 ? "flex-1 w-32" : "w-20")} />
          ))}
        </div>
      ))}
    </div>
  )
}

// Form skeleton
export function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

// Button skeleton
export function ButtonSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-10 w-24", className)} />
}

// Avatar skeleton
export function AvatarSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  }
  return <Skeleton className={cn("rounded-full", sizeClasses[size])} />
}

// Full page loading skeleton
export function PageSkeleton({ children }: { children?: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {children || (
        <>
          <Skeleton className="h-10 w-64" />
          <ProductGridSkeleton />
        </>
      )}
    </div>
  )
}
