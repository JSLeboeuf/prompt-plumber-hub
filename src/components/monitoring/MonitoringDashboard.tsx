import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Activity, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Clock,
  Zap,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useSystemHealth, usePerformanceMetrics, useAuditLogs } from '@/hooks/useMonitoring';
import { format } from 'date-fns';

/**
 * Phase 4: Advanced Monitoring Dashboard
 * Real-time system health, performance metrics, and security monitoring
 */

export const MonitoringDashboard: React.FC = () => {
  const { data: systemHealth, isLoading: healthLoading, refetch: refetchHealth } = useSystemHealth();
  const { data: performanceMetrics, isLoading: perfLoading } = usePerformanceMetrics();
  const { data: auditLogs, isLoading: auditLoading } = useAuditLogs({ timeRange: '24h' });
  
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refetchHealth();
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refetchHealth]);
  
  const getHealthIcon = (score: string) => {
    switch (score) {
      case 'excellent': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'good': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'needs_attention': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };
  
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitoring & Security</h1>
          <p className="text-muted-foreground">
            System health, performance metrics, and security monitoring
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => refetchHealth()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>
      
      {/* System Health Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            {healthLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              getHealthIcon(systemHealth?.health_score || 'unknown')
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthLoading ? '...' : (systemHealth?.health_score || 'Unknown')}
            </div>
            <p className="text-xs text-muted-foreground">
              Overall system status
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Size</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthLoading ? '...' : `${(systemHealth as any)?.database_size_mb || 0} MB`}
            </div>
            <p className="text-xs text-muted-foreground">
              Current database usage
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthLoading ? '...' : (systemHealth as any)?.active_connections || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Current database connections
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditLoading ? '...' : auditLogs?.summary?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Performance Metrics */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {perfLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(performanceMetrics || {}).map(([metricName, data]: [string, any]) => (
                  <div key={metricName} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">
                        {metricName.replace(/_/g, ' ')}
                      </span>
                      <Badge variant="outline">
                        {data.average.toFixed(1)}ms avg
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Min: {data.min.toFixed(1)}ms</span>
                        <span>Max: {data.max.toFixed(1)}ms</span>
                      </div>
                      <Progress 
                        value={Math.min((data.average / 1000) * 100, 100)} 
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
                
                {(!performanceMetrics || Object.keys(performanceMetrics).length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No performance data available</p>
                    <p className="text-xs">Start using the app to see metrics</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Audit Logs Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {auditLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {auditLogs?.summary?.topActions?.map((action: any, index: number) => (
                  <div key={action.action} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        index === 0 ? 'bg-green-500' : 
                        index === 1 ? 'bg-blue-500' : 'bg-gray-500'
                      }`} />
                      <span className="text-sm capitalize">
                        {action.action.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <Badge variant="secondary">
                      {action.count}
                    </Badge>
                  </div>
                ))}
                
                {auditLogs?.raw?.slice(0, 3).map((log: any) => (
                  <div key={log.id} className="border-t pt-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.timestamp), 'HH:mm:ss')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {log.resource_type} • {log.user_email || 'System'}
                    </p>
                  </div>
                ))}
                
                {(!auditLogs?.raw || auditLogs.raw.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="justify-start">
              <Shield className="h-4 w-4 mr-2" />
              Security Scan
            </Button>
            <Button variant="outline" className="justify-start">
              <Database className="h-4 w-4 mr-2" />
              Database Health
            </Button>
            <Button variant="outline" className="justify-start">
              <TrendingUp className="h-4 w-4 mr-2" />
              Performance Report
            </Button>
            <Button variant="outline" className="justify-start">
              <Activity className="h-4 w-4 mr-2" />
              System Cleanup
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};