// Query Cache for Server Components - improves performance by caching database queries

import { unstable_cache } from 'next/cache';

// Cache configuration
const CACHE_TAGS = {
  products: 'products',
  categories: 'categories',
  heroSlides: 'hero-slides',
  orders: 'orders',
  homepage: 'homepage',
} as const;

const CACHE_DURATION = {
  short: 60, // 1 minute
  medium: 300, // 5 minutes
  long: 3600, // 1 hour
  veryLong: 86400, // 24 hours
} as const;

/**
 * Cached product queries
 */
export const cachedGetAllProducts = unstable_cache(
  async (fetcher: () => Promise<any>) => {
    return await fetcher();
  },
  ['all-products'],
  { 
    revalidate: CACHE_DURATION.medium,
    tags: [CACHE_TAGS.products],
  }
);

export const cachedGetProductById = unstable_cache(
  async (id: string, fetcher: (id: string) => Promise<any>) => {
    return await fetcher(id);
  },
  ['product-by-id'],
  { 
    revalidate: CACHE_DURATION.medium,
    tags: [CACHE_TAGS.products],
  }
);

export const cachedGetFeaturedProducts = unstable_cache(
  async (fetcher: () => Promise<any>) => {
    return await fetcher();
  },
  ['featured-products'],
  { 
    revalidate: CACHE_DURATION.long,
    tags: [CACHE_TAGS.products, CACHE_TAGS.homepage],
  }
);

/**
 * Cached category queries
 */
export const cachedGetAllCategories = unstable_cache(
  async (fetcher: () => Promise<any>) => {
    return await fetcher();
  },
  ['all-categories'],
  { 
    revalidate: CACHE_DURATION.veryLong,
    tags: [CACHE_TAGS.categories],
  }
);

/**
 * Cached hero slides
 */
export const cachedGetHeroSlides = unstable_cache(
  async (fetcher: () => Promise<any>) => {
    return await fetcher();
  },
  ['hero-slides'],
  { 
    revalidate: CACHE_DURATION.long,
    tags: [CACHE_TAGS.heroSlides, CACHE_TAGS.homepage],
  }
);

/**
 * Cached orders for user
 */
export const cachedGetUserOrders = unstable_cache(
  async (userId: string, fetcher: (userId: string) => Promise<any>) => {
    return await fetcher(userId);
  },
  ['user-orders'],
  { 
    revalidate: CACHE_DURATION.short,
    tags: [CACHE_TAGS.orders],
  }
);

/**
 * Cache invalidation helpers
 */
export const revalidateTags = {
  products: () => ({ tag: CACHE_TAGS.products }),
  categories: () => ({ tag: CACHE_TAGS.categories }),
  heroSlides: () => ({ tag: CACHE_TAGS.heroSlides }),
  orders: () => ({ tag: CACHE_TAGS.orders }),
  homepage: () => ({ tag: CACHE_TAGS.homepage }),
};
