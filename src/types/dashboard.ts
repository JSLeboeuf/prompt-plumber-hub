// Dashboard analytics types
export interface DashboardMetrics {
  totalCalls: number;
  activeCalls: number;
  completedCalls: number;
  successRate: number;
  avgResponseTime: number;
  totalClients: number;
  activeClients: number;
  newClients: number;
  revenue: number;
  revenueGrowth: number;
}

// KPI Card types
export interface KPICard {
  title: string;
  value: string | number;
  change: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  action: () => void;
}

// Activity types
export interface Activity {
  id: string;
  type: 'call_completed' | 'call_started' | 'client_added' | 'intervention_scheduled';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'pending' | 'error';
}