import { useState, useEffect, useCallback, useRef } from 'react';
import { PaginatedResponse } from '@/types';

interface CacheEntry<T> {
    data: PaginatedResponse<T>;
    timestamp: number;
}

const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

// Generic type for pagination parameters
export interface BasePaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    [key: string]: unknown; // Allow for extra filter fields
}

// Interface for external stores (organizationsStore, studentsStore, etc.)
export interface PaginatedDataStore<T> {
    get(params: BasePaginationParams): PaginatedResponse<T> | null;
    set(params: BasePaginationParams, data: PaginatedResponse<T>): void;
    hasData?(params: BasePaginationParams): boolean;
    hasFreshData?(params: BasePaginationParams): boolean;
    invalidate?(): void;
    invalidateParams?(params: BasePaginationParams): void;
}

export function usePaginatedData<T, P extends BasePaginationParams = BasePaginationParams>(
    fetcher: (params: P) => Promise<PaginatedResponse<T>>,
    initialParams: P,
    cacheKeyPrefix: string,
    options: { enabled?: boolean; store?: PaginatedDataStore<T> } = {}
) {
    const { enabled = true, store } = options;
    const [data, setData] = useState<PaginatedResponse<T> | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);
    const [params, setParams] = useState<P>(initialParams);

    // Stability: keep current versions in refs to avoid re-triggering effects
    // if the parent component passes a new function/object on every render.
    const fetcherRef = useRef(fetcher);
    useEffect(() => { fetcherRef.current = fetcher; }, [fetcher]);

    const cacheKeyPrefixRef = useRef(cacheKeyPrefix);
    useEffect(() => { cacheKeyPrefixRef.current = cacheKeyPrefix; }, [cacheKeyPrefix]);

    const storeRef = useRef(store);
    useEffect(() => { storeRef.current = store; }, [store]);

    // Sync params when initialParams changes (e.g. from URL search params change)
    // We use a serialized version to avoid reference identity issues.
    const initialParamsSerialized = JSON.stringify(initialParams);
    useEffect(() => {
        const parsed = JSON.parse(initialParamsSerialized);
        setParams(prev => {
            if (JSON.stringify(prev) === initialParamsSerialized) return prev;
            return parsed;
        });
    }, [initialParamsSerialized]);

    // Internal cache for the session
    const cache = useRef<Record<string, CacheEntry<T>>>({});

    const isCacheable = useCallback((p: P) => {
        // Standard pagination/sorting params are okay to cache.
        // But if any search or filter is active, it should be live.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { page, limit, sortBy, sortOrder, ...filters } = p;

        // Check if any filter has a value that isn't empty or default
        return Object.values(filters).every(v =>
            v === undefined || v === '' || v === 'ALL' || v === false || v === null
        );
    }, []);

    const fetchData = useCallback(async (currentParams: P, useCache = true) => {
        if (!enabled) return;
        const cacheKey = `${cacheKeyPrefixRef.current}-${JSON.stringify(currentParams)}`;
        const canCache = isCacheable(currentParams);
        const externalStore = storeRef.current;

        // Try external store first if provided
        if (useCache && canCache && externalStore) {
            // Check if store has hasFreshData method (for organizationsStore with TTL)
            if (externalStore.hasFreshData) {
                if (externalStore.hasFreshData(currentParams)) {
                    const cachedData = externalStore.get(currentParams);
                    if (cachedData) {
                        setData(cachedData);
                        setLoading(false);
                        setFetching(false);
                        return;
                    }
                }
            } else if (externalStore.hasData) {
                // For other stores, check if data exists
                if (externalStore.hasData(currentParams)) {
                    const cachedData = externalStore.get(currentParams);
                    if (cachedData) {
                        setData(cachedData);
                        setLoading(false);
                        setFetching(false);
                        return;
                    }
                }
            }
        }

        // Fall back to internal cache if no store or store miss
        if (useCache && canCache && !externalStore && cache.current[cacheKey]) {
            const entry = cache.current[cacheKey];
            if (Date.now() - entry.timestamp < CACHE_TTL) {
                setData(entry.data);
                setLoading(false);
                setFetching(false);
                return;
            }
        }

        try {
            // We only show the initial loading spinner if we don't have any data yet
            setFetching(true);

            const result = await fetcherRef.current(currentParams);

            // Update external store if provided and cacheable
            if (canCache && externalStore) {
                externalStore.set(currentParams, result);
            }

            // Only update internal cache if it's a default (non-filtered) page and no external store
            if (canCache && !externalStore) {
                cache.current[cacheKey] = {
                    data: result,
                    timestamp: Date.now()
                };
            }

            setData(result);
        } catch (error: unknown) {
            console.error('Error fetching paginated data:', error);
        } finally {
            setLoading(false);
            setFetching(false);
        }
    }, [enabled, isCacheable]);

    // Re-fetch when params change. 
    // Serialized version ensures we don't re-run if object reference changes but content is same.
    const currentParamsSerialized = JSON.stringify(params);
    useEffect(() => {
        fetchData(JSON.parse(currentParamsSerialized));
    }, [fetchData, currentParamsSerialized]);

    const updateParams = (newParams: Partial<P>) => {
        setParams((prev) => ({ ...prev, ...newParams }));
    };

    const refresh = () => {
        fetchData(params, false);
    };

    const invalidate = () => {
        const externalStore = storeRef.current;
        if (externalStore && externalStore.invalidate) {
            externalStore.invalidate();
        }
        // Also clear internal cache for this specific params
        const cacheKey = `${cacheKeyPrefixRef.current}-${JSON.stringify(params)}`;
        delete cache.current[cacheKey];
    };

    return {
        data,
        loading,
        fetching,
        params,
        updateParams,
        refresh,
        invalidate
    };
}
