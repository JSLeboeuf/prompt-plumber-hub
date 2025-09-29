import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

/**
 * Phase 3: Optimized Backend Services
 * High-performance data fetching with new RPC functions
 */

export const optimizedServices = {
  // Ultra-fast dashboard metrics using new RPC
  getDashboardMetricsUltraFast: async (timePeriod: '1h' | '24h' | '7d' | '30d' = '24h') => {
    try {
      const { data, error } = await supabase.rpc('get_dashboard_metrics_ultra_fast', {
        time_period: timePeriod
      });
      
      if (error) {
        logger.error('Ultra fast metrics error:', error as Error);
        return {
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
        };
      }
      
      return data;
    } catch (err) {
      logger.error('Dashboard metrics ultra fast error:', err as Error);
      return {
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
      };
    }
  },

  // Batch operations for better performance (manual implementation)
  batchUpdateCallStatus: async (callIds: string[], status: string) => {
    try {
      // Since RPC doesn't exist yet, use individual updates
      const updates = callIds.map(id => 
        supabase
          .from('vapi_calls')
          .update({ 
            status, 
            updated_at: new Date().toISOString(),
            ended_at: status === 'completed' ? new Date().toISOString() : null
          })
          .eq('id', id)
      );
      
      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);
      
      if (errors.length > 0) {
        logger.error('Batch update errors:', errors[0]?.error as Error);
        return { success: false, error: 'Some updates failed' };
      }
      
      return { success: true, data: { updated_count: callIds.length } };
    } catch (err) {
      logger.error('Batch update call status error:', err as Error);
      return { success: false, error: 'Failed to update calls' };
    }
  },

  // Optimized recent calls with minimal data
  getRecentCallsOptimized: async (limit = 10) => {
    try {
      const { data, error } = await supabase
        .from('vapi_calls')
        .select(`
          id,
          status,
          priority,
          created_at,
          customer_name
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        logger.error('Recent calls optimized error:', error);
        return [];
      }
      
      // Anonymize sensitive data on client side
      return data?.map(call => ({
        ...call,
        customer_name: call.customer_name 
          ? `Client-${call.id.substring(0, 8)}`
          : 'Anonyme'
      })) || [];
    } catch (err) {
      logger.error('Recent calls error:', err as Error);
      return [];
    }
  },

  // Memory-efficient pagination
  getPaginatedData: async (
    table: string,
    page: number,
    pageSize: number,
    orderBy: string = 'created_at',
    ascending: boolean = false
  ) => {
    try {
      const from = page * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error, count } = await (supabase as any)
        .from(table)
        .select('*', { count: 'exact' })
        .order(orderBy, { ascending })
        .range(from, to);
      
      if (error) {
        logger.error(`Paginated ${table} error:`, error as Error);
        return { data: [], count: 0, hasMore: false };
      }
      
      return {
        data: data || [],
        count: count || 0,
        hasMore: (count || 0) > to + 1
      };
    } catch (err) {
      logger.error(`Paginated ${table} error:`, err as Error);
      return { data: [], count: 0, hasMore: false };
    }
  },

  // Optimized search with indexes
  searchOptimized: async (table: string, searchTerm: string, fields: string[]) => {
    try {
      // Build OR condition for multiple fields
      const conditions = fields.map(field => 
        `${field}.ilike.%${searchTerm}%`
      ).join(',');
      
      const { data, error } = await (supabase as any)
        .from(table)
        .select('*')
        .or(conditions)
        .limit(50);
      
      if (error) {
        logger.error(`Optimized search ${table} error:`, error as Error);
        return [];
      }
      
      return data || [];
    } catch (err) {
      logger.error(`Search ${table} error:`, err as Error);
      return [];
    }
  }
};