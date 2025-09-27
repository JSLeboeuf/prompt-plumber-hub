import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface AuditStats {
  total: number;
  today: number;
  this_week: number;
  actions: Record<string, number>;
  resources: Record<string, number>;
}

export const useAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AuditStats>({
    total: 0,
    today: 0,
    this_week: 0,
    actions: {},
    resources: {}
  });

  // Fetch audit logs
  const fetchAuditLogs = useCallback(async (limit = 100) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('audit_logs')
        .select('id, user_email, action, resource_type, resource_id, timestamp, metadata')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (fetchError) {
        throw fetchError;
      }

      setLogs(data as AuditLog[] || []);
      
      // Calculate stats
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const newStats: AuditStats = {
        total: data?.length || 0,
        today: 0,
        this_week: 0,
        actions: {},
        resources: {}
      };

      data?.forEach((log) => {
        const logDate = new Date(log.timestamp);
        
        if (logDate >= today) {
          newStats.today++;
        }
        if (logDate >= thisWeek) {
          newStats.this_week++;
        }

        // Count actions
        newStats.actions[log.action] = (newStats.actions[log.action] || 0) + 1;
        
        // Count resources
        newStats.resources[log.resource_type] = (newStats.resources[log.resource_type] || 0) + 1;
      });

      setStats(newStats);
    } catch (err) {
      console.error('Erreur fetch audit logs:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  // Log action manually
  const logAction = useCallback(async (
    action: string,
    resourceType: string,
    resourceId?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    metadata?: Record<string, any>
  ) => {
    try {
      const { data, error } = await supabase.rpc('log_audit_action', {
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_action: action,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_old_values: oldValues,
        p_new_values: newValues,
        p_metadata: metadata
      });

      if (error) {
        throw error;
      }

      // Refresh logs
      await fetchAuditLogs();
      return data;
    } catch (err) {
      console.error('Erreur log action:', err);
      throw err;
    }
  }, [fetchAuditLogs]);

  // Filter logs by action
  const getLogsByAction = useCallback((action: string) => {
    return logs.filter(log => log.action === action);
  }, [logs]);

  // Filter logs by resource type
  const getLogsByResourceType = useCallback((resourceType: string) => {
    return logs.filter(log => log.resource_type === resourceType);
  }, [logs]);

  // Filter logs by user
  const getLogsByUser = useCallback((userId: string) => {
    return logs.filter(log => log.user_id === userId);
  }, [logs]);

  // Filter logs by date range
  const getLogsByDateRange = useCallback((startDate: Date, endDate: Date) => {
    return logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });
  }, [logs]);

  // Search logs
  const searchLogs = useCallback(async (query: string) => {
    if (!query.trim()) {
      return logs;
    }

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, action, resource_type, timestamp, user_email, metadata')
        .or(`action.ilike.%${query}%,resource_type.ilike.%${query}%,user_email.ilike.%${query}%`)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) {
        throw error;
      }

      return data as AuditLog[] || [];
    } catch (err) {
      console.error('Erreur recherche logs:', err);
      return [];
    }
  }, [logs]);

  // Export logs to CSV
  const exportLogs = useCallback(async (startDate?: Date, endDate?: Date) => {
    try {
      let query = supabase
        .from('audit_logs')
        .select('id, action, resource_type, timestamp, user_email, old_values, new_values')
        .order('timestamp', { ascending: false });

      if (startDate) {
        query = query.gte('timestamp', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('timestamp', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Convert to CSV
      if (!data || data.length === 0) {
        throw new Error('Aucune donnée à exporter');
      }

      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            if (typeof value === 'object' && value !== null) {
              return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            }
            return `"${String(value || '').replace(/"/g, '""')}"`;
          }).join(',')
        )
      ].join('\n');

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return data;
    } catch (err) {
      console.error('Erreur export logs:', err);
      throw err;
    }
  }, []);

  // Real-time subscription
  useEffect(() => {
    fetchAuditLogs();

    // Subscribe to changes
    const subscription = supabase
      .channel('audit_logs_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'audit_logs'
      }, (payload) => {
        fetchAuditLogs();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchAuditLogs]);

  return {
    logs,
    loading,
    error,
    stats,
    fetchAuditLogs,
    logAction,
    getLogsByAction,
    getLogsByResourceType,
    getLogsByUser,
    getLogsByDateRange,
    searchLogs,
    exportLogs
  };
};