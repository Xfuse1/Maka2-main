/**
 * ⚙️ Settings Cache Module
 * =========================
 * Specialized caching for store and design settings
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
// CACHED SETTINGS QUERIES
// =============================================================================

/**
 * Get store settings with caching
 */
export const getCachedStoreSettings = async (
  storeId: string,
  fetcher: () => Promise<any>
): Promise<any | null> => {
  const cacheKey = generateCacheKey('STORE_SETTINGS');
  
  // Check memory cache first
  const cached = memoryCache.get(cacheKey, storeId);
  if (cached) return cached;

  // Use Next.js cache
  const cachedFn = unstable_cache(
    fetcher,
    [storeId, cacheKey],
    {
      revalidate: CACHE_CONFIGS.storeSettings.ttl,
      tags: [...CACHE_CONFIGS.storeSettings.tags, `store:${storeId}`],
    }
  );

  const result = await cachedFn();
  
  // Store in memory
  if (result) {
    memoryCache.set(cacheKey, result, storeId, CACHE_CONFIGS.storeSettings.ttl);
  }

  return result;
};

/**
 * Get design settings with caching
 */
export const getCachedDesignSettings = async (
  storeId: string,
  fetcher: () => Promise<any>
): Promise<any | null> => {
  const cacheKey = generateCacheKey('DESIGN_SETTINGS');
  
  const cached = memoryCache.get(cacheKey, storeId);
  if (cached) return cached;

  const cachedFn = unstable_cache(
    fetcher,
    [storeId, cacheKey],
    {
      revalidate: CACHE_CONFIGS.designSettings.ttl,
      tags: [...CACHE_CONFIGS.designSettings.tags, `store:${storeId}`],
    }
  );

  const result = await cachedFn();
  
  if (result) {
    memoryCache.set(cacheKey, result, storeId, CACHE_CONFIGS.designSettings.ttl);
  }

  return result;
};

// =============================================================================
// INVALIDATION
// =============================================================================

/**
 * Invalidate store settings cache
 */
export function invalidateStoreSettingsCache(storeId: string): void {
  revalidateTag(CACHE_TAGS.SETTINGS);
  revalidateTag(`store:${storeId}`);
  
  memoryCache.invalidate(CACHE_KEYS.STORE_SETTINGS, storeId);
}

/**
 * Invalidate design settings cache
 */
export function invalidateDesignSettingsCache(storeId: string): void {
  revalidateTag(CACHE_TAGS.DESIGN);
  revalidateTag(`store:${storeId}`);
  
  memoryCache.invalidate(CACHE_KEYS.DESIGN_SETTINGS, storeId);
}

/**
 * Invalidate all settings caches
 */
export function invalidateAllSettingsCache(storeId: string): void {
  invalidateStoreSettingsCache(storeId);
  invalidateDesignSettingsCache(storeId);
}
