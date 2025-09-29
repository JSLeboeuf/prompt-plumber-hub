import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

/**
 * Phase 4: Advanced Monitoring & Security Services
 * Comprehensive audit logging, performance tracking, and security monitoring
 */

export interface AuditLogEntry {
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export interface PerformanceMetric {
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  component_name?: string;
  metadata?: Record<string, any>;
}

export interface SecurityEvent {
  event_type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  description: string;
  user_id?: string;
  ip_address?: string;
  metadata?: Record<string, any>;
}

export const monitoringServices = {
  // Enhanced Audit Logging
  logAudit: async (entry: AuditLogEntry): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc('log_audit_comprehensive', {
        p_user_id: entry.user_id as string,
        p_action: entry.action,
        p_resource_type: entry.resource_type,
        p_resource_id: entry.resource_id as string,
        p_old_values: entry.old_values || null,
        p_new_values: entry.new_values || null,
        p_metadata: entry.metadata || {},
        p_ip_address: entry.ip_address || undefined,
        p_user_agent: entry.user_agent || navigator.userAgent
      });
      
      if (error) {
        logger.error('Audit log error:', error as Error);
        return null;
      }
      
      return data;
    } catch (err) {
      logger.error('Audit logging failed:', err as Error);
      return null;
    }
  },

  // Performance Metrics Tracking
  trackPerformance: async (metric: PerformanceMetric): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('performance_metrics')
        .insert([{
          metric_name: metric.metric_name,
          metric_value: metric.metric_value,
          metric_unit: metric.metric_unit || 'ms',
          component_name: metric.component_name || null,
          metadata: metric.metadata || {},
          session_id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }]);
      
      if (error) {
        logger.error('Performance tracking error:', error as Error);
        return false;
      }
      
      return true;
    } catch (err) {
      logger.error('Performance tracking failed:', err as Error);
      return false;
    }
  },

  // Security Event Logging
  logSecurityEvent: async (event: SecurityEvent): Promise<string | null> => {
    try {
      const { data, error } = await supabase.rpc('log_security_event', {
        p_event_type: event.event_type,
        p_severity: event.severity,
        p_description: event.description,
        p_user_id: event.user_id as string,
        p_ip_address: event.ip_address || null,
        p_metadata: event.metadata || {}
      });
      
      if (error) {
        logger.error('Security event logging error:', error as Error);
        return null;
      }
      
      // Also log to console for immediate visibility
      if (event.severity === 'critical' || event.severity === 'error') {
        logger.error(`SECURITY ${event.severity.toUpperCase()}: ${event.description}`, event.metadata);
      }
      
      return data;
    } catch (err) {
      logger.error('Security event logging failed:', err as Error);
      return null;
    }
  },

  // System Health Monitoring
  getSystemHealth: async (): Promise<any> => {
    try {
      const { data, error } = await supabase.rpc('get_system_health');
      
      if (error) {
        logger.error('System health check error:', error as Error);
        return {
          health_score: 'unknown',
          timestamp: Date.now(),
          error: error.message
        };
      }
      
      return data;
    } catch (err) {
      logger.error('System health check failed:', err as Error);
      return {
        health_score: 'error',
        timestamp: Date.now(),
        error: 'Health check failed'
      };
    }
  },

  // GDPR Compliance
  triggerGDPRCleanup: async (): Promise<boolean> => {
    try {
      const { error } = await supabase.rpc('auto_anonymize_old_data');
      
      if (error) {
        logger.error('GDPR cleanup error:', error as Error);
        return false;
      }
      
      logger.info('GDPR cleanup completed successfully');
      return true;
    } catch (err) {
      logger.error('GDPR cleanup failed:', err as Error);
      return false;
    }
  },

  // Performance Analytics
  getPerformanceMetrics: async (
    component?: string, 
    timeRange: '1h' | '24h' | '7d' = '24h'
  ): Promise<any[]> => {
    try {
      let query = supabase
        .from('performance_metrics')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Add time filter
      const timeFilters = {
        '1h': new Date(Date.now() - 60 * 60 * 1000),
        '24h': new Date(Date.now() - 24 * 60 * 60 * 1000),
        '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      };
      
      query = query.gte('created_at', timeFilters[timeRange].toISOString());
      
      if (component) {
        query = query.eq('component_name', component);
      }
      
      const { data, error } = await query.limit(1000);
      
      if (error) {
        logger.error('Performance metrics query error:', error as Error);
        return [];
      }
      
      return data || [];
    } catch (err) {
      logger.error('Performance metrics query failed:', err as Error);
      return [];
    }
  },

  // Audit Log Retrieval
  getAuditLogs: async (
    filters: {
      action?: string;
      resource_type?: string;
      user_id?: string;
      timeRange?: '1h' | '24h' | '7d' | '30d';
    } = {}
  ): Promise<any[]> => {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false });
      
      // Apply filters
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      
      if (filters.resource_type) {
        query = query.eq('resource_type', filters.resource_type);
      }
      
      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      
      if (filters.timeRange) {
        const timeFilters = {
          '1h': new Date(Date.now() - 60 * 60 * 1000),
          '24h': new Date(Date.now() - 24 * 60 * 60 * 1000),
          '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        };
        query = query.gte('timestamp', timeFilters[filters.timeRange].toISOString());
      }
      
      const { data, error } = await query.limit(500);
      
      if (error) {
        logger.error('Audit logs query error:', error as Error);
        return [];
      }
      
      return data || [];
    } catch (err) {
      logger.error('Audit logs query failed:', err as Error);
      return [];
    }
  }
};

