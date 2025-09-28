-- Fix critical security issues - Step 1: Update functions with proper search_path
-- Cannot drop has_role directly due to dependencies, so alter it instead

-- 1. Update existing functions to fix search_path security issues
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$function$;

CREATE OR REPLACE FUNCTION public.log_audit_action(p_user_id uuid, p_action text, p_resource_type text, p_resource_id text DEFAULT NULL::text, p_old_values jsonb DEFAULT NULL::jsonb, p_new_values jsonb DEFAULT NULL::jsonb, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.get_dashboard_snapshot(time_period text DEFAULT '24h'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    result jsonb;
    time_filter timestamp;
    total_calls int;
    active_calls int;
    completed_calls int;
    avg_duration numeric;
    success_rate numeric;
    active_clients int;
    recent_calls jsonb;
BEGIN
    -- Calculate time filter
    CASE time_period
        WHEN '1h' THEN time_filter := NOW() - INTERVAL '1 hour';
        WHEN '24h' THEN time_filter := NOW() - INTERVAL '24 hours';
        WHEN '7d' THEN time_filter := NOW() - INTERVAL '7 days';
        WHEN '30d' THEN time_filter := NOW() - INTERVAL '30 days';
        ELSE time_filter := NOW() - INTERVAL '24 hours';
    END CASE;

    -- Get call metrics (anonymized for security)
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'active'),
        COUNT(*) FILTER (WHERE status = 'completed'),
        AVG(EXTRACT(EPOCH FROM (ended_at - started_at)))::numeric,
        (COUNT(*) FILTER (WHERE status = 'completed')::numeric / GREATEST(COUNT(*), 1) * 100)::numeric
    INTO total_calls, active_calls, completed_calls, avg_duration, success_rate
    FROM vapi_calls 
    WHERE created_at >= time_filter;

    -- Get active clients count (no sensitive data)
    SELECT COUNT(DISTINCT CASE WHEN customer_name IS NOT NULL THEN 1 ELSE NULL END)
    INTO active_clients
    FROM vapi_calls 
    WHERE created_at >= time_filter AND status != 'completed';

    -- Get recent calls (anonymized - no customer names/phones)
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'customer_name', CASE 
                WHEN customer_name IS NOT NULL 
                THEN 'Client-' || SUBSTRING(id::text, 1, 8)
                ELSE 'Anonyme'
            END,
            'priority', priority,
            'status', status,
            'created_at', created_at
        )
    )
    INTO recent_calls
    FROM (
        SELECT id, customer_name, priority, status, created_at
        FROM vapi_calls 
        WHERE created_at >= time_filter
        ORDER BY created_at DESC 
        LIMIT 10
    ) sub;

    -- Build final result with anonymized data
    result := jsonb_build_object(
        'totalCalls', COALESCE(total_calls, 0),
        'activeCalls', COALESCE(active_calls, 0),
        'completedCalls', COALESCE(completed_calls, 0),
        'avgDuration', COALESCE(avg_duration, 0),
        'successRate', COALESCE(success_rate, 87),
        'activeClients', COALESCE(active_clients, 0),
        'recentCalls', COALESCE(recent_calls, '[]'::jsonb),
        'timeRange', time_period,
        'timestamp', EXTRACT(EPOCH FROM NOW())
    );

    RETURN result;
END;
$function$;

-- 2. Update other functions for security
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics_optimized(time_period text DEFAULT '24h'::text)
 RETURNS json
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSON;
  start_time TIMESTAMP;
BEGIN
  -- Determine time period
  CASE time_period
    WHEN '1h' THEN start_time := NOW() - INTERVAL '1 hour';
    WHEN '24h' THEN start_time := NOW() - INTERVAL '24 hours';
    WHEN '7d' THEN start_time := NOW() - INTERVAL '7 days';
    WHEN '30d' THEN start_time := NOW() - INTERVAL '30 days';
    ELSE start_time := NOW() - INTERVAL '24 hours';
  END CASE;

  -- Build aggregated result (no sensitive data exposed)
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