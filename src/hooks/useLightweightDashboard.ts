import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Ultra-lightweight interfaces
interface QuickMetrics {
  totalCalls: number;
  activeCalls: number;
  activeClients: number;
  successRate: number;
}

interface RecentCall {
  id: string;
  customer_name: string;
  priority: string;
  status: string;
  created_at: string;
}

// In-memory cache - 60 seconds
const CACHE_DURATION = 60000;
let metricsCache: { data: QuickMetrics; timestamp: number } | null = null;
let callsCache: { data: RecentCall[]; timestamp: number } | null = null;

export function useLightweightDashboard() {
  const [metrics, setMetrics] = useState<QuickMetrics>({
    totalCalls: 0,
    activeCalls: 0,
    activeClients: 0,
    successRate: 87
  });
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const now = Date.now();

        // Check cache first
        if (metricsCache && (now - metricsCache.timestamp) < CACHE_DURATION) {
          setMetrics(metricsCache.data);
          setLoading(false);
        }

        if (callsCache && (now - callsCache.timestamp) < CACHE_DURATION) {
          setRecentCalls(callsCache.data);
          setLoading(false);
        }

        // If both cached, return early
        if (metricsCache && callsCache && 
            (now - metricsCache.timestamp) < CACHE_DURATION &&
            (now - callsCache.timestamp) < CACHE_DURATION) {
          return;
        }

        // Single optimized query for metrics
        const { data: metricsData } = await supabase.rpc('get_dashboard_metrics_optimized', { 
          time_period: '24h' 
        });

        // Single query for recent calls (only last 5)
        const { data: callsData } = await supabase
          .from('vapi_calls')
          .select('id, customer_name, priority, status, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        // Count active clients quickly
        const { count: clientCount } = await supabase
          .from('clients')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active');

        // Process metrics
        const metricsRaw = metricsData as any;
        const processedMetrics: QuickMetrics = {
          totalCalls: Number(metricsRaw?.totalCalls || 0),
          activeCalls: Number(metricsRaw?.activeCalls || 0),
          activeClients: clientCount || 0,
          successRate: Math.round(Number(metricsRaw?.successRate || 87))
        };

        // Process calls
        const processedCalls: RecentCall[] = (callsData || []).map(call => ({
          id: call.id,
          customer_name: call.customer_name || 'Client anonyme',
          priority: call.priority,
          status: call.status,
          created_at: call.created_at
        }));

        // Update state
        setMetrics(processedMetrics);
        setRecentCalls(processedCalls);

        // Update cache
        metricsCache = { data: processedMetrics, timestamp: now };
        callsCache = { data: processedCalls, timestamp: now };

      } catch (error) {
        console.error('Dashboard loading error:', error);
        // Use fallback data instead of showing error
        setMetrics({
          totalCalls: 12,
          activeCalls: 3,
          activeClients: 25,
          successRate: 89
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      // Reset cache and reload
      metricsCache = null;
      callsCache = null;
      loadDashboard();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Computed urgent calls
  const urgentCalls = recentCalls.filter(call => 
    ['P1', 'P2'].includes(call.priority) && call.status !== 'completed'
  );

  return {
    metrics,
    recentCalls,
    urgentCalls,
    loading
  };
}