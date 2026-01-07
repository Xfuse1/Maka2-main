// Performance monitoring and Core Web Vitals reporting
'use client';

import { useEffect } from 'react';
import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Send to analytics endpoint in production
    if (process.env.NODE_ENV === 'production') {
      const body = JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
      });

      // Send to your analytics endpoint
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/vitals', body);
      } else {
        fetch('/api/analytics/vitals', {
          body,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
        });
      }
    }

    // Check thresholds and warn
    const thresholds = {
      LCP: 2500, // Largest Contentful Paint
      FID: 100,  // First Input Delay (deprecated, using INP)
      INP: 200,  // Interaction to Next Paint
      CLS: 0.1,  // Cumulative Layout Shift
      FCP: 1800, // First Contentful Paint
      TTFB: 800, // Time to First Byte
    };

    const threshold = thresholds[metric.name as keyof typeof thresholds];
    if (threshold && metric.value > threshold) {
      console.warn(
        `⚠️ ${metric.name} is ${metric.value}ms (threshold: ${threshold}ms)`
      );
    }
  });

  return null;
}

// Performance observer for monitoring
export function usePerformanceMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    // Monitor long tasks (> 50ms)
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          console.warn('[Long Task]', {
            duration: entry.duration,
            startTime: entry.startTime,
          });
        }
      }
    });

    try {
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // longtask not supported
    }

    // Monitor layout shifts
    const layoutShiftObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if ((entry as any).hadRecentInput) continue;
        
        const value = (entry as any).value;
        if (value > 0.1) {
          console.warn('[Layout Shift]', {
            value,
            sources: (entry as any).sources,
          });
        }
      }
    });

    try {
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // layout-shift not supported
    }

    return () => {
      longTaskObserver.disconnect();
      layoutShiftObserver.disconnect();
    };
  }, []);
}
