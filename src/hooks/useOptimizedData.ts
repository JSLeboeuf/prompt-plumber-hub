import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';

// Lightweight interfaces for dashboard
interface DashboardCall {
  id: string;
  customer_name: string | null;
  status: string;
  priority: string;
  created_at: string;
  metadata?: Record<string, any>;
}

interface DashboardClient {
  id: string;
  name: string;
  status: string;
}

interface DashboardMetrics {
  totalCalls: number;
  activeCalls: number;
  completedCalls: number;
  avgDuration: number;
  successRate: number;
}

// Cache management
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

function getFromCache<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// Optimized hook for dashboard data
export function useDashboardData() {
  const [calls, setCalls] = useState<DashboardCall[]>([]);
  const [clients, setClients] = useState<DashboardClient[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { error: showError } = useToast();

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Check cache first
      const cachedCalls = getFromCache<DashboardCall[]>('dashboard_calls');
      const cachedClients = getFromCache<DashboardClient[]>('dashboard_clients');
      const cachedMetrics = getFromCache<DashboardMetrics>('dashboard_metrics');

      if (cachedCalls && cachedClients && cachedMetrics) {
        setCalls(cachedCalls);
        setClients(cachedClients);
        setMetrics(cachedMetrics);
        setLoading(false);
        return;
      }

      // Parallel queries for better performance
      const [callsResponse, clientsResponse, metricsResponse] = await Promise.all([
        supabase
          .from('vapi_calls')
          .select('id, customer_name, status, priority, created_at, metadata')
          .order('created_at', { ascending: false })
          .limit(20),
        
        supabase
          .from('clients')
          .select('id, name, status')
          .eq('status', 'active')
          .limit(10),
        
        supabase.rpc('get_dashboard_metrics_optimized', { time_period: '24h' })
      ]);

      if (callsResponse.error) throw callsResponse.error;
      if (clientsResponse.error) throw clientsResponse.error;
      if (metricsResponse.error) throw metricsResponse.error;

      const callsData = (callsResponse.data || []).map(call => ({
        ...call,
        metadata: call.metadata as Record<string, any>
      })) as DashboardCall[];
      const clientsData = clientsResponse.data || [];
      
      const metricsRaw = metricsResponse.data as any;
      const metricsData = metricsRaw ? {
        totalCalls: Number(metricsRaw.totalCalls || 0),
        activeCalls: Number(metricsRaw.activeCalls || 0),
        completedCalls: Number(metricsRaw.completedCalls || 0),
        avgDuration: Number(metricsRaw.avgDuration || 0),
        successRate: Number(metricsRaw.successRate || 0)
      } as DashboardMetrics : null;

      // Update state
      setCalls(callsData);
      setClients(clientsData);
      setMetrics(metricsData);

      // Cache the results
      setCache('dashboard_calls', callsData);
      setCache('dashboard_clients', clientsData);
      setCache('dashboard_metrics', metricsData);

    } catch (error: any) {
      console.error('Dashboard data error:', error);
      showError("Erreur", "Impossible de charger le tableau de bord");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Computed values
  const urgentCalls = useMemo(() => 
    calls.filter(call => 
      ['P1', 'P2'].includes(call.priority) && call.status !== 'completed'
    ).slice(0, 3),
    [calls]
  );

  const todayCalls = useMemo(() => 
    calls.filter(call => {
      const today = new Date().toDateString();
      const callDate = new Date(call.created_at).toDateString();
      return callDate === today;
    }),
    [calls]
  );

  useEffect(() => {
    fetchDashboardData();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  return {
    calls,
    clients,
    metrics,
    urgentCalls,
    todayCalls,
    loading,
    refetch: fetchDashboardData
  };
}

// Optimized hook for CRM page with pagination
export function useCRMData(page: number = 0, pageSize: number = 20) {
  const [clients, setClients] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const { success, error: showError } = useToast();

  const fetchCRMData = useCallback(async (reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setClients([]);
      }

      const offset = reset ? 0 : page * pageSize;

      // Parallel queries
      const [clientsResponse, leadsResponse] = await Promise.all([
        supabase
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + pageSize - 1),
        
        // Only load leads summary for performance
        supabase
          .from('leads')
          .select('id, nom, status')
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      if (clientsResponse.error) throw clientsResponse.error;
      if (leadsResponse.error) throw leadsResponse.error;

      const newClients = clientsResponse.data || [];
      const leadsData = leadsResponse.data || [];

      if (reset) {
        setClients(newClients);
      } else {
        setClients(prev => [...prev, ...newClients]);
      }
      
      setLeads(leadsData);
      setHasMore(newClients.length === pageSize);

    } catch (error: any) {
      console.error('CRM data error:', error);
      showError("Erreur", "Impossible de charger les données CRM");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, showError]);

  const createClient = useCallback(async (clientData: any) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single();

      if (error) throw error;

      setClients(prev => [data, ...prev]);
      success("Client créé", `Client ${data.name} ajouté`);

      return data;
    } catch (error: any) {
      showError("Erreur", error.message);
      throw error;
    }
  }, [success, showError]);

  useEffect(() => {
    fetchCRMData(true);
  }, [fetchCRMData]);

  return {
    clients,
    leads,
    loading,
    hasMore,
    createClient,
    loadMore: () => fetchCRMData(false),
    refetch: () => fetchCRMData(true)
  };
}