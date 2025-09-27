import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeSubscriptionOptions {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  enabled?: boolean;
}

export const useRealtimeSubscription = ({
  table,
  event = '*',
  filter,
  onInsert,
  onUpdate,
  onDelete,
  enabled = true
}: UseRealtimeSubscriptionOptions) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
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
          // Only log in development
          if (process.env.NODE_ENV === 'development') {
            
          }

          switch ((payload as any).eventType) {
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