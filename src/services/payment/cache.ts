/**
 * Simple in-memory cache for high-performance lookups
 */
class SimpleCache<T> {
    private cache: Map<string, { value: T; expires: number }>;
    private maxSize: number;

    constructor(maxSize = 100) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }

    set(key: string, value: T, ttlMs = 300000): void { // Default 5 mins
        if (this.cache.size >= this.maxSize) {
            // Very simple: remove first item (oldest inserted)
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) this.cache.delete(firstKey);
        }
        this.cache.set(key, { value, expires: Date.now() + ttlMs });
    }

    get(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expires) {
            this.cache.delete(key);
            return null;
        }

        return entry.value;
    }

    delete(key: string): void {
        this.cache.delete(key);
    }
}

// Singleton for store secrets cache
export const storeSecretCache = new SimpleCache<string>(200);
