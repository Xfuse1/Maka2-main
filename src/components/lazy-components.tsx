"use client"

import dynamic from 'next/dynamic'
import { Suspense, ComponentType } from 'react'
import { Loader2 } from 'lucide-react'

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
)

const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-64 bg-muted rounded-lg" />
  </div>
)

// Lazy loaded components for better performance
export const LazyHeroSlider = dynamic(
  () => import('@/components/hero-slider').then(mod => mod.HeroSlider),
  {
    loading: () => (
      <div className="w-full h-[50vh] min-h-[400px] md:h-[70vh] md:min-h-[500px] bg-muted animate-pulse" />
    ),
    ssr: true,
  }
)

export const LazyBestsellerSection = dynamic(
  () => import('@/components/bestseller-section').then(mod => mod.BestsellerSection),
  {
    loading: () => <LoadingSkeleton />,
    ssr: true,
  }
)

export const LazyDynamicHomepageSection = dynamic(
  () => import('@/components/dynamic-homepage-section').then(mod => mod.DynamicHomepageSection),
  {
    loading: () => <LoadingSkeleton />,
    ssr: true,
  }
)

export const LazyAnimatedSection = dynamic(
  () => import('@/components/animated-section').then(mod => mod.AnimatedSection),
  {
    loading: () => <LoadingSkeleton />,
    ssr: true,
  }
)

export const LazyProfileDropdown = dynamic(
  () => import('@/components/profile-dropdown.client'),
  {
    loading: () => <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />,
    ssr: false,
  }
)

export const LazySiteFooter = dynamic(
  () => import('@/components/site-footer').then(mod => mod.SiteFooter),
  {
    loading: () => <div className="h-64 bg-muted animate-pulse" />,
    ssr: true,
  }
)

// Wrapper for Suspense with error boundary
export function LazyComponent<T extends object>({
  Component,
  fallback,
  ...props
}: {
  Component: ComponentType<T>
  fallback?: React.ReactNode
} & T) {
  return (
    <Suspense fallback={fallback || <LoadingSpinner />}>
      <Component {...(props as T)} />
    </Suspense>
  )
}
