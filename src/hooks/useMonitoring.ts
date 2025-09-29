import { useQuery } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { monitoringServices, AutoPerformanceTracker } from '@/services/monitoringServices';
import { logger } from '@/lib/logger';

/**
 * Phase 4: Advanced Monitoring Hooks
 * Comprehensive system monitoring and security tracking
 */

// System Health Monitoring Hook
export const useSystemHealth = () => {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: monitoringServices.getSystemHealth,
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
    retry: 2
  });
};

// Performance Metrics Hook
export const usePerformanceMetrics = (
  component?: string, 
  timeRange: '1h' | '24h' | '7d' = '24h'
) => {
  return useQuery({
    queryKey: ['performance-metrics', component, timeRange],
    queryFn: () => monitoringServices.getPerformanceMetrics(component, timeRange),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
    select: (data) => {
      // Process and aggregate metrics
      const processedMetrics = data.reduce((acc: any, metric: any) => {
        const name = metric.metric_name;
        if (!acc[name]) {
          acc[name] = {
            values: [],
            average: 0,
            min: Infinity,
            max: -Infinity,
            count: 0
          };
        }
        
        acc[name].values.push({
          value: metric.metric_value,
          timestamp: metric.created_at,
          component: metric.component_name
        });
        
        acc[name].min = Math.min(acc[name].min, metric.metric_value);
        acc[name].max = Math.max(acc[name].max, metric.metric_value);
        acc[name].count++;
        
        return acc;
      }, {});
      
      // Calculate averages
      Object.keys(processedMetrics).forEach(key => {
        const total = processedMetrics[key].values.reduce((sum: number, item: any) => sum + item.value, 0);
        processedMetrics[key].average = total / processedMetrics[key].count;
      });
      
      return processedMetrics;
    }
  });
};

// Audit Logs Hook
export const useAuditLogs = (filters: {
  action?: string;
  resource_type?: string;
  timeRange?: '1h' | '24h' | '7d' | '30d';
} = {}) => {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => monitoringServices.getAuditLogs(filters),
    staleTime: 30000,
    refetchInterval: 60000,
    select: (data) => {
      // Group by action type for better analysis
      const grouped = data.reduce((acc: any, log: any) => {
        const action = log.action;
        if (!acc[action]) {
          acc[action] = [];
        }
        acc[action].push(log);
        return acc;
      }, {});
      
      return {
        raw: data,
        grouped,
        summary: {
          total: data.length,
          actions: Object.keys(grouped).length,
          mostRecent: data[0]?.timestamp || null,
          topActions: Object.entries(grouped)
            .map(([action, logs]: [string, any]) => ({ action, count: logs.length }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
        }
      };
    }
  });
};

// Security Monitoring Hook
export const useSecurityMonitoring = () => {
  const { data: auditLogs } = useAuditLogs({ 
    resource_type: 'security_event',
    timeRange: '24h' 
  });
  
  return {
    securityEvents: auditLogs?.raw?.filter((log: any) => 
      log.resource_type === 'security_event'
    ) || [],
    criticalEvents: auditLogs?.raw?.filter((log: any) => 
      log.metadata?.severity === 'critical'
    ) || [],
    recentThreats: auditLogs?.raw?.filter((log: any) => 
      log.action.includes('threat') || 
      log.action.includes('attack') ||
      log.action.includes('breach')
    ) || []
  };
};

// Performance Tracking Hook for Components
export const usePerformanceTracking = (componentName: string) => {
  const tracker = AutoPerformanceTracker.getInstance();
  
  const trackRender = useCallback((renderTime: number) => {
    tracker.trackComponentRender(componentName, renderTime);
  }, [componentName, tracker]);
  
  const trackApiCall = useCallback((endpoint: string, duration: number, status: number) => {
    tracker.trackApiCall(endpoint, duration, status);
  }, [tracker]);
  
  return {
    trackRender,
    trackApiCall,
    enableAutoTracking: () => tracker.enable(),
    disableAutoTracking: () => tracker.disable()
  };
};

// GDPR Compliance Hook
export const useGDPRCompliance = () => {
  const triggerCleanup = useCallback(async () => {
    try {
      const success = await monitoringServices.triggerGDPRCleanup();
      
      if (success) {
        // Log the GDPR cleanup action
        await monitoringServices.logAudit({
          action: 'gdpr_manual_cleanup',
          resource_type: 'data_protection',
          metadata: {
            triggered_by: 'user_action',
            timestamp: Date.now()
          }
        });
        
        logger.info('GDPR cleanup completed successfully');
        return { success: true, message: 'GDPR cleanup completed' };
      } else {
        return { success: false, message: 'GDPR cleanup failed' };
      }
    } catch (error) {
      logger.error('GDPR cleanup error:', error as Error);
      return { success: false, message: 'GDPR cleanup error occurred' };
    }
  }, []);
  
  return {
    triggerCleanup,
    scheduleAutoCleanup: () => {
      // Schedule automatic GDPR cleanup (would be implemented server-side)
      logger.info('Auto GDPR cleanup scheduling requested');
    }
  };
};

// Real-time Monitoring Hook
export const useRealTimeMonitoring = () => {
  useEffect(() => {
    const tracker = AutoPerformanceTracker.getInstance();
    
    // Enable automatic performance tracking
    tracker.enable();
    
    // Monitor for performance issues
    const handlePerformanceIssue = (metric: string, value: number) => {
      if (value > 3000) { // Threshold for slow operations
        monitoringServices.logSecurityEvent({
          event_type: 'performance_degradation',
          severity: 'warning',
          description: `Slow ${metric}: ${value}ms`,
          metadata: { metric, value, threshold: 3000 }
        });
      }
    };
    
    // Set up performance observer for critical metrics
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.duration > 1000) { // Log slow operations
              handlePerformanceIssue(entry.name, entry.duration);
            }
          });
        });
        
        observer.observe({ entryTypes: ['measure', 'navigation'] });
        
        return () => {
          observer.disconnect();
          tracker.disable();
        };
        } catch (error) {
          logger.warn('Performance observer setup failed:');
        }
    }
    
    return () => {
      tracker.disable();
    };
  }, []);
  
  return {
    isMonitoring: true,
    logSecurityEvent: monitoringServices.logSecurityEvent,
    trackPerformance: monitoringServices.trackPerformance
  };
};