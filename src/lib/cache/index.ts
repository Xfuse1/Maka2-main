/**
 * 🚀 Professional Multi-Tenant Cache System
 * ==========================================
 * 
 * Features:
 * - Multi-tenant isolation (store_id based)
 * - In-memory LRU cache for hot data
 * - Next.js unstable_cache for server-side
 * - Automatic cache invalidation
 * - Cache warming strategies
 * - Performance metrics
 * 
 * @version 2.0.0
 */

import { unstable_cache, revalidateTag } from 'next/cache';

// =============================================================================
// TYPES
// =============================================================================

export interface CacheConfig {
  ttl: number;           // Time to live in seconds
  staleWhileRevalidate?: number;  // SWR window
  tags: string[];        // Cache tags for invalidation
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  storeId: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

// =============================================================================
// CACHE CONSTANTS
// =============================================================================

export const CACHE_KEYS = {
  // Store-specific
  STORE_SETTINGS: 'store-settings',
  DESIGN_SETTINGS: 'design-settings',
  
  // Products
  ALL_PRODUCTS: 'all-products',
  PRODUCT_BY_ID: 'product',
  FEATURED_PRODUCTS: 'featured-products',
  PRODUCTS_BY_CATEGORY: 'products-by-category',
  
  // Categories
  ALL_CATEGORIES: 'all-categories',
  CATEGORY_BY_ID: 'category',
  CATEGORY_BY_SLUG: 'category-slug',
  
  // Homepage
  HERO_SLIDES: 'hero-slides',
  HOMEPAGE_SECTIONS: 'homepage-sections',
  
  // Orders
  USER_ORDERS: 'user-orders',
  ORDER_BY_ID: 'order',
  
  // Pages
  PAGE_CONTENT: 'page-content',
  PUBLISHED_PAGES: 'published-pages',
} as const;

export const CACHE_TAGS = {
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  HERO_SLIDES: 'hero-slides',
  HOMEPAGE: 'homepage',
  ORDERS: 'orders',
  PAGES: 'pages',
  SETTINGS: 'settings',
  DESIGN: 'design',
} as const;

export const CACHE_TTL = {
  INSTANT: 0,           // No cache
  VERY_SHORT: 30,       // 30 seconds
  SHORT: 60,            // 1 minute
  MEDIUM: 300,          // 5 minutes
  LONG: 900,            // 15 minutes
  VERY_LONG: 3600,      // 1 hour
  DAILY: 86400,         // 24 hours
} as const;

// =============================================================================
// IN-MEMORY LRU CACHE
// =============================================================================

class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private readonly maxSize: number;
  private stats: CacheStats = { hits: 0, misses: 0, size: 0, hitRate: 0 };

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  private generateKey(key: string, storeId: string): string {
    return `${storeId}:${key}`;
  }

  get(key: string, storeId: string): T | null {
    const fullKey = this.generateKey(key, storeId);
    const entry = this.cache.get(fullKey);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(fullKey);
      this.stats.misses++;
      this.stats.size = this.cache.size;
      this.updateHitRate();
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(fullKey);
    this.cache.set(fullKey, entry);

    this.stats.hits++;
    this.updateHitRate();
    return entry.data;
  }

  set(key: string, data: T, storeId: string, ttlSeconds: number): void {
    const fullKey = this.generateKey(key, storeId);

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + (ttlSeconds * 1000),
      storeId,
    };

    this.cache.set(fullKey, entry);
    this.stats.size = this.cache.size;
  }

  invalidate(pattern: string, storeId?: string): number {
    let count = 0;
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      const matchesStore = !storeId || entry.storeId === storeId;
      const matchesPattern = key.includes(pattern);
      
      if (matchesStore && matchesPattern) {
        keysToDelete.push(key);
        count++;
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
    this.stats.size = this.cache.size;
    
    return count;
  }

  invalidateByStoreId(storeId: string): number {
    let count = 0;
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (entry.storeId === storeId) {
        keysToDelete.push(key);
        count++;
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
    this.stats.size = this.cache.size;
    
    return count;
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, size: 0, hitRate: 0 };
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }
}

// Global in-memory cache instance
export const memoryCache = new LRUCache<any>(2000);

// =============================================================================
// CACHE WRAPPER FUNCTIONS
// =============================================================================

/**
 * Create a cached function with multi-tenant support
 */
