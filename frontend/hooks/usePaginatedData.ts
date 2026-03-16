import { useState, useEffect, useCallback, useRef } from 'react';
import { PaginatedResponse } from '@/types';

interface CacheEntry<T> {
    data: PaginatedResponse<T>;
    timestamp: number;
}

const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

// Generic type for pagination parameters
export interface BasePaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    [key: string]: unknown; // Allow for extra filter fields
}

export function usePaginatedData<T, P extends BasePaginationParams = BasePaginationParams>(
    fetcher: (params: P) => Promise<PaginatedResponse<T>>,
    initialParams: P,
    cacheKeyPrefix: string
) {
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
        const { page, limit, sortBy, sortOrder, ...filters } = p;
        
        // Check if any filter has a value that isn't empty or default
        return Object.values(filters).every(v => 
            v === undefined || v === '' || v === 'ALL' || v === false || v === null
        );
    }, []);

    const fetchData = useCallback(async (currentParams: P, useCache = true) => {
        const cacheKey = `${cacheKeyPrefixRef.current}-${JSON.stringify(currentParams)}`;
        const canCache = isCacheable(currentParams);
        
        if (useCache && canCache && cache.current[cacheKey]) {
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
            
            // Only update cache if it's a default (non-filtered) page
            if (canCache) {
                cache.current[cacheKey] = {
                    data: result,
                    timestamp: Date.now()
                };
            }
            
            setData(result);
        } catch (error) {
            console.error('Error fetching paginated data:', error);
        } finally {
            setLoading(false);
            setFetching(false);
        }
    }, [isCacheable]);

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

    return {
        data,
        loading,
        fetching,
        params,
        updateParams,
        refresh
    };
}
