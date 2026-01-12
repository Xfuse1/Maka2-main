/**
 * 🎣 Client-Side Cache Hooks
 * ===========================
 * SWR-like caching for React components
 */

"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

// =============================================================================
// TYPES
// =============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface UseCacheOptions {
  /** Time to live in milliseconds */
  ttl?: number;
  /** Revalidate on mount */
  revalidateOnMount?: boolean;
  /** Revalidate on window focus */
  revalidateOnFocus?: boolean;
  /** Revalidate interval in milliseconds */
  revalidateInterval?: number;
  /** Dedupe interval in milliseconds */
  dedupingInterval?: number;
  /** Initial data */
  initialData?: any;
  /** Error retry count */
  errorRetryCount?: number;
}

interface UseCacheResult<T> {
  data: T | undefined;
  error: Error | undefined;
  isLoading: boolean;
  isValidating: boolean;
  mutate: (data?: T | ((current: T | undefined) => T)) => void;
  refresh: () => Promise<void>;
}

// =============================================================================
// CLIENT CACHE STORE
// =============================================================================

const clientCache = new Map<string, CacheEntry<any>>();
const inflightRequests = new Map<string, Promise<any>>();

/**
 * Get from client cache
 */
function getFromCache<T>(key: string): T | null {
  const entry = clientCache.get(key);
  
  if (!entry) return null;
  
  // Check if expired
  if (Date.now() > entry.expiresAt) {
    clientCache.delete(key);
    return null;
  }
  
  return entry.data;
}

/**
 * Set in client cache
 */
function setInCache<T>(key: string, data: T, ttlMs: number): void {
  clientCache.set(key, {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Invalidate client cache
 */
export function invalidateClientCache(pattern?: string): number {
  if (!pattern) {
    const size = clientCache.size;
    clientCache.clear();
    return size;
  }
  
  let count = 0;
  clientCache.forEach((_, key) => {
    if (key.includes(pattern)) {
      clientCache.delete(key);
      count++;
    }
  });
  
  return count;
}

// =============================================================================
// USE CACHE HOOK
// =============================================================================

/**
 * SWR-like cache hook for client-side data fetching
 * 
 * @example
 * ```tsx
 * const { data, error, isLoading } = useCache(
 *   'products',
 *   () => fetch('/api/products').then(r => r.json()),
 *   { ttl: 60000 }
 * );
 * ```
 */
export function useCache<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: UseCacheOptions = {}
): UseCacheResult<T> {
  const {
    ttl = 5 * 60 * 1000, // 5 minutes default
    revalidateOnMount = true,
    revalidateOnFocus = true,
    revalidateInterval,
    dedupingInterval = 2000,
    initialData,
    errorRetryCount = 3,
  } = options;

  const [data, setData] = useState<T | undefined>(() => {
    if (initialData) return initialData;
    if (key) {
      const cached = getFromCache<T>(key);
      if (cached) return cached;
    }
    return undefined;
  });
  
  const [error, setError] = useState<Error | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(!data);
  const [isValidating, setIsValidating] = useState(false);
  
  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const lastFetchRef = useRef(0);

  // Fetch function with deduplication
  const fetchData = useCallback(async (force = false): Promise<void> => {
    if (!key) return;

    const now = Date.now();
    
    // Dedupe requests within interval
    if (!force && now - lastFetchRef.current < dedupingInterval) {
      return;
    }

    // Check if there's already an inflight request
    const inflight = inflightRequests.get(key);
    if (inflight && !force) {
      try {
        const result = await inflight;
        if (mountedRef.current) {
          setData(result);
          setError(undefined);
        }
      } catch (err) {
        // Handled by the original request
      }
      return;
    }

    lastFetchRef.current = now;
    setIsValidating(true);

    // Create the fetch promise
    const fetchPromise = fetcher();
    inflightRequests.set(key, fetchPromise);

    try {
      const result = await fetchPromise;
      
      if (mountedRef.current) {
        setData(result);
        setError(undefined);
        setInCache(key, result, ttl);
        retryCountRef.current = 0;
      }
    } catch (err) {
      if (mountedRef.current) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        
        // Retry logic
        if (retryCountRef.current < errorRetryCount) {
          retryCountRef.current++;
          setTimeout(() => {
            fetchData(true);
          }, Math.min(1000 * Math.pow(2, retryCountRef.current), 30000));
        }
      }
    } finally {
      inflightRequests.delete(key);
      if (mountedRef.current) {
        setIsLoading(false);
        setIsValidating(false);
      }
    }
  }, [key, fetcher, ttl, dedupingInterval, errorRetryCount]);

  // Initial mount
  useEffect(() => {
    mountedRef.current = true;
    
    if (revalidateOnMount && key) {
      // Check cache first
      const cached = getFromCache<T>(key);
      if (cached) {
        setData(cached);
        setIsLoading(false);
        // Still revalidate in background
        fetchData();
      } else {
        fetchData();
      }
    }

    return () => {
      mountedRef.current = false;
    };
  }, [key]);

  // Revalidate on focus
  useEffect(() => {
    if (!revalidateOnFocus) return;

    const handleFocus = () => {
      if (key) fetchData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [revalidateOnFocus, fetchData, key]);

  // Revalidate interval
  useEffect(() => {
    if (!revalidateInterval || !key) return;

    const interval = setInterval(() => {
      fetchData();
    }, revalidateInterval);

    return () => clearInterval(interval);
  }, [revalidateInterval, fetchData, key]);

  // Mutate function
  const mutate = useCallback((newData?: T | ((current: T | undefined) => T)) => {
    if (!key) return;
    
    if (typeof newData === 'function') {
      const updater = newData as (current: T | undefined) => T;
      const updated = updater(data);
      setData(updated);
      setInCache(key, updated, ttl);
    } else if (newData !== undefined) {
      setData(newData);
      setInCache(key, newData, ttl);
    } else {
      // Revalidate
      fetchData(true);
    }
  }, [key, data, ttl, fetchData]);

  // Refresh function
  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    refresh,
  };
}

// =============================================================================
// SPECIALIZED HOOKS
// =============================================================================

/**
 * Hook for fetching products with caching
 */
export function useCachedProducts(storeId: string) {
  return useCache(
    storeId ? `products:${storeId}` : null,
    async () => {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      const json = await res.json();
      return json.data ?? [];
    },
    { ttl: 5 * 60 * 1000 } // 5 minutes
  );
}

/**
 * Hook for fetching categories with caching
 */
export function useCachedCategories(storeId: string) {
  return useCache(
    storeId ? `categories:${storeId}` : null,
    async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const json = await res.json();
      return json.data ?? [];
    },
    { ttl: 30 * 60 * 1000 } // 30 minutes (categories rarely change)
  );
}

/**
 * Hook for fetching store settings with caching
 */
export function useCachedStoreSettings() {
  return useCache(
    'store-settings',
    async () => {
      const res = await fetch('/api/store-settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      const json = await res.json();
      return json.settings;
    },
    { 
      ttl: 60 * 60 * 1000, // 1 hour
      revalidateOnFocus: false,
    }
  );
}

/**
 * Hook for fetching hero slides with caching
 */
export function useCachedHeroSlides(storeId: string) {
  return useCache(
    storeId ? `hero-slides:${storeId}` : null,
    async () => {
      const res = await fetch('/api/hero-slides');
      if (!res.ok) throw new Error('Failed to fetch hero slides');
      const json = await res.json();
      return json.data ?? [];
    },
    { ttl: 15 * 60 * 1000 } // 15 minutes
  );
}
