/**
 * Mobile Performance Optimizations
 * تحسينات خاصة بالأداء على الأجهزة المحمولة
 */

// تحديد إذا كان الجهاز موبايل
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// تحديد سرعة الاتصال
export function getConnectionSpeed(): 'slow' | 'medium' | 'fast' {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) return 'medium';
  
  const connection = (navigator as any).connection;
  const effectiveType = connection?.effectiveType;
  
  if (effectiveType === '4g') return 'fast';
  if (effectiveType === '3g') return 'medium';
  return 'slow';
}

// تحميل الصور بناءً على سرعة الاتصال
export function getImageQuality(): number {
  const speed = getConnectionSpeed();
  
  switch (speed) {
    case 'slow':
      return 60;
    case 'medium':
      return 75;
    case 'fast':
      return 85;
    default:
      return 75;
  }
}

// تحديد أحجام الصور المناسبة للموبايل
export function getResponsiveImageSizes(isMobile: boolean = isMobileDevice()): string {
  if (isMobile) {
    return '(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw';
  }
  return '(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw';
}

// تأجيل تحميل الموارد غير الحرجة
export function deferNonCriticalResources() {
  if (typeof window === 'undefined') return;
  
  // تأجيل الخطوط غير الحرجة
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap';
  fontLink.media = 'print';
  fontLink.onload = function() {
    fontLink.media = 'all';
  };
  
  // تأجيل السكريبتات التحليلية
  window.addEventListener('load', () => {
    // تحميل السكريبتات بعد اكتمال الصفحة
    setTimeout(() => {
      // يمكن إضافة سكريبتات إضافية هنا
    }, 3000);
  });
}

// تقليل حجم الصور للموبايل
export function getMobileImageUrl(url: string, width: number = 640): string {
  if (!url || typeof url !== 'string') return url;
  
  // إذا كانت من Supabase
  if (url.includes('supabase.co')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${width}&quality=${getImageQuality()}`;
  }
  
  return url;
}

// Reduce Motion للمستخدمين اللي طالبين كده
export function shouldReduceMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Enable GPU acceleration for animations
export function enableGPUAcceleration(element: HTMLElement) {
  if (!element) return;
  element.style.transform = 'translateZ(0)';
  element.style.willChange = 'transform, opacity';
}

// Optimize scroll performance
export function optimizeScrollPerformance() {
  if (typeof window === 'undefined') return;
  
  let ticking = false;
  
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        // Handle scroll events here
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

// Save data mode - تقليل استهلاك البيانات
export function isDataSaverMode(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (navigator as any).connection?.saveData === true;
}

// Get optimal image format based on browser support
export function getOptimalImageFormat(): 'avif' | 'webp' | 'jpeg' {
  if (typeof window === 'undefined') return 'jpeg';
  
  const canvas = document.createElement('canvas');
  
  // Check AVIF support
  if (canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
    return 'avif';
  }
  
  // Check WebP support
  if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
    return 'webp';
  }
  
  return 'jpeg';
}
