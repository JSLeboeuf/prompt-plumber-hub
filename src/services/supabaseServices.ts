import { supabase } from '@/integrations/supabase/client';
import { prodLogger } from '@/lib/productionLogger';

// Real Supabase services implementation
export const supabaseServices = {
  initialized: true,
  
  getRecentCalls: async (limit = 10) => {
    const { data, error } = await supabase
      .from('vapi_calls')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      prodLogger.error('Error fetching calls', { error });
      return [];
    }
    return data || [];
  },

  getLeads: async (_options?: any) => {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      prodLogger.error('Error fetching leads', { error });
      return [];
    }
    return data || [];
  },

  getSMSLogs: async (limit = 20) => {
    const { data, error } = await supabase
      .from('sms_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      prodLogger.error('Error fetching SMS logs', { error });
      return [];
    }
    return data || [];
  },

  subscribeToSMSLogs: (callback: any) => {
    const channel = supabase
      .channel('sms_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sms_logs'
        },
        callback
      )
      .subscribe();
    
    return { unsubscribe: () => supabase.removeChannel(channel) };
  },

  unsubscribeFromTable: (subscription: any) => {
    if (subscription?.unsubscribe) {
      subscription.unsubscribe();
    }
  },

  getDashboardMetrics: async (timePeriod: '1h' | '24h' | '7d' | '30d' = '24h') => {
    try {
      // Use the new ultra-fast RPC function
      const { data, error } = await supabase.rpc('get_dashboard_metrics_ultra_fast', {
        time_period: timePeriod
      });
      
      if (error) {
        prodLogger.error('Error fetching dashboard metrics', { error });
        return {
          totalCalls: 0,
          activeCalls: 0,
          activeClients: 0,
          successRate: 0
        };
      }
      
      return data || {
        totalCalls: 0,
        activeCalls: 0,
        activeClients: 0,
        successRate: 0
      };
    } catch (err) {
      prodLogger.error('Dashboard metrics error', { error: err });
      return {
        totalCalls: 0,
        activeCalls: 0,
        activeClients: 0,
        successRate: 0
      };
    }
  },

  subscribeToNewCalls: (callback: any) => {
    const channel = supabase
      .channel('vapi_calls_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vapi_calls'
        },
        callback
      )
      .subscribe();
    
    return { unsubscribe: () => supabase.removeChannel(channel) };
  }
};