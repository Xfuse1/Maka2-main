/**
 * 📂 Categories Cache Module
 * ===========================
 * Specialized caching for category-related queries
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
// CACHED CATEGORY QUERIES
// =============================================================================

/**
 * Get all categories with caching
 */
export const getCachedCategories = async (
  storeId: string,
  fetcher: () => Promise<any[]>
): Promise<any[]> => {
  const cacheKey = generateCacheKey('ALL_CATEGORIES');
  
  // Check memory cache first
  const cached = memoryCache.get(cacheKey, storeId);
  if (cached) return cached;

  // Use Next.js cache
  const cachedFn = unstable_cache(
    fetcher,
    [storeId, cacheKey],
    {
      revalidate: CACHE_CONFIGS.categories.ttl,
      tags: [...CACHE_CONFIGS.categories.tags, `store:${storeId}`],
    }
  );

  const result = await cachedFn();
  
  // Store in memory
  if (result) {
    memoryCache.set(cacheKey, result, storeId, CACHE_CONFIGS.categories.ttl);
  }

  return result ?? [];
};

/**
 * Get single category by ID with caching
 */
export const getCachedCategoryById = async (
  storeId: string,
  categoryId: string,
  fetcher: (id: string) => Promise<any>
): Promise<any | null> => {
  const cacheKey = generateCacheKey('CATEGORY_BY_ID', categoryId);
  
  const cached = memoryCache.get(cacheKey, storeId);
  if (cached) return cached;

  const cachedFn = unstable_cache(
    () => fetcher(categoryId),
    [storeId, cacheKey],
    {
      revalidate: CACHE_CONFIGS.categories.ttl,
      tags: [...CACHE_CONFIGS.categories.tags, `store:${storeId}`, `category:${categoryId}`],
    }
  );

  const result = await cachedFn();
  
  if (result) {
    memoryCache.set(cacheKey, result, storeId, CACHE_CONFIGS.categories.ttl);
  }

  return result;
};

/**
 * Get category by slug with caching
 */
export const getCachedCategoryBySlug = async (
  storeId: string,
  slug: string,
  fetcher: (slug: string) => Promise<any>
): Promise<any | null> => {
  const cacheKey = generateCacheKey('CATEGORY_BY_SLUG', slug);
  
  const cached = memoryCache.get(cacheKey, storeId);
  if (cached) return cached;

  const cachedFn = unstable_cache(
    () => fetcher(slug),
    [storeId, cacheKey],
    {
      revalidate: CACHE_CONFIGS.categories.ttl,
      tags: [...CACHE_CONFIGS.categories.tags, `store:${storeId}`],
    }
  );

  const result = await cachedFn();
  
  if (result) {
    memoryCache.set(cacheKey, result, storeId, CACHE_CONFIGS.categories.ttl);
  }

  return result;
};

// =============================================================================
// INVALIDATION
// =============================================================================

/**
 * Invalidate all category caches for a store
 */
export function invalidateCategoryCache(storeId: string): void {
  revalidateTag(CACHE_TAGS.CATEGORIES);
  revalidateTag(`store:${storeId}`);
  
  memoryCache.invalidate(CACHE_KEYS.ALL_CATEGORIES, storeId);
  memoryCache.invalidate(CACHE_KEYS.CATEGORY_BY_ID, storeId);
  memoryCache.invalidate(CACHE_KEYS.CATEGORY_BY_SLUG, storeId);
}

/**
 * Invalidate single category cache
 */
export function invalidateSingleCategoryCache(storeId: string, categoryId: string): void {
  revalidateTag(`category:${categoryId}`);
  memoryCache.invalidate(`${CACHE_KEYS.CATEGORY_BY_ID}:${categoryId}`, storeId);
  
  // Also invalidate list cache
  invalidateCategoryCache(storeId);
}