export function createCachedQuery<TArgs extends any[], TResult>(
  queryFn: (...args: TArgs) => Promise<TResult>,
  options: {
    key: string;
    ttl: number;
    tags: string[];
    useMemoryCache?: boolean;
  }
) {
  const { key, ttl, tags, useMemoryCache = true } = options;

  return async (storeId: string, ...args: TArgs): Promise<TResult> => {
    const cacheKey = `${key}:${JSON.stringify(args)}`;

    // 1. Check memory cache first (fastest)
    if (useMemoryCache) {
      const cached = memoryCache.get(cacheKey, storeId);
      if (cached !== null) {
        return cached as TResult;
      }
    }

    // 2. Execute query with Next.js cache
    const cachedFn = unstable_cache(
      async () => queryFn(...args),
      [storeId, cacheKey],
      {
        revalidate: ttl,
        tags: [...tags, `store:${storeId}`],
      }
    );

    const result = await cachedFn();

    // 3. Store in memory cache
    if (useMemoryCache && result !== null) {
      memoryCache.set(cacheKey, result, storeId, ttl);
    }

    return result;
  };
}

/**
 * Wrapper for async data fetching with caching
 */
export async function withCache<T>(
  key: string,
  storeId: string,
  fetcher: () => Promise<T>,
  config: CacheConfig
): Promise<T> {
  const cacheKey = key;

  // Check memory cache
  const cached = memoryCache.get(cacheKey, storeId);
  if (cached !== null) {
    return cached as T;
  }

  // Create Next.js cached function
  const cachedFetcher = unstable_cache(
    fetcher,
    [storeId, cacheKey],
    {
      revalidate: config.ttl,
      tags: [...config.tags, `store:${storeId}`],
    }
  );

  const result = await cachedFetcher();

  // Store in memory cache
  if (result !== null) {
    memoryCache.set(cacheKey, result, storeId, config.ttl);
  }

  return result;
}

// =============================================================================
// CACHE INVALIDATION
// =============================================================================

export interface InvalidationResult {
  tag: string;
  memoryEntriesCleared: number;
  success: boolean;
}

/**
 * Invalidate cache by tag
 */
export async function invalidateCache(
  tag: string,
  storeId?: string
): Promise<InvalidationResult> {
  try {
    // Invalidate Next.js cache
    if (storeId) {
      revalidateTag(`store:${storeId}`);
    }
    revalidateTag(tag);

    // Invalidate memory cache
    const memoryCleared = memoryCache.invalidate(tag, storeId);

    return {
      tag,
      memoryEntriesCleared: memoryCleared,
      success: true,
    };
  } catch (error) {
    console.error(`[Cache] Invalidation failed for tag: ${tag}`, error);
    return {
      tag,
      memoryEntriesCleared: 0,
      success: false,
    };
  }
}

/**
 * Invalidate multiple cache tags
 */
export async function invalidateCaches(
  tags: string[],
  storeId?: string
): Promise<InvalidationResult[]> {
  return Promise.all(tags.map(tag => invalidateCache(tag, storeId)));
}

/**
 * Invalidate all cache for a store
 */
export async function invalidateStoreCache(storeId: string): Promise<void> {
  revalidateTag(`store:${storeId}`);
  memoryCache.invalidateByStoreId(storeId);
}

// =============================================================================
// PREDEFINED CACHE CONFIGS
// =============================================================================

