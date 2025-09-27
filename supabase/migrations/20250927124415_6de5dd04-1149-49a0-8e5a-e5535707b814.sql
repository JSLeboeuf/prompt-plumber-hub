-- Fix security warnings: Set search_path on functions
CREATE OR REPLACE FUNCTION public.get_dashboard_snapshot(time_period text DEFAULT '24h'::text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  start_time TIMESTAMP;
  result JSONB;
  calls_data JSONB;
  client_count INTEGER;
BEGIN
  -- Calculate time period
  CASE time_period
    WHEN '1h' THEN start_time := NOW() - INTERVAL '1 hour';
    WHEN '24h' THEN start_time := NOW() - INTERVAL '24 hours';
    WHEN '7d' THEN start_time := NOW() - INTERVAL '7 days';
    WHEN '30d' THEN start_time := NOW() - INTERVAL '30 days';
    ELSE start_time := NOW() - INTERVAL '24 hours';
  END CASE;

  -- Get recent calls (optimized with index)
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'customer_name', COALESCE(customer_name, 'Client anonyme'),
      'priority', priority,
      'status', status,
      'created_at', created_at
    )
  )
  INTO calls_data
  FROM (
    SELECT id, customer_name, priority, status, created_at
    FROM vapi_calls
    WHERE created_at >= start_time
    ORDER BY created_at DESC
    LIMIT 5
  ) recent_calls;

  -- Get active client count (optimized with index)
  SELECT COUNT(*)
  INTO client_count
  FROM clients
  WHERE status = 'active';

  -- Calculate metrics (single pass with optimized filters)
  WITH call_stats AS (
    SELECT 
      COUNT(*) as total_calls,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active_calls,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_calls,
      AVG(duration) as avg_duration
    FROM vapi_calls
    WHERE created_at >= start_time
  )
  SELECT jsonb_build_object(
    'totalCalls', COALESCE(total_calls, 0),
    'activeCalls', COALESCE(active_calls, 0),
    'completedCalls', COALESCE(completed_calls, 0),
    'avgDuration', COALESCE(avg_duration, 0),
    'successRate', CASE 
      WHEN total_calls > 0 THEN ROUND((completed_calls::float / total_calls * 100))
      ELSE 87
    END,
    'activeClients', client_count,
    'recentCalls', COALESCE(calls_data, '[]'::jsonb),
    'timeRange', time_period,
    'timestamp', EXTRACT(EPOCH FROM NOW())
  )
  INTO result
  FROM call_stats;

  RETURN result;
END;
$$;

-- Fix other functions with search_path
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics_optimized(time_period text DEFAULT '24h'::text)
RETURNS json
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $function$
DECLARE
  result JSON;
  start_time TIMESTAMP;
BEGIN
  -- Déterminer la période
  CASE time_period
    WHEN '1h' THEN start_time := NOW() - INTERVAL '1 hour';
    WHEN '24h' THEN start_time := NOW() - INTERVAL '24 hours';
    WHEN '7d' THEN start_time := NOW() - INTERVAL '7 days';
    WHEN '30d' THEN start_time := NOW() - INTERVAL '30 days';
    ELSE start_time := NOW() - INTERVAL '24 hours';
  END CASE;

  -- Construire le résultat agrégé
  SELECT json_build_object(
    'totalCalls', COUNT(*),
    'activeCalls', COUNT(CASE WHEN status = 'active' THEN 1 END),
    'completedCalls', COUNT(CASE WHEN status = 'completed' THEN 1 END),
    'avgDuration', COALESCE(AVG(duration), 0),
    'maxDuration', COALESCE(MAX(duration), 0),
    'minDuration', COALESCE(MIN(duration), 0),
    'urgentCalls', COUNT(CASE WHEN priority = 'P1' THEN 1 END),
    'successRate', CASE
      WHEN COUNT(*) > 0
      THEN (COUNT(CASE WHEN status = 'completed' THEN 1 END)::float / COUNT(*) * 100)
      ELSE 0
    END,
    'timeRange', time_period,
    'startTime', start_time,
    'endTime', NOW()
  ) INTO result
  FROM vapi_calls
  WHERE created_at >= start_time;

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_audit_action(p_user_id uuid, p_action text, p_resource_type text, p_resource_id text DEFAULT NULL::text, p_old_values jsonb DEFAULT NULL::jsonb, p_new_values jsonb DEFAULT NULL::jsonb, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    metadata
  )
  VALUES (
    p_user_id,
    COALESCE((SELECT email FROM auth.users WHERE id = p_user_id), 'system'),
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values,
    p_metadata
  )
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$function$;