import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import logger from '@/lib/logger';

interface DashboardMetrics {
  totalCalls: number;
  activeCalls: number;
  activeClients: number;
  successRate: number;
}

interface Call {
  id: string;
  customer_name: string | null;
  created_at: string | null;
  status: string | null;
  priority: string | null;
}

export const useUltraFastDashboard = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCalls: 0,
    activeCalls: 0,
    activeClients: 0,
    successRate: 0
  });
  const [recentCalls, setRecentCalls] = useState<Call[]>([]);
  const [urgentCalls, setUrgentCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard metrics
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('get_dashboard_metrics_optimized', { time_period: '24h' });

      if (metricsError) throw metricsError;

      // Fetch recent calls
      const { data: callsData, error: callsError } = await supabase
        .from('vapi_calls')
        .select('id, customer_name, created_at, status, priority')
        .order('created_at', { ascending: false })
        .limit(10);

      if (callsError) throw callsError;

      // Fetch urgent calls
      const { data: urgentData, error: urgentError } = await supabase
        .from('vapi_calls')
        .select('id, customer_name, created_at, status, priority')
        .in('priority', ['P1', 'P2'])
        .neq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5);

      if (urgentError) throw urgentError;

      setMetrics({
        totalCalls: (metricsData as any)?.totalCalls || 0,
        activeCalls: (metricsData as any)?.activeCalls || 0,
        activeClients: (metricsData as any)?.activeClients || 0,
        successRate: (metricsData as any)?.successRate || 0
      });

      setRecentCalls(callsData || []);
      setUrgentCalls(urgentData || []);

    } catch (err) {
      const normalizedError = err instanceof Error ? err : new Error(String(err));
      logger.error('Dashboard data fetch error', normalizedError);
      setError(normalizedError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    stats: {
      totalClients: metrics.activeClients,
      totalCalls: metrics.totalCalls,
      totalInterventions: 0,
      activeClients: metrics.activeClients
    },
    metrics,
    recentCalls,
    urgentCalls,
    loading,
    error
  };
};
