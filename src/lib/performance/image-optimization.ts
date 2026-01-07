// دوال مساعدة لتحسين الصور
export function getOptimizedImageUrl(url: string, width?: number): string {
  if (!url || url.startsWith('/')) return url;
  
  // إذا كانت الصورة من Supabase
  if (url.includes('supabase')) {
    const params = new URLSearchParams();
    if (width) params.append('width', width.toString());
    params.append('quality', '80');
    params.append('format', 'webp');
    
    return `${url}?${params.toString()}`;
  }
  
  return url;
}

export function getResponsiveSizes(type: 'hero' | 'product' | 'thumbnail' | 'full'): string {
  const sizes = {
    hero: '100vw',
    product: '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw',
    thumbnail: '(max-width: 768px) 50vw, 128px',
    full: '(max-width: 768px) 100vw, 50vw',
  };
  
  return sizes[type];
}

export function preloadCriticalImages(urls: string[]) {
  if (typeof window === 'undefined') return;
  
  urls.slice(0, 3).forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
}