export const CACHE_CONFIGS = {
  // Products - frequently changing
  products: {
    ttl: CACHE_TTL.MEDIUM,
    tags: [CACHE_TAGS.PRODUCTS],
  } as CacheConfig,

  // Single product - medium cache
  product: {
    ttl: CACHE_TTL.MEDIUM,
    tags: [CACHE_TAGS.PRODUCTS],
  } as CacheConfig,

  // Featured products - can be cached longer
  featuredProducts: {
    ttl: CACHE_TTL.LONG,
    tags: [CACHE_TAGS.PRODUCTS, CACHE_TAGS.HOMEPAGE],
  } as CacheConfig,

  // Categories - rarely change
  categories: {
    ttl: CACHE_TTL.VERY_LONG,
    tags: [CACHE_TAGS.CATEGORIES],
  } as CacheConfig,

  // Hero slides - medium cache
  heroSlides: {
    ttl: CACHE_TTL.LONG,
    tags: [CACHE_TAGS.HERO_SLIDES, CACHE_TAGS.HOMEPAGE],
  } as CacheConfig,

  // Homepage sections
  homepageSections: {
    ttl: CACHE_TTL.LONG,
    tags: [CACHE_TAGS.HOMEPAGE],
  } as CacheConfig,

  // Store settings - can be cached longer
  storeSettings: {
    ttl: CACHE_TTL.VERY_LONG,
    tags: [CACHE_TAGS.SETTINGS],
  } as CacheConfig,

  // Design settings
  designSettings: {
    ttl: CACHE_TTL.VERY_LONG,
    tags: [CACHE_TAGS.DESIGN],
  } as CacheConfig,

  // Pages - rarely change
  pages: {
    ttl: CACHE_TTL.VERY_LONG,
    tags: [CACHE_TAGS.PAGES],
  } as CacheConfig,

  // Orders - very short cache for freshness
  orders: {
    ttl: CACHE_TTL.VERY_SHORT,
    tags: [CACHE_TAGS.ORDERS],
  } as CacheConfig,
} as const;

// =============================================================================
// CACHE HELPERS
// =============================================================================

/**
 * Generate a cache key for a specific resource
 */
export function generateCacheKey(
  resource: keyof typeof CACHE_KEYS,
  ...params: string[]
): string {
  return [CACHE_KEYS[resource], ...params].join(':');
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
  return memoryCache.getStats();
}

/**
 * Clear all caches (use with caution)
 */
export function clearAllCaches(): void {
  memoryCache.clear();
  
  // Revalidate all known tags
  Object.values(CACHE_TAGS).forEach(tag => {
    try {
      revalidateTag(tag);
    } catch (e) {
      // Ignore errors during mass invalidation
    }
  });
}

// =============================================================================
// USER-SPECIFIC CACHE OPERATIONS
// =============================================================================

/**
 * User-specific cache tags that should be cleared on logout/login
 */
export const USER_CACHE_TAGS = [
  CACHE_TAGS.ORDERS,
  'user-profile',
  'user-addresses',
  'user-cart',
  'user-wishlist',
  'user-preferences',
] as const;

/**
 * Clear user-specific cache entries
 * Call this on:
 * - Logout: Clear all user data for security/privacy
 * - Login: Clear stale user data to get fresh data
 */
export function clearUserCache(options?: { 
  storeId?: string;
  includeOrders?: boolean;
}): number {
  const { storeId, includeOrders = true } = options || {};
  let totalCleared = 0;

  // Clear user-related patterns from memory cache
  const userPatterns = [
    'user-',
    'profile',
    'addresses',
    'cart',
    'wishlist',
    'preferences',
  ];

  if (includeOrders) {
    userPatterns.push('order', CACHE_KEYS.USER_ORDERS, CACHE_KEYS.ORDER_BY_ID);
  }

  userPatterns.forEach(pattern => {
    totalCleared += memoryCache.invalidate(pattern, storeId);
  });

  // Revalidate Next.js cache tags
  USER_CACHE_TAGS.forEach(tag => {
    try {
      revalidateTag(tag);
    } catch (e) {
      // Ignore errors
    }
  });

  if (storeId) {
    try {
      revalidateTag(`store:${storeId}`);
    } catch (e) {
      // Ignore errors
    }
  }

  console.log(`[Cache] Cleared ${totalCleared} user-specific cache entries`);
  return totalCleared;
}

/**
 * Clear ALL cache on logout (complete cleanup)
 * This ensures no user data persists after logout
 */
export function clearCacheOnLogout(storeId?: string): void {
  console.log('[Cache] Clearing ALL cache on logout...');
  
  // Clear memory cache completely for security
  memoryCache.clear();
  
  // Revalidate all tags
  [...Object.values(CACHE_TAGS), ...USER_CACHE_TAGS].forEach(tag => {
    try {
      revalidateTag(tag);
    } catch (e) {
      // Ignore errors
    }
  });

  console.log('[Cache] Logout cache clear complete');
}

/**
 * Clear user cache on login (fresh start)
 * Only clears user-specific data to get fresh user data
 */
export function clearCacheOnLogin(storeId?: string): void {
  console.log('[Cache] Clearing user-specific cache on login...');
  clearUserCache({ storeId, includeOrders: true });
  console.log('[Cache] Login cache clear complete');
}
