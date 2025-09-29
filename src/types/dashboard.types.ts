/**
 * Type definitions for Dashboard components and data
 */

export interface DashboardCall {
  id: string;
  status: 'active' | 'pending' | 'completed' | 'cancelled';
  priority: 'P1' | 'P2' | 'P3' | 'normal';
  customer_name: string;
  phone_number?: string;
  created_at: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface DashboardMetrics {
  totalCalls: number;
  activeCalls: number;
  completedCalls: number;
  avgDuration: number;
  urgentCalls: number;
  activeClients: number;
  successRate: number;
  recentCalls: DashboardCall[];
  timeRange: '1h' | '24h' | '7d' | '30d';
  timestamp: number;
}

export interface KPICard {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}

export interface DashboardFilters {
  timePeriod: '1h' | '24h' | '7d' | '30d';
  status?: DashboardCall['status'];
  priority?: DashboardCall['priority'];
}
