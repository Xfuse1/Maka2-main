/**
 * Preload Critical Resources
 * تحميل الموارد الحرجة مسبقاً لتحسين LCP و FCP
 */

export function preloadCriticalImages(imageUrls: string[]) {
  if (typeof window === 'undefined') return;

  imageUrls.slice(0, 3).forEach((url, index) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    link.fetchPriority = index === 0 ? 'high' : 'low';
    document.head.appendChild(link);
  });
}

export function preloadFont(fontUrl: string) {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'font';
  link.type = 'font/woff2';
  link.href = fontUrl;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

export function prefetchRoute(route: string) {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = route;
  document.head.appendChild(link);
}

export function preconnectOrigin(origin: string) {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = origin;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}
