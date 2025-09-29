import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
// RealtimeChannel type import removed to avoid type conflicts with 'postgres_changes' event
import type {
  RealtimeInsertPayload,
  RealtimeUpdatePayload,
  RealtimeDeletePayload
} from '@/types/api.types';

interface UseRealtimeSubscriptionOptions<T = Record<string, unknown>> {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  onInsert?: (payload: RealtimeInsertPayload<T>) => void;
  onUpdate?: (payload: RealtimeUpdatePayload<T>) => void;
  onDelete?: (payload: RealtimeDeletePayload<T>) => void;
  enabled?: boolean;
}

export const useRealtimeSubscription = <T = Record<string, unknown>>({
  table,
  event = '*',
  filter,
  onInsert,
  onUpdate,
  onDelete,
  enabled = true
}: UseRealtimeSubscriptionOptions<T>) => {
  const channelRef = useRef<any>(null);
  const subscriptionId = useRef<string>(`${table}_${Date.now()}`);

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      cleanup();
      return;
    }

    const channelName = `${table}_changes_${subscriptionId.current}`;
    
const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        {
          event,
          schema: 'public',
          table,
          ...(filter ? { filter } : {})
        },
        (payload: any) => {
          switch (payload.eventType) {
            case 'INSERT':
              onInsert?.(payload);
              break;
            case 'UPDATE':
              onUpdate?.(payload);
              break;
            case 'DELETE':
              onDelete?.(payload);
              break;
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return cleanup;
  }, [table, event, filter, enabled, onInsert, onUpdate, onDelete, cleanup]);

  return { cleanup };
};
