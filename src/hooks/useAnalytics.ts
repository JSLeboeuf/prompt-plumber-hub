import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { useEmergencyCalls, useClients } from '@/hooks/useProductionData';
import { useAuth } from '@/contexts/AuthContext';
import { Analytics, DashboardMetrics } from "@/shared/types";
import { logger } from '@/lib/logger';

export function useAnalytics(dateFrom?: string, dateTo?: string) {
  const params = new URLSearchParams();
  if (dateFrom) params.append("dateFrom", dateFrom);
  if (dateTo) params.append("dateTo", dateTo);

  return useQuery<Analytics[]>({
    queryKey: ["/api/analytics", params.toString()],
  });
}

export function useDashboardMetrics() {
  return useQuery<DashboardMetrics>({
    queryKey: ["/api/analytics/dashboard"],
    refetchInterval: 180000, // Optimisé: refresh toutes les 3 minutes
    staleTime: 120000, // Données fraîches pendant 2 minutes
    gcTime: 600000, // Garde en cache 10 minutes (remplace cacheTime)
  });
}

export function useCreateAnalytics() {
  return useMutation({
    mutationFn: async (analytics: Partial<Analytics>) => {
      const res = await apiRequest("POST", "/api/analytics", analytics);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
    },
  });
}

// Enhanced analytics hook for complete page logic
export const useAnalyticsPage = () => {
  const { canAccess } = useAuth();
  const { success, error: showError } = useToast();
  const canReadAnalytics = canAccess('analytics', 'read');

  // Use production data hooks
  const { calls, loading: callsLoading, error: callsError, fetchCalls } = useEmergencyCalls();
  const { clients, error: clientsError, fetchClients } = useClients();

  // Analytics state
  const [analytics, setAnalytics] = useState<DashboardMetrics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // UI state
  const [selectedPeriod, setSelectedPeriod] = useState('24h');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch analytics with proper error handling
  const fetchAnalytics = useCallback(async (period: string = selectedPeriod) => {
    if (!canReadAnalytics) {
      return;
    }
    try {
      setAnalyticsLoading(true);
      setAnalyticsError(null);

      const { data, error } = await supabase
        .rpc('get_dashboard_metrics_optimized', { time_period: period });

      if (error) throw error;

      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setAnalytics(data as unknown as DashboardMetrics);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement analytics';
      setAnalyticsError(errorMessage);

      // Only show toast for critical errors
      if (process.env.NODE_ENV === 'development') {
        showError("Erreur Analytics", errorMessage);
      }
    } finally {
      setAnalyticsLoading(false);
    }
  }, [selectedPeriod, showError, canReadAnalytics]);

  // Load analytics on mount and period change
  useEffect(() => {
    if (!canReadAnalytics) {
      return;
    }
    fetchAnalytics();
  }, [fetchAnalytics, canReadAnalytics]);

  // Handle period change
  const handlePeriodChange = useCallback(async (period: string) => {
    setSelectedPeriod(period);
    await fetchAnalytics(period);
  }, [fetchAnalytics]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (!canReadAnalytics) {
      return;
    }
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchAnalytics(selectedPeriod),
        fetchCalls(),
        fetchClients()
      ]);
      success("Données actualisées", "Les métriques ont été mises à jour");
    } catch (error) {
      logger.error('Failed to refresh analytics data:', error);
      // Error handling is done in individual functions
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchAnalytics, selectedPeriod, fetchCalls, fetchClients, success, canReadAnalytics]);

  // Real-time metrics calculation
  const realTimeMetrics = useMemo(() => {
    try {
      const safeCallsLength = calls?.length || 0;
      const activeCalls = calls?.filter(c => c.status === 'active')?.length || 0;
      const completedCalls = calls?.filter(c => c.status === 'completed')?.length || 0;
      const urgentCalls = calls?.filter(c => c.priority === 'P1')?.length || 0;

      const totalDuration = calls?.reduce((acc, call) => acc + (call.duration || 0), 0) || 0;
      const avgDuration = safeCallsLength > 0 ? Math.round(totalDuration / safeCallsLength) : 0;

      const successRate = safeCallsLength > 0
        ? Math.round((completedCalls / safeCallsLength) * 100)
        : 0;

      return {
        totalCalls: safeCallsLength,
        activeCalls,
        completedCalls,
        urgentCalls,
        avgDuration,
        successRate
      };
    } catch (error) {
      logger.error('Error calculating real-time metrics:', error);
      return {
        totalCalls: 0,
        activeCalls: 0,
        completedCalls: 0,
        urgentCalls: 0,
        avgDuration: 0,
        successRate: 0
      };
    }
  }, [calls]);

  return {
    // Data
    analytics,
    calls,
    clients,
    realTimeMetrics,

    // Loading states
    analyticsLoading,
    callsLoading,
    isRefreshing,
    isExporting,

    // Error states
    analyticsError,
    callsError,
    clientsError,

    // UI state
    selectedPeriod,

    // Actions
    handlePeriodChange,
    handleRefresh,
    setIsExporting,

    // Permissions
    canReadAnalytics
  };
};
