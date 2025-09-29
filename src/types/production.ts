/**
 * Types de production avec validation stricte
 */

// Types stricts pour remplacer les 'any'
export interface ClientData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'active' | 'inactive' | 'pending';
  notes?: string;
  tags?: string[];
  service_history?: ServiceRecord[];
  created_at: string;
  updated_at: string;
}

export interface ServiceRecord {
  id: string;
  date: string;
  type: string;
  description: string;
  price?: number;
  status: 'completed' | 'pending' | 'cancelled';
}

export interface CallData {
  id: string;
  call_id: string;
  phone_number: string;
  customer_name?: string;
  status: 'active' | 'completed' | 'failed';
  priority: 'normal' | 'urgent' | 'low';
  duration?: number;
  started_at?: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export interface InterventionData {
  id: string;
  title: string;
  description?: string;
  client_name: string;
  client_phone?: string;
  address: string;
  city?: string;
  postal_code?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'urgent' | 'critical';
  service_type: string;
  assigned_technician?: string;
  scheduled_date: string;
  scheduled_time?: string;
  estimated_duration?: number;
  estimated_price?: number;
  actual_price?: number;
  notes?: string;
  equipment_needed?: string[];
  photos?: string[];
  customer_signature?: string;
  completion_notes?: string;
  invoice_sent_at?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export interface SMSLogData {
  id: string;
  customer_name: string;
  customer_phone: string;
  service_type: string;
  priority: string;
  message: string;
  recipients: unknown[];
  sent_at: string;
  created_at: string;
  updated_at: string;
}

export interface AlertData {
  id: string;
  type: string;
  message: string;
  priority: 'normal' | 'urgent' | 'critical';
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DashboardMetrics {
  totalCalls: number;
  activeCalls: number;
  completedCalls: number;
  avgDuration: number;
  successRate: number;
  urgentCalls: number;
  activeClients: number;
  recentCalls: CallData[];
  timeRange: string;
  timestamp: number;
}

export interface FilterOptions {
  status?: string;
  priority?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
  search?: string;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
  success: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
}

// Types pour les subscriptions WebSocket/Realtime
export interface RealtimePayload<T = unknown> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: T;
  old?: T;
  table: string;
  timestamp: string;
}

export type RealtimeCallback<T = unknown> = (payload: RealtimePayload<T>) => void;