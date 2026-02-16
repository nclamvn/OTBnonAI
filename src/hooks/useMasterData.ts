// ═══════════════════════════════════════════════════════════════════════════
// useMasterData - Centralized Master Data Fetching with In-Memory Cache
// Replaces duplicate useEffect blocks in BudgetAllocate/SKUProposal/OTBAnalysis
// ═══════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react';
import { masterDataService } from '@/services';

interface MasterDataState {
  genders: any[];
  categories: any[];
  stores: any[];
  brands: any[];
  collections: any[];
  seasons: any[];
}

interface UseMasterDataOptions {
  /** Fetch only these data types */
  include?: (keyof MasterDataState)[];
  /** Skip fetching entirely */
  skip?: boolean;
}

// In-memory cache shared across hook instances
const cache: Partial<MasterDataState> = {};
let cacheTimestamp: number | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const isCacheValid = (): boolean => {
  if (!cacheTimestamp) return false;
  return Date.now() - cacheTimestamp < CACHE_TTL;
};

const fetchers: Record<keyof MasterDataState, () => Promise<any[]>> = {
  genders: () => masterDataService.getGenders(),
  categories: () => masterDataService.getCategories(),
  stores: () => masterDataService.getStores(),
  brands: () => masterDataService.getBrands(),
  collections: () => masterDataService.getCollections(),
  seasons: () => masterDataService.getSeasons(),
};

export function useMasterData(options: UseMasterDataOptions = {}) {
  const { include, skip = false } = options;

  const [state, setState] = useState<MasterDataState>({
    genders: cache.genders || [],
    categories: cache.categories || [],
    stores: cache.stores || [],
    brands: cache.brands || [],
    collections: cache.collections || [],
    seasons: cache.seasons || [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const keysToFetch = (include || Object.keys(fetchers)) as (keyof MasterDataState)[];

  const fetchData = useCallback(async () => {
    if (skip) return;

    // Check which keys actually need fetching
    const keysNeeded = keysToFetch.filter(
      (key) => !cache[key] || !isCacheValid()
    );

    if (keysNeeded.length === 0) {
      // All data is cached — just ensure state is synced
      setState((prev) => {
        const next = { ...prev };
        keysToFetch.forEach((key) => {
          if (cache[key]) next[key] = cache[key]!;
        });
        return next;
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await Promise.allSettled(
        keysNeeded.map((key) => fetchers[key]())
      );

      const newState: Partial<MasterDataState> = {};
      keysNeeded.forEach((key, i) => {
        const result = results[i];
        const value = result.status === 'fulfilled' ? result.value : [];
        if (!Array.isArray(value)) {
          newState[key] = [];
        } else {
          newState[key] = value;
        }
      });

      // Update cache
      Object.assign(cache, newState);
      cacheTimestamp = Date.now();

      setState((prev) => ({ ...prev, ...newState }));
    } catch (err) {
      console.error('[useMasterData] Error:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch master data'));
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip, include?.join(',')]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    isLoading,
    error,
    refetch: fetchData,
  };
}

export default useMasterData;