// Automatic performance tracking utilities
export class AutoPerformanceTracker {
  private static instance: AutoPerformanceTracker;
  private isEnabled: boolean = false;
  
  static getInstance(): AutoPerformanceTracker {
    if (!AutoPerformanceTracker.instance) {
      AutoPerformanceTracker.instance = new AutoPerformanceTracker();
    }
    return AutoPerformanceTracker.instance;
  }
  
  enable() {
    this.isEnabled = true;
    this.setupAutomaticTracking();
  }
  
  disable() {
    this.isEnabled = false;
  }
  
  private setupAutomaticTracking() {
    // Track page load performance
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          
          if (perfData) {
            monitoringServices.trackPerformance({
              metric_name: 'page_load_time',
              metric_value: perfData.loadEventEnd - perfData.loadEventStart,
              component_name: window.location.pathname,
              metadata: {
                dom_complete: perfData.domComplete,
                dom_interactive: perfData.domInteractive,
                first_paint: perfData.domContentLoadedEventStart
              }
            });
          }
        }, 100);
      });
      
      // Track LCP (Largest Contentful Paint)
      if ('PerformanceObserver' in window) {
        try {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            if (entries.length > 0) {
              const lastEntry = entries[entries.length - 1];
              
              if (lastEntry && lastEntry.startTime) {
                monitoringServices.trackPerformance({
                  metric_name: 'largest_contentful_paint',
                  metric_value: lastEntry.startTime,
                  component_name: window.location.pathname
                });
              }
            }
          });
          
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (err) {
          logger.warn('LCP observer setup failed:', { error: (err as Error).message });
        }
      }
    }
  }
  
  // Manual performance tracking
  async trackComponentRender(componentName: string, renderTime: number) {
    if (!this.isEnabled) return;
    
    await monitoringServices.trackPerformance({
      metric_name: 'component_render_time',
      metric_value: renderTime,
      component_name: componentName,
      metadata: {
        timestamp: Date.now(),
        average: 0 // perfMonitor would be imported if needed
      }
    });
  }
  
  async trackApiCall(endpoint: string, duration: number, status: number) {
    if (!this.isEnabled) return;
    
    await monitoringServices.trackPerformance({
      metric_name: 'api_call_duration',
      metric_value: duration,
      component_name: endpoint,
      metadata: {
        status_code: status,
        endpoint: endpoint,
        timestamp: Date.now()
      }
    });
  }
}