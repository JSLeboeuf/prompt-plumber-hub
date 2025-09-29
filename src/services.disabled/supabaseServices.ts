import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/shared/types/database';
import type { DashboardMetricsResponse, Lead, SMSLog, SupabaseRealtimePayload, VapiCall } from '@/shared/types/supabase';

export interface SupabaseService {
  client: SupabaseClient<Database>;
  signIn: (email: string, password: string) => Promise<unknown>;
  signOut: () => Promise<void>;
  getCurrentUser: () => Promise<unknown>;
  fetchData: <T = unknown>(table: string, filters?: Record<string, unknown>) => Promise<T[]>;
  insertData: <T = unknown>(table: string, data: Record<string, unknown>) => Promise<T>;
  updateData: <T = unknown>(table: string, id: string, data: Record<string, unknown>) => Promise<T>;
  deleteData: (table: string, id: string) => Promise<void>;
  subscribeToTable: (table: string, callback: (payload: SupabaseRealtimePayload<unknown>) => void) => RealtimeChannel;
  unsubscribeFromTable: (subscription: RealtimeChannel | null | undefined) => void;
  getRecentCalls: (limit?: number) => Promise<VapiCall[]>;
  getLeads: () => Promise<Lead[]>;
  getDashboardMetrics: () => Promise<DashboardMetricsResponse>;
  getSMSLogs: (limit?: number) => Promise<SMSLog[]>;
  subscribeToNewCalls: (callback: (payload: SupabaseRealtimePayload<VapiCall>) => void) => RealtimeChannel;
  subscribeToSMSLogs: (callback: (payload: SupabaseRealtimePayload<SMSLog>) => void) => RealtimeChannel;
}

class SupabaseServiceImpl implements SupabaseService {
  client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database>) {
    this.client = client;
  }

  private normalizeError(source: unknown, fallbackMessage: string): Error {
    if (source instanceof Error) {
      return source;
    }

    if (source && typeof source === 'object' && 'message' in source) {
      const message = String((source as { message?: unknown }).message ?? fallbackMessage);
      return new Error(message);
    }

    return new Error(fallbackMessage);
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });

    if (error) {
      throw this.normalizeError(error, 'Unable to sign in');
    }

    logger.info('User signed in successfully', { userId: data.user?.id });
    return data;
  }

  async signOut() {
    const { error } = await this.client.auth.signOut();

    if (error) {
      throw this.normalizeError(error, 'Unable to sign out');
    }

    logger.info('User signed out successfully');
  }

  async getCurrentUser() {
    const { data, error } = await this.client.auth.getUser();

    if (error) {
      throw this.normalizeError(error, 'Unable to get current user');
    }

    return data.user;
  }

  async fetchData<T = unknown>(table: string, filters?: Record<string, unknown>): Promise<T[]> {
    let query = this.client.from(table).select('*');

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          return;
        }

        if (key === 'or' && typeof value === 'string' && typeof query.or === 'function') {
          query = query.or(value);
          return;
        }

        if (Array.isArray(value) && typeof query.in === 'function') {
          query = query.in(key, value);
          return;
        }

        if (typeof value === 'object') {
          const record = value as Record<string, unknown>;
          if ('gte' in record && typeof query.gte === 'function') {
            query = query.gte(key, record['gte']);
          }
          if ('lte' in record && typeof query.lte === 'function') {
            query = query.lte(key, record['lte']);
          }
          return;
        }

        if (typeof query.eq === 'function') {
          query = query.eq(key, value);
        }
      });
    }

    const { data, error } = await query;

    if (error) {
      throw this.normalizeError(error, 'Failed to fetch data from ' + table);
    }

    const result = (data ?? []) as T[];
    logger.debug('Fetched records', { table, count: result.length });
    return result;
  }

  async insertData<T = unknown>(table: string, data: Record<string, unknown>): Promise<T> {
    const { data: inserted, error } = await this.client
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) {
      throw this.normalizeError(error, 'Failed to insert data into ' + table);
    }

    logger.info('Data inserted into table', { table });
    return inserted as T;
  }

  async updateData<T = unknown>(table: string, id: string, data: Record<string, unknown>): Promise<T> {
    const { data: updated, error } = await this.client
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw this.normalizeError(error, 'Failed to update data in ' + table);
    }

    logger.info('Data updated in table', { table, id });
    return updated as T;
  }

  async deleteData(table: string, id: string): Promise<void> {
    const { error } = await this.client
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      throw this.normalizeError(error, 'Failed to delete data from ' + table);
    }

    logger.info('Data deleted from table', { table, id });
  }

  subscribeToTable(table: string, callback: (payload: SupabaseRealtimePayload<unknown>) => void): RealtimeChannel {
    const channel = this.client
      .channel(table + '_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        logger.debug('Realtime event received', { table, event: payload.eventType });
        callback(payload as SupabaseRealtimePayload<unknown>);
      })
      .subscribe();

    return channel;
  }

  unsubscribeFromTable(subscription: RealtimeChannel | null | undefined) {
    if (!subscription) {
      return;
    }

    if (typeof this.client.removeChannel === 'function') {
      this.client.removeChannel(subscription);
      return;
    }

    if (typeof (subscription as { unsubscribe?: () => void }).unsubscribe === 'function') {
      (subscription as { unsubscribe?: () => void }).unsubscribe?.();
    }
  }

  async getRecentCalls(limit: number = 50): Promise<VapiCall[]> {
    const { data, error } = await this.client
      .from('vapi_calls')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw this.normalizeError(error, 'Failed to load recent calls');
    }

    return (data ?? []) as VapiCall[];
  }

  async getLeads(): Promise<Lead[]> {
    const { data, error } = await this.client
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw this.normalizeError(error, 'Failed to load leads');
    }

    return (data ?? []) as Lead[];
  }

  async getDashboardMetrics(): Promise<DashboardMetricsResponse> {
    const totalCallsQuery = await this.client
      .from('vapi_calls')
      .select('id', { count: 'exact', head: true });

    if (totalCallsQuery.error) {
      throw this.normalizeError(totalCallsQuery.error, 'Failed to count calls');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayCallsQuery = await this.client
      .from('vapi_calls')
      .select('id', { count: 'exact', head: true })
      .gte('started_at', today.toISOString());

    if (todayCallsQuery.error) {
      throw this.normalizeError(todayCallsQuery.error, 'Failed to count today calls');
    }

    const leadsQuery = await this.client
      .from('leads')
      .select('id', { count: 'exact', head: true });

    if (leadsQuery.error) {
      throw this.normalizeError(leadsQuery.error, 'Failed to count leads');
    }

    const totalCalls = totalCallsQuery.count ?? 0;
    const todayCalls = todayCallsQuery.count ?? 0;
    const totalLeads = leadsQuery.count ?? 0;
    const conversionRate = totalCalls > 0 ? Number(((totalLeads / totalCalls) * 100).toFixed(2)) : 0;

    return {
      totalCalls,
      todayCalls,
      totalLeads,
      conversionRate,
    };
  }

  async getSMSLogs(limit: number = 20): Promise<SMSLog[]> {
    const { data, error } = await this.client
      .from('sms_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw this.normalizeError(error, 'Failed to load SMS logs');
    }

    return (data ?? []) as SMSLog[];
  }

  subscribeToNewCalls(callback: (payload: SupabaseRealtimePayload<VapiCall>) => void): RealtimeChannel {
    const channel = this.client
      .channel('vapi_calls_inserts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vapi_calls' }, (payload) => {
        logger.debug('New call received', { id: payload.new?.id });
        callback(payload as SupabaseRealtimePayload<VapiCall>);
      })
      .subscribe();

    return channel;
  }

  subscribeToSMSLogs(callback: (payload: SupabaseRealtimePayload<SMSLog>) => void): RealtimeChannel {
    const channel = this.client
      .channel('sms_logs_inserts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sms_logs' }, (payload) => {
        logger.debug('New SMS log received', { id: payload.new?.id });
        callback(payload as SupabaseRealtimePayload<SMSLog>);
      })
      .subscribe();

    return channel;
  }
}

export function createSupabaseService(client: SupabaseClient<Database>): SupabaseService {
  return new SupabaseServiceImpl(client);
}

const supabaseServiceInstance = createSupabaseService(supabase);

export const supabaseServices: SupabaseService = supabaseServiceInstance;

export function initializeSupabaseService(_client: SupabaseClient<Database>) {
  logger.info('Supabase service already initialized with default client');
}

export function getSupabaseService(): SupabaseService {
  return supabaseServiceInstance;
}
