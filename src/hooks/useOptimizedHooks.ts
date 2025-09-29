/**
 * HOOKS OPTIMISÉS - Memoisation et performance
 */

import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';

// Hook pour les calculs lourds avec memoization profonde
export function useHeavyCalculation<T, Args extends unknown[]>(
  calculationFn: (...args: Args) => T,
  dependencies: Args,
  cacheKey?: string
): T {
  const cache = useRef(new Map<string, T>());
  
  return useMemo(() => {
    const depStr = JSON.stringify(dependencies);
    const key = cacheKey || (depStr ?? 'default-key');
    
    if (cache.current.has(key)) {
      return cache.current.get(key)!;
    }
    
    const result = calculationFn(...dependencies);
    cache.current.set(key, result);
    
    // Nettoyer le cache si trop grand
    if (cache.current.size > 50) {
      const firstKey = cache.current.keys().next().value;
      if (firstKey) cache.current.delete(firstKey);
    }
    
    return result;
  }, dependencies);
}

// Hook pour les métriques avec mise en cache intelligente
export function useOptimizedMetrics<T>(
  fetchFn: () => Promise<T>,
  options: {
    queryKey: (string | number)[];
    staleTime?: number;
    refetchInterval?: number;
    enabled?: boolean;
  }
) {
  const { queryKey, staleTime = 5 * 60 * 1000, refetchInterval, enabled = true } = options;
  
  return useQuery({
    queryKey,
    queryFn: fetchFn,
    staleTime,
    refetchInterval,
    enabled,
    // Cache plus long pour les métriques
    gcTime: 15 * 60 * 1000,
    // Background refetch pour les données critiques
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    // Optimisation réseau
    networkMode: 'online'
  } as UseQueryOptions);
}

// Hook pour la recherche avec debounce et cache
export function useOptimizedSearch<T>(
  searchFn: (query: string) => Promise<T[]>,
  options: {
    debounceMs?: number;
    minQueryLength?: number;
    cacheResults?: boolean;
  } = {}
) {
  const { debounceMs = 300, minQueryLength = 2, cacheResults = true } = options;
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, debounceMs);
  const cache = useRef(new Map<string, T[]>());
  
  const { data: results, error } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < minQueryLength) return [];
      
      setIsSearching(true);
      try {
        // Vérifier le cache
        if (cacheResults && cache.current.has(debouncedQuery)) {
          return cache.current.get(debouncedQuery)!;
        }
        
        const results = await searchFn(debouncedQuery);
        
        // Mettre en cache
        if (cacheResults) {
          cache.current.set(debouncedQuery, results);
        }
        
        return results;
      } finally {
        setIsSearching(false);
      }
    },
    enabled: debouncedQuery.length >= minQueryLength,
    staleTime: 2 * 60 * 1000, // 2 minutes pour les recherches
    gcTime: 5 * 60 * 1000
  });
  
  const clearCache = useCallback(() => {
    cache.current.clear();
  }, []);
  
  return {
    query,
    setQuery,
    results: results || [],
    isSearching,
    error,
    clearCache
  };
}

// Hook pour l'invalidation intelligente des caches
export function useSmartInvalidation() {
  const queryClient = useQueryClient();
  
  const invalidateRelated = useCallback((baseKey: string, related: string[] = []) => {
    // Invalidation en cascade intelligente
    const keysToInvalidate = [baseKey, ...related];
    
    return Promise.all(
      keysToInvalidate.map(key => 
        queryClient.invalidateQueries({ queryKey: [key] })
      )
    );
  }, [queryClient]);
  
  const prefetchRelated = useCallback((baseKey: string, prefetchFns: (() => Promise<unknown>)[]) => {
    // Préchargement des données relacionées
    return Promise.all(
      prefetchFns.map((fn, index) => 
        queryClient.prefetchQuery({
          queryKey: [`${baseKey}_related_${index}`],
          queryFn: fn,
          staleTime: 5 * 60 * 1000
        })
      )
    );
  }, [queryClient]);
  
  return { invalidateRelated, prefetchRelated };
}

// Hook pour les données temps réel optimisées
export function useOptimizedRealtime<T>(
  subscriptionFn: (callback: (data: T) => void) => () => void,
  options: {
    throttleMs?: number;
    bufferSize?: number;
    enabled?: boolean;
  } = {}
) {
  const { throttleMs = 1000, bufferSize = 10, enabled = true } = options;
  const [data, setData] = useState<T[]>([]);
  const buffer = useRef<T[]>([]);
  const lastUpdate = useRef<number>(0);
  
  useEffect(() => {
    if (!enabled) return;
    
    const unsubscribe = subscriptionFn((newData) => {
      const now = Date.now();
      
      // Throttling des mises à jour
      if (now - lastUpdate.current < throttleMs) {
        buffer.current.push(newData);
        return;
      }
      
      // Vider le buffer et mettre à jour
      const allNewData = [newData, ...buffer.current];
      buffer.current = [];
      lastUpdate.current = now;
      
      setData(prev => {
        const combined = [...allNewData, ...prev];
        return combined.slice(0, bufferSize);
      });
    });
    
    return unsubscribe;
  }, [subscriptionFn, throttleMs, bufferSize, enabled]);
  
  const clearData = useCallback(() => {
    setData([]);
    buffer.current = [];
  }, []);
  
  return { data, clearData };
}

// Hook pour les filtres avec état optimisé
export function useOptimizedFilters<T extends Record<string, unknown>>(
  initialFilters: T
) {
  const [filters, setFilters] = useState<T>(initialFilters);
  const [activeCount, setActiveCount] = useState(0);
  
  const updateFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Compter les filtres actifs
      const count = Object.values(newFilters).filter(v => 
        v !== null && v !== undefined && v !== '' && v !== false
      ).length;
      setActiveCount(count);
      
      return newFilters;
    });
  }, []);
  
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setActiveCount(0);
  }, [initialFilters]);
  
  const hasActiveFilters = activeCount > 0;
  
  return {
    filters,
    updateFilter,
    resetFilters,
    hasActiveFilters,
    activeCount
  };
}

// Export par défaut
export default {
  useHeavyCalculation,
  useOptimizedMetrics,
  useOptimizedSearch,
  useSmartInvalidation,
  useOptimizedRealtime,
  useOptimizedFilters
};