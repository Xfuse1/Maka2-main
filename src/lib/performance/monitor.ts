/**
 * Performance Monitoring and Optimization Utilities
 * أدوات مراقبة وتحسين الأداء
 */

// قياس وقت تحميل الصفحة
export function measurePageLoad() {
  if (typeof window === 'undefined') return null;

  const perfData = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  return {
    // First Paint
    fp: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
    // First Contentful Paint
    fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
    // DOM Content Loaded
    domContentLoaded: perfData?.domContentLoadedEventEnd - perfData?.domContentLoadedEventStart || 0,
    // Load Complete
    loadComplete: perfData?.loadEventEnd - perfData?.loadEventStart || 0,
    // Total Page Load Time
    totalTime: perfData?.loadEventEnd - perfData?.fetchStart || 0,
  };
}

// تحسين الصور تلقائياً
export function optimizeImageUrl(url: string, width?: number, quality: number = 85): string {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return url;

  // إذا كانت الصورة من Supabase
  if (url.includes('supabase.co')) {
    const separator = url.includes('?') ? '&' : '?';
    let optimized = `${url}${separator}quality=${quality}`;
    
    if (width) {
      optimized += `&width=${width}`;
    }
    
    return optimized;
  }

  return url;
}

// Lazy load images with Intersection Observer
export function lazyLoadImages() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      }
    });
  }, {
    rootMargin: '50px 0px', // تحميل الصور قبل 50px من الظهور
    threshold: 0.01
  });

  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}

// Resource Priority Hints
export function setResourcePriority(url: string, priority: 'high' | 'low' | 'auto' = 'auto') {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  
  if (url.match(/\.(jpg|jpeg|png|webp|avif|gif)$/i)) {
    link.as = 'image';
  } else if (url.match(/\.(woff|woff2|ttf|otf)$/i)) {
    link.as = 'font';
    link.crossOrigin = 'anonymous';
  } else if (url.match(/\.(css)$/i)) {
    link.as = 'style';
  } else if (url.match(/\.(js)$/i)) {
    link.as = 'script';
  }

  (link as any).fetchPriority = priority;
  document.head.appendChild(link);
}

// Defer non-critical CSS
export function deferNonCriticalCSS(href: string) {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.media = 'print';
  link.onload = function() {
    link.media = 'all';
  };
  document.head.appendChild(link);
}

// Measure Cumulative Layout Shift (CLS)
export function measureCLS(callback: (value: number) => void) {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  let clsValue = 0;
  let clsEntries: PerformanceEntry[] = [];

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
        clsEntries.push(entry);
      }
    }
    callback(clsValue);
  });

  observer.observe({ type: 'layout-shift', buffered: true });
}

// Prefetch next pages for faster navigation
export function prefetchPages(routes: string[]) {
  if (typeof window === 'undefined') return;

  routes.forEach(route => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
  });
}
