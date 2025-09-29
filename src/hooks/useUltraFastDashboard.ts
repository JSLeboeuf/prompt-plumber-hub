import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { optimizedServices } from '@/services/optimizedServices';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { logger } from '@/lib/logger';

/**
 * Phase 3: Ultra-fast dashboard hook using optimized RPC functions
 */

export const useUltraFastDashboard = (timePeriod: '1h' | '24h' | '7d' | '30d' = '24h') => {
  const queryClient = useQueryClient();
  
  const {
    data: metrics,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['dashboard-metrics-ultra-fast', timePeriod],
    queryFn: () => optimizedServices.getDashboardMetricsUltraFast(timePeriod),
    staleTime: 30000,
    gcTime: 300000,
    refetchInterval: 60000,
    retry: (failureCount, error) => {
      logger.warn('Dashboard metrics retry:', { failureCount, error: error as Error });
      return failureCount < 2;
    }
  });

  const handleRealtimeUpdate = useCallback((payload: any) => {
    logger.info('Real-time dashboard update:', payload.eventType);
    queryClient.invalidateQueries({ queryKey: ['dashboard-metrics-ultra-fast'] });
  }, [queryClient]);

  useRealtimeSubscription({
    table: 'vapi_calls',
    event: '*',
    onInsert: handleRealtimeUpdate,
    onUpdate: handleRealtimeUpdate,
    onDelete: handleRealtimeUpdate,
    enabled: true
  });

  return {
    metrics: metrics || {
      totalCalls: 0,
      activeCalls: 0,
      completedCalls: 0,
      avgDuration: 0,
      urgentCalls: 0,
      activeClients: 0,
      successRate: 0,
      recentCalls: [],
      timeRange: timePeriod,
      timestamp: Date.now()
    },
    isLoading,
    error,
    refetch,
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics-ultra-fast'] });
    }
  };
};

export const useBatchOperations = () => {
  const queryClient = useQueryClient();

  const batchUpdateStatus = useCallback(async (callIds: string[], status: string) => {
    try {
      const result = await optimizedServices.batchUpdateCallStatus(callIds, status);
      
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['dashboard-metrics-ultra-fast'] });
        queryClient.invalidateQueries({ queryKey: ['vapi-calls'] });
      }
      
      return result;
    } catch (error) {
      logger.error('Batch operation error:', error as Error);
      return { success: false, error: 'Batch operation failed' };
    }
  }, [queryClient]);

  return { batchUpdateStatus };
};