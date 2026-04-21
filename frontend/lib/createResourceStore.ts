import { PaginatedResponse } from '@/types';
import { BasePaginationParams } from '@/hooks/usePaginatedData';

type CacheEntry<T> = {
    data: PaginatedResponse<T>;
    timestamp: number;
};

type CacheKey = string;

interface ResourceStoreOptions {
    ttl?: number; // Time-to-live in milliseconds for auto-invalidation
    invalidateOnMutation?: boolean; // Whether to invalidate on mutations (default: true)
}

export function createResourceStore<T>(name: string, options: ResourceStoreOptions = {}) {
    const { ttl, invalidateOnMutation = true } = options;
    
    const cache: Record<CacheKey, CacheEntry<T>> = {};
    const listeners = new Set<() => void>();

    function notify() {
        listeners.forEach(l => l());
    }

    function generateCacheKey(params: BasePaginationParams): CacheKey {
        return JSON.stringify(params);
    }

    function isExpired(entry: CacheEntry<T>): boolean {
        if (!ttl) return false;
        return Date.now() - entry.timestamp > ttl;
    }

    const store = {
        /**
         * Get cached data for a specific page/params
         * Returns null if not cached or expired (if TTL is set)
         */
        get(params: BasePaginationParams): PaginatedResponse<T> | null {
            const key = generateCacheKey(params);
            const entry = cache[key];
            
            if (!entry) {
                return null;
            }
            
            // Auto-invalidate if expired (TTL-based)
            if (ttl && isExpired(entry)) {
                delete cache[key];
                return null;
            }
            
            return entry.data;
        },

        /**
         * Set cached data for a specific page/params
         * Stores multiple pages separately without overwriting previous pages
         */
        set(params: BasePaginationParams, data: PaginatedResponse<T>): void {
            const key = generateCacheKey(params);
            cache[key] = {
                data,
                timestamp: Date.now()
            };
            notify();
        },

        /**
         * Check if data is cached for given params
         * For TTL-based stores, also checks if data is fresh
         */
        hasData(params: BasePaginationParams): boolean {
            const key = generateCacheKey(params);
            const entry = cache[key];
            
            if (!entry) {
                return false;
            }
            
            // For TTL-based stores, check if fresh
            if (ttl && isExpired(entry)) {
                delete cache[key];
                return false;
            }
            
            return true;
        },

        /**
         * Check if data is cached and fresh (for TTL-based stores)
         * Returns false if no TTL is set (always fresh for mutation-based stores)
         */
        hasFreshData(params: BasePaginationParams): boolean {
            if (!ttl) return true; // No TTL means always fresh
            return this.hasData(params);
        },

        /**
         * Invalidate entire store
         * For mutation-based stores, this is called on INSERT/UPDATE/DELETE operations
         */
        invalidate(): void {
            Object.keys(cache).forEach(key => delete cache[key]);
            notify();
        },

        /**
         * Invalidate specific cache entry by params
         */
        invalidateParams(params: BasePaginationParams): void {
            const key = generateCacheKey(params);
            delete cache[key];
            notify();
        },

        /**
         * Subscribe to store changes
         */
        subscribe(fn: () => void): () => void {
            listeners.add(fn);
            return () => listeners.delete(fn);
        },

        /**
         * Clear all cached data (e.g., on logout)
         */
        clear(): void {
            Object.keys(cache).forEach(key => delete cache[key]);
            notify();
        },

        /**
         * Get all cached pages (for debugging/inspection)
         */
        getAllCachedPages(): Record<CacheKey, PaginatedResponse<T>> {
            const result: Record<CacheKey, PaginatedResponse<T>> = {};
            Object.entries(cache).forEach(([key, entry]) => {
                result[key] = entry.data;
            });
            return result;
        },

        /**
         * Get cache size (number of cached pages)
         */
        getCacheSize(): number {
            return Object.keys(cache).length;
        },

        /**
         * Get store name (for debugging)
         */
        getName(): string {
            return name;
        },

        /**
         * Get store configuration (for debugging)
         */
        getConfig(): ResourceStoreOptions {
            return { ttl, invalidateOnMutation };
        }
    };

    return store;
}
