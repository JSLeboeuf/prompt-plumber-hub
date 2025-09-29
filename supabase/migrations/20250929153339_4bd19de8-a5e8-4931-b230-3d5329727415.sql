-- Phase 4: Monitoring & Security - Advanced Features

-- 1. Enhanced audit logging system
CREATE OR REPLACE FUNCTION public.log_audit_comprehensive(
  p_user_id uuid,
  p_action text,
  p_resource_type text,
  p_resource_id text DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  audit_id UUID;
  session_info jsonb;
BEGIN
  -- Enrich metadata with session context
  session_info := jsonb_build_object(
    'timestamp', EXTRACT(EPOCH FROM NOW()),
    'database_user', current_user,
    'application_name', current_setting('application_name', true),
    'client_addr', inet_client_addr(),
    'client_port', inet_client_port()
  );

  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values,
    metadata,
    ip_address,
    user_agent,
    session_id
  )
  VALUES (
    p_user_id,
    COALESCE((SELECT email FROM auth.users WHERE id = p_user_id), 'system'),
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values,
    p_metadata || session_info,
    COALESCE(p_ip_address, inet_client_addr()),
    p_user_agent,
    encode(gen_random_bytes(16), 'hex')
  )
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$;

-- 2. Performance monitoring table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metric_unit text DEFAULT 'ms',
  component_name text,
  user_id uuid,
  session_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT NOW()
);

-- Enable RLS for performance metrics
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Policy for performance metrics
CREATE POLICY "Performance metrics admin access" 
ON public.performance_metrics 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access performance" 
ON public.performance_metrics 
FOR ALL 
USING (auth.role() = 'service_role');

-- 3. Security monitoring function
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_severity text DEFAULT 'info',
  p_description text DEFAULT '',
  p_user_id uuid DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_id uuid;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    metadata,
    ip_address
  )
  VALUES (
    p_user_id,
    p_event_type,
    'security_event',
    jsonb_build_object(
      'severity', p_severity,
      'description', p_description,
      'event_timestamp', EXTRACT(EPOCH FROM NOW())
    ) || p_metadata,
    COALESCE(p_ip_address, inet_client_addr())
  )
  RETURNING id INTO event_id;
  
  -- Alert on critical security events
  IF p_severity = 'critical' THEN
    INSERT INTO public.alerts (type, message, priority, metadata)
    VALUES (
      'security_alert',
      'Critical security event detected: ' || p_description,
      'P1',
      jsonb_build_object(
        'event_id', event_id,
        'event_type', p_event_type,
        'user_id', p_user_id
      )
    );
  END IF;
  
  RETURN event_id;
END;
$$;

-- 4. GDPR compliance automation
CREATE OR REPLACE FUNCTION public.auto_anonymize_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  anonymized_count integer := 0;
BEGIN
  -- Anonymize old call logs (older than 2 years for strict compliance)
  UPDATE call_logs 
  SET 
    phone_number = 'ANONYMIZED-' || EXTRACT(YEAR FROM created_at)::text,
    transcript = '[ANONYMIZED]',
    summary = '[ANONYMIZED]'
  WHERE created_at < NOW() - INTERVAL '730 days'
    AND phone_number NOT LIKE 'ANONYMIZED%';
  
  GET DIAGNOSTICS anonymized_count = ROW_COUNT;
  
  -- Anonymize old SMS logs
  UPDATE sms_logs
  SET 
    customer_phone = 'ANONYMIZED-' || EXTRACT(YEAR FROM created_at)::text,
    customer_name = '[ANONYMIZED]',
    message = '[ANONYMIZED]'
  WHERE created_at < NOW() - INTERVAL '730 days'
    AND customer_phone NOT LIKE 'ANONYMIZED%';
    
  -- Anonymize old VAPI calls
  UPDATE vapi_calls
  SET 
    phone_number = 'ANONYMIZED-' || EXTRACT(YEAR FROM created_at)::text,
    customer_name = '[ANONYMIZED]'
  WHERE created_at < NOW() - INTERVAL '730 days'
    AND phone_number NOT LIKE 'ANONYMIZED%';
  
  -- Log the anonymization
  PERFORM log_audit_comprehensive(
    NULL,
    'auto_gdpr_anonymization',
    'data_protection',
    NULL,
    NULL,
    jsonb_build_object(
      'anonymized_records', anonymized_count,
      'retention_period_days', 730
    )
  );
END;
$$;

-- 5. System health monitoring
CREATE OR REPLACE FUNCTION public.get_system_health()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  health_data jsonb;
  db_size bigint;
  active_connections integer;
  slow_queries integer;
BEGIN
  -- Get database size
  SELECT pg_database_size(current_database()) INTO db_size;
  
  -- Get active connections
  SELECT count(*) FROM pg_stat_activity 
  WHERE state = 'active' AND datname = current_database()
  INTO active_connections;
  
  -- Count recent slow queries (hypothetical - would need query logging)
  slow_queries := 0;
  
  health_data := jsonb_build_object(
    'database_size_mb', round(db_size / 1024.0 / 1024.0, 2),
    'active_connections', active_connections,
    'slow_queries_count', slow_queries,
    'last_backup', NOW() - INTERVAL '24 hours', -- Placeholder
    'rls_policies_count', (
      SELECT count(*) FROM pg_policies 
      WHERE schemaname = 'public'
    ),
    'health_score', CASE 
      WHEN active_connections < 20 AND db_size < 1073741824 THEN 'excellent'
      WHEN active_connections < 50 AND db_size < 5368709120 THEN 'good'
      ELSE 'needs_attention'
    END,
    'timestamp', EXTRACT(EPOCH FROM NOW())
  );
  
  RETURN health_data;
END;
$$;

-- 6. Create index for performance monitoring
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created 
ON performance_metrics(created_at DESC, metric_name);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_timestamp 
ON audit_logs(action, timestamp DESC);

-- 7. Automated cleanup job function
CREATE OR REPLACE FUNCTION public.cleanup_old_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clean old performance metrics (keep 30 days)
  DELETE FROM performance_metrics 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Archive old audit logs (keep 1 year, anonymize older)
  UPDATE audit_logs 
  SET 
    user_email = '[ARCHIVED]',
    ip_address = NULL,
    user_agent = NULL,
    old_values = NULL,
    new_values = NULL
  WHERE timestamp < NOW() - INTERVAL '365 days'
    AND user_email != '[ARCHIVED]';
    
  -- Clean very old rate limits
  DELETE FROM rate_limits 
  WHERE window_start < NOW() - INTERVAL '24 hours';
  
  -- Log cleanup operation
  PERFORM log_audit_comprehensive(
    NULL,
    'system_cleanup',
    'maintenance',
    NULL,
    NULL,
    jsonb_build_object(
      'cleanup_timestamp', EXTRACT(EPOCH FROM NOW()),
      'retention_policy', '30d_metrics_1y_audit'
    )
  );
END;
$$;