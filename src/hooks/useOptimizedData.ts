import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { useToast } from './useToast';

export interface OptimizedDataOptions<T> {
  table: string;
  select?: string;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  filter?: Record<string, any>;
  realtime?: boolean;
  cacheDuration?: number;
}

interface CacheEntry<T> {
  data: T[];
  timestamp: number;
  key: string;
}

const cache = new Map<string, CacheEntry<any>>();

export function useOptimizedData<T = any>({
  table,
  select = '*',
  orderBy = { column: 'created_at', ascending: false },
  limit,
  filter,
  realtime = true,
  cacheDuration = 5 * 60 * 1000
}: OptimizedDataOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const cacheKey = useMemo(() => {
    return `${table}_${JSON.stringify({ select, orderBy, limit, filter })}`;
  }, [table, select, orderBy, limit, filter]);

  const getCachedData = useCallback(() => {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      return cached.data;
    }
    return null;
  }, [cacheKey, cacheDuration]);

  const fetchData = useCallback(async (useCache = true) => {
    try {
      setError(null);
      
      if (useCache) {
        const cachedData = getCachedData();
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      
      let queryBuilder: any = supabase.from(table).select(select);
      
      if (orderBy) {
        queryBuilder = queryBuilder.order(orderBy.column, { ascending: orderBy.ascending });
      }

      if (limit) {
        queryBuilder = queryBuilder.limit(limit);
      }

      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          queryBuilder = queryBuilder.eq(key, value);
        });
      }

      const { data: result, error: supabaseError } = await queryBuilder;

      if (supabaseError) throw supabaseError;
      
      const typedData = (result || []) as T[];
      setData(typedData);
      
      cache.set(cacheKey, {
        data: typedData,
        timestamp: Date.now(),
        key: cacheKey
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement';
      setError(errorMessage);
      
      if (process.env.NODE_ENV === 'development') {
        toast.error("Erreur", `Impossible de charger ${table}: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  }, [table, select, orderBy, limit, filter, cacheKey, getCachedData, toast]);

  const handleInsert = useCallback((payload: any) => {
    setData(prev => {
      const newItem = payload.new as T;
      const updated = [newItem, ...prev];
      
      cache.set(cacheKey, {
        data: updated,
        timestamp: Date.now(),
        key: cacheKey
      });
      
      return limit ? updated.slice(0, limit) : updated;
    });
  }, [cacheKey, limit]);

  const handleUpdate = useCallback((payload: any) => {
    setData(prev => {
      const updated = prev.map((item: any) => 
        (item as any).id === (payload.new as any).id ? payload.new as T : item
      );
      
      cache.set(cacheKey, {
        data: updated,
        timestamp: Date.now(),
        key: cacheKey
      });
      
      return updated;
    });
  }, [cacheKey]);

  const handleDelete = useCallback((payload: any) => {
    setData(prev => {
      const updated = prev.filter((item: any) => (item as any).id !== (payload.old as any).id);
      
      cache.set(cacheKey, {
        data: updated,
        timestamp: Date.now(),
        key: cacheKey
      });
      
      return updated;
    });
  }, [cacheKey]);

  useRealtimeSubscription({
    table,
    enabled: realtime,
    onInsert: handleInsert,
    onUpdate: handleUpdate,
    onDelete: handleDelete
  });

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData(false);
  }, [fetchData]);

  const clearCache = useCallback(() => {
    cache.delete(cacheKey);
  }, [cacheKey]);

  return {
    data,
    loading,
    error,
    refresh,
    clearCache
  };
}