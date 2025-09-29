import type { Database } from '@/shared/types/database';

export type SupabaseTables = Database['public']['Tables'];

export type VapiCall = SupabaseTables['vapi_calls']['Row'];
export type Lead = SupabaseTables['leads']['Row'];
export type SMSLog = SupabaseTables['sms_logs']['Row'];

export type DashboardMetricsResponse = {
  totalCalls: number;
  todayCalls: number;
  totalLeads: number;
  conversionRate: number;
};

export type SupabaseRealtimePayload<T> = {
  eventType: string;
  schema: string;
  table: string;
  new: T;
  old: T | null;
};
