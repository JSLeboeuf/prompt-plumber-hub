import type { DashboardMetrics } from '@/types/dashboard';

export { DashboardMetrics };

export type PriorityLevel = 'P1' | 'P2' | 'P3' | 'P4';
export type CallStatus = 'active' | 'completed' | 'failed' | 'transferred' | 'pending' | 'queued' | 'cancelled';

export interface Call {
  id: string;
  callId?: string;
  phoneNumber: string;
  startTime: string | Date;
  endTime?: string | Date;
  duration: number;
  priority: PriorityLevel | string;
  status: CallStatus | string;
  customerName?: string;
  transcript?: string;
  recordingUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface LiveCall extends Call {
  channel?: string;
  operator?: string;
  isEscalated?: boolean;
}

export interface CallFilters {
  status?: string;
  priority?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface Analytics {
  id: string;
  metric: string;
  value: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
