// Global loading state - displayed during page transitions
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        {/* Animated spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin" />
        </div>
        {/* Loading text with pulse animation */}
        <p className="text-muted-foreground animate-pulse text-sm">
          جاري التحميل...
        </p>
      </div>
    </div>
  )
}
