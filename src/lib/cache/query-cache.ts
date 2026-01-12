/**
 * @deprecated Use the new cache modules in @/lib/cache instead
 * This file is kept for backward compatibility
 * 
 * New imports:
 * - import { getCachedProducts, invalidateProductCache } from '@/lib/cache/products-cache'
 * - import { getCachedCategories } from '@/lib/cache/categories-cache'
 * - import { getCachedHeroSlides } from '@/lib/cache/homepage-cache'
 * - import { useCache } from '@/lib/cache/use-cache'
 */

// Re-export from new cache system for backward compatibility
export {
  CACHE_TAGS,
  CACHE_TTL as CACHE_DURATION,
  CACHE_CONFIGS,
  invalidateCache,
  invalidateCaches,
  withCache,
  getCacheStats,
} from './index';

export {
  getCachedProducts as cachedGetAllProducts,
  getCachedProductById as cachedGetProductById,
  getCachedFeaturedProducts as cachedGetFeaturedProducts,
  invalidateProductCache,
} from './products-cache';

export {
  getCachedCategories as cachedGetAllCategories,
  invalidateCategoryCache,
} from './categories-cache';

export {
  getCachedHeroSlides as cachedGetHeroSlides,
  invalidateHeroSlidesCache,
  invalidateHomepageCache,
} from './homepage-cache';

export {
  getCachedStoreSettings,
  getCachedDesignSettings,
  invalidateStoreSettingsCache,
  invalidateDesignSettingsCache,
} from './settings-cache';

// Legacy exports for backward compatibility
import { CACHE_TAGS } from './index';

export const revalidateTags = {
  products: () => ({ tag: CACHE_TAGS.PRODUCTS }),
  categories: () => ({ tag: CACHE_TAGS.CATEGORIES }),
  heroSlides: () => ({ tag: CACHE_TAGS.HERO_SLIDES }),
  orders: () => ({ tag: CACHE_TAGS.ORDERS }),
  homepage: () => ({ tag: CACHE_TAGS.HOMEPAGE }),
};
