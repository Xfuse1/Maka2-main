/**
 * 🛍️ Products Cache Module
 * =========================
 * Specialized caching for product-related queries
 */

import { unstable_cache, revalidateTag } from 'next/cache';
import { 
  memoryCache, 
  CACHE_KEYS, 
  CACHE_TAGS, 
  CACHE_TTL,
  CACHE_CONFIGS,
  generateCacheKey,
} from './index';

// =============================================================================
// CACHED PRODUCT QUERIES
// =============================================================================

/**
 * Get all products with caching
 */
export const getCachedProducts = async (
  storeId: string,
  fetcher: () => Promise<any[]>
): Promise<any[]> => {
  const cacheKey = generateCacheKey('ALL_PRODUCTS');
  
  // Check memory cache first
  const cached = memoryCache.get(cacheKey, storeId);
  if (cached) return cached;

  // Use Next.js cache
  const cachedFn = unstable_cache(
    fetcher,
    [storeId, cacheKey],
    {
      revalidate: CACHE_CONFIGS.products.ttl,
      tags: [...CACHE_CONFIGS.products.tags, `store:${storeId}`],
    }
  );

  const result = await cachedFn();
  
  // Store in memory
  if (result) {
    memoryCache.set(cacheKey, result, storeId, CACHE_CONFIGS.products.ttl);
  }

  return result ?? [];
};

/**
 * Get single product by ID with caching
 */
export const getCachedProductById = async (
  storeId: string,
  productId: string,
  fetcher: (id: string) => Promise<any>
): Promise<any | null> => {
  const cacheKey = generateCacheKey('PRODUCT_BY_ID', productId);
  
  // Check memory cache
  const cached = memoryCache.get(cacheKey, storeId);
  if (cached) return cached;

  // Use Next.js cache
  const cachedFn = unstable_cache(
    () => fetcher(productId),
    [storeId, cacheKey],
    {
      revalidate: CACHE_CONFIGS.product.ttl,
      tags: [...CACHE_CONFIGS.product.tags, `store:${storeId}`, `product:${productId}`],
    }
  );

  const result = await cachedFn();
  
  if (result) {
    memoryCache.set(cacheKey, result, storeId, CACHE_CONFIGS.product.ttl);
  }

  return result;
};

/**
 * Get featured products with caching
 */
export const getCachedFeaturedProducts = async (
  storeId: string,
  fetcher: () => Promise<any[]>
): Promise<any[]> => {
  const cacheKey = generateCacheKey('FEATURED_PRODUCTS');
  
  const cached = memoryCache.get(cacheKey, storeId);
  if (cached) return cached;

  const cachedFn = unstable_cache(
    fetcher,
    [storeId, cacheKey],
    {
      revalidate: CACHE_CONFIGS.featuredProducts.ttl,
      tags: [...CACHE_CONFIGS.featuredProducts.tags, `store:${storeId}`],
    }
  );

  const result = await cachedFn();
  
  if (result) {
    memoryCache.set(cacheKey, result, storeId, CACHE_CONFIGS.featuredProducts.ttl);
  }

  return result ?? [];
};

/**
 * Get products by category with caching
 */
export const getCachedProductsByCategory = async (
  storeId: string,
  categoryId: string,
  fetcher: (categoryId: string) => Promise<any[]>
): Promise<any[]> => {
  const cacheKey = generateCacheKey('PRODUCTS_BY_CATEGORY', categoryId);
  
  const cached = memoryCache.get(cacheKey, storeId);
  if (cached) return cached;

  const cachedFn = unstable_cache(
    () => fetcher(categoryId),
    [storeId, cacheKey],
    {
      revalidate: CACHE_CONFIGS.products.ttl,
      tags: [CACHE_TAGS.PRODUCTS, `store:${storeId}`, `category:${categoryId}`],
    }
  );

  const result = await cachedFn();
  
  if (result) {
    memoryCache.set(cacheKey, result, storeId, CACHE_CONFIGS.products.ttl);
  }

  return result ?? [];
};

// =============================================================================
// INVALIDATION
// =============================================================================

/**
 * Invalidate all product caches for a store
 */
export function invalidateProductCache(storeId: string): void {
  // Invalidate Next.js cache
  revalidateTag(CACHE_TAGS.PRODUCTS);
  revalidateTag(`store:${storeId}`);
  
  // Invalidate memory cache
  memoryCache.invalidate(CACHE_KEYS.ALL_PRODUCTS, storeId);
  memoryCache.invalidate(CACHE_KEYS.FEATURED_PRODUCTS, storeId);
  memoryCache.invalidate(CACHE_KEYS.PRODUCTS_BY_CATEGORY, storeId);
}

/**
 * Invalidate single product cache
 */
export function invalidateSingleProductCache(storeId: string, productId: string): void {
  revalidateTag(`product:${productId}`);
  memoryCache.invalidate(`${CACHE_KEYS.PRODUCT_BY_ID}:${productId}`, storeId);
  
  // Also invalidate list caches as product may be in lists
  invalidateProductCache(storeId);
}
