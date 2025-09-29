-- Create the missing dashboard metrics function
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics_optimized(time_period text DEFAULT '24h')
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