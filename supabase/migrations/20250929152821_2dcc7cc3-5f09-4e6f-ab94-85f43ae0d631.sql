-- Phase 3: Backend & DB Architecture Optimization (Fixed)

-- 1. Create optimized RPC functions for dashboard metrics
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics_ultra_fast(time_period text DEFAULT '24h')
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  start_time timestamp;
  metrics_data record;
BEGIN
  CASE time_period
    WHEN '1h' THEN start_time := NOW() - INTERVAL '1 hour';
    WHEN '24h' THEN start_time := NOW() - INTERVAL '24 hours';
    WHEN '7d' THEN start_time := NOW() - INTERVAL '7 days';
    WHEN '30d' THEN start_time := NOW() - INTERVAL '30 days';
    ELSE start_time := NOW() - INTERVAL '24 hours';
  END CASE;

  WITH call_metrics AS (
    SELECT 
      COUNT(*) as total_calls,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active_calls,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_calls,
      AVG(duration) as avg_duration,
      COUNT(CASE WHEN priority = 'P1' THEN 1 END) as urgent_calls,
      COUNT(DISTINCT CASE WHEN customer_name IS NOT NULL THEN customer_name END) as active_clients
    FROM vapi_calls 
    WHERE created_at >= start_time
  ),
  recent_calls AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'status', status,
        'priority', priority,
        'created_at', created_at,
        'customer_name', CASE 
          WHEN customer_name IS NOT NULL 
          THEN 'Client-' || SUBSTRING(id::text, 1, 8)
          ELSE 'Anonyme'
        END
      )
    ) as calls_data
    FROM (
      SELECT id, status, priority, created_at, customer_name
      FROM vapi_calls 
      WHERE created_at >= start_time
      ORDER BY created_at DESC 
      LIMIT 5
    ) sub
  )
  SELECT 
    cm.total_calls,
    cm.active_calls,
    cm.completed_calls,
    cm.avg_duration,
    cm.urgent_calls,
    cm.active_clients,
    rc.calls_data
  INTO metrics_data
  FROM call_metrics cm, recent_calls rc;

  result := jsonb_build_object(
    'totalCalls', COALESCE(metrics_data.total_calls, 0),
    'activeCalls', COALESCE(metrics_data.active_calls, 0),
    'completedCalls', COALESCE(metrics_data.completed_calls, 0),
    'avgDuration', COALESCE(metrics_data.avg_duration, 0),
    'urgentCalls', COALESCE(metrics_data.urgent_calls, 0),
    'activeClients', COALESCE(metrics_data.active_clients, 0),
    'successRate', CASE
      WHEN metrics_data.total_calls > 0
      THEN (metrics_data.completed_calls::float / metrics_data.total_calls * 100)
      ELSE 0
    END,
    'recentCalls', COALESCE(metrics_data.calls_data, '[]'::jsonb),
    'timeRange', time_period,
    'timestamp', EXTRACT(EPOCH FROM NOW())
  );

  RETURN result;
END;
$$;

-- 2. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_vapi_calls_created_status 
ON vapi_calls(created_at DESC, status);

CREATE INDEX IF NOT EXISTS idx_vapi_calls_priority_status 
ON vapi_calls(priority, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sms_logs_created_customer 
ON sms_logs(created_at DESC, customer_phone);

CREATE INDEX IF NOT EXISTS idx_interventions_scheduled_status 
ON interventions(scheduled_date, status);

CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged_created 
ON alerts(acknowledged, created_at DESC);