// Lazy loading للمكونات الثقيلة لتحسين الأداء
import dynamic from 'next/dynamic';

// تحميل كسول للـ Hero Slider
export const LazyHeroSlider = dynamic(
  () => import('@/components/hero-slider').then(mod => ({ default: mod.HeroSlider })),
  {
    loading: () => (
      <div className="w-full h-[600px] md:h-[700px] bg-muted animate-pulse" />
    ),
    ssr: true,
  }
);

// تحميل كسول للـ Bestseller Section
export const LazyBestsellerSection = dynamic(
  () => import('@/components/bestseller-section').then(mod => ({ default: mod.BestsellerSection })),
  {
    loading: () => (
      <div className="py-12 md:py-24">
        <div className="container mx-auto px-4">
          <div className="h-[600px] bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    ),
    ssr: false,
  }
);

// تحميل كسول للـ Dynamic Homepage Section
export const LazyDynamicHomepageSection = dynamic(
  () => import('@/components/dynamic-homepage-section').then(mod => ({ default: mod.DynamicHomepageSection })),
  {
    loading: () => (
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="h-[400px] bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    ),
    ssr: false,
  }
);

// تحميل كسول للـ Footer
export const LazySiteFooter = dynamic(
  () => import('@/components/site-footer').then(mod => ({ default: mod.SiteFooter })),
  {
    loading: () => <div className="h-64 bg-muted" />,
    ssr: false,
  }
);
