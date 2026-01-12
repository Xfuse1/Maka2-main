/**
 * 🏠 Homepage Cache Module
 * =========================
 * Specialized caching for homepage-related queries
 */

import { unstable_cache, revalidateTag } from 'next/cache';
import { 
  memoryCache, 
  CACHE_KEYS, 
  CACHE_TAGS, 
  CACHE_CONFIGS,
  generateCacheKey,
} from './index';

// =============================================================================
// CACHED HOMEPAGE QUERIES
// =============================================================================

/**
 * Get hero slides with caching
 */
export const getCachedHeroSlides = async (
  storeId: string,
  fetcher: () => Promise<any[]>
): Promise<any[]> => {
  const cacheKey = generateCacheKey('HERO_SLIDES');
  
  // Check memory cache first
  const cached = memoryCache.get(cacheKey, storeId);
  if (cached) return cached;

  // Use Next.js cache
  const cachedFn = unstable_cache(
    fetcher,
    [storeId, cacheKey],
    {
      revalidate: CACHE_CONFIGS.heroSlides.ttl,
      tags: [...CACHE_CONFIGS.heroSlides.tags, `store:${storeId}`],
    }
  );

  const result = await cachedFn();
  
  // Store in memory
  if (result) {
    memoryCache.set(cacheKey, result, storeId, CACHE_CONFIGS.heroSlides.ttl);
  }

  return result ?? [];
};

/**
 * Get homepage sections with caching
 */
export const getCachedHomepageSections = async (
  storeId: string,
  fetcher: () => Promise<any[]>
): Promise<any[]> => {
  const cacheKey = generateCacheKey('HOMEPAGE_SECTIONS');
  
  const cached = memoryCache.get(cacheKey, storeId);
  if (cached) return cached;

  const cachedFn = unstable_cache(
    fetcher,
    [storeId, cacheKey],
    {
      revalidate: CACHE_CONFIGS.homepageSections.ttl,
      tags: [...CACHE_CONFIGS.homepageSections.tags, `store:${storeId}`],
    }
  );

  const result = await cachedFn();
  
  if (result) {
    memoryCache.set(cacheKey, result, storeId, CACHE_CONFIGS.homepageSections.ttl);
  }

  return result ?? [];
};

// =============================================================================
// INVALIDATION
// =============================================================================

/**
 * Invalidate hero slides cache
 */
export function invalidateHeroSlidesCache(storeId: string): void {
  revalidateTag(CACHE_TAGS.HERO_SLIDES);
  revalidateTag(`store:${storeId}`);
  
  memoryCache.invalidate(CACHE_KEYS.HERO_SLIDES, storeId);
}

/**
 * Invalidate homepage sections cache
 */
export function invalidateHomepageSectionsCache(storeId: string): void {
  revalidateTag(CACHE_TAGS.HOMEPAGE);
  revalidateTag(`store:${storeId}`);
  
  memoryCache.invalidate(CACHE_KEYS.HOMEPAGE_SECTIONS, storeId);
}

/**
 * Invalidate all homepage caches
 */
export function invalidateHomepageCache(storeId: string): void {
  revalidateTag(CACHE_TAGS.HOMEPAGE);
  revalidateTag(CACHE_TAGS.HERO_SLIDES);
  revalidateTag(`store:${storeId}`);
  
  memoryCache.invalidate(CACHE_KEYS.HERO_SLIDES, storeId);
  memoryCache.invalidate(CACHE_KEYS.HOMEPAGE_SECTIONS, storeId);
}
