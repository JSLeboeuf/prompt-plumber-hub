-- Step 2: Fix remaining security issues and strengthen RLS policies

-- Fix remaining functions with search_path issues
CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    DELETE FROM public.rate_limits
    WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_client_summary()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    result jsonb;
    total_clients int;
    active_clients int;
    new_leads int;
BEGIN
    -- Get client counts (admin only access)
    IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
        RAISE EXCEPTION 'Access denied: Admin role required';
    END IF;
    
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'active')
    INTO total_clients, active_clients
    FROM clients;

    SELECT COUNT(*)
    INTO new_leads
    FROM leads 
    WHERE status IN ('nouveau', 'en_cours');

    result := jsonb_build_object(
        'totalClients', COALESCE(total_clients, 0),
        'activeClients', COALESCE(active_clients, 0),
        'newLeads', COALESCE(new_leads, 0),
        'timestamp', EXTRACT(EPOCH FROM NOW())
    );

    RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- Add GDPR compliance functions
CREATE OR REPLACE FUNCTION public.anonymize_customer_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Only admins can run anonymization
    IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
        RAISE EXCEPTION 'Access denied: Admin role required';
    END IF;
    
    -- Anonymize old call logs (older than 1 year for GDPR compliance)
    UPDATE call_logs 
    SET 
        phone_number = 'ANONYMIZED',
        transcript = 'ANONYMIZED',
        summary = 'ANONYMIZED'
    WHERE created_at < NOW() - INTERVAL '365 days'
    AND phone_number != 'ANONYMIZED';
    
    -- Anonymize old SMS logs  
    UPDATE sms_logs
    SET 
        customer_phone = 'ANONYMIZED',
        customer_name = 'ANONYMIZED',
        message = 'ANONYMIZED'
    WHERE created_at < NOW() - INTERVAL '365 days'
    AND customer_phone != 'ANONYMIZED';
    
    -- Anonymize old VAPI calls
    UPDATE vapi_calls
    SET 
        phone_number = 'ANONYMIZED',
        customer_name = 'ANONYMIZED'
    WHERE created_at < NOW() - INTERVAL '365 days'
    AND phone_number != 'ANONYMIZED';
    
    -- Log the anonymization action
    INSERT INTO audit_logs (
        user_id,
        user_email,
        action,
        resource_type,
        metadata
    ) VALUES (
        auth.uid(),
        auth.email(),
        'data_anonymization',
        'gdpr_compliance',
        jsonb_build_object('timestamp', NOW())
    );
END;
$function$;

-- Strengthen RLS policies for sensitive data

-- Secure call_logs table - restrict access to sensitive data
DROP POLICY IF EXISTS "call_logs_read_anon" ON public.call_logs;
CREATE POLICY "call_logs_admin_only" ON public.call_logs
FOR SELECT 
USING (
    auth.role() = 'service_role'::text OR 
    has_role(auth.uid(), 'admin'::app_role)
);

-- Secure analytics table - remove anonymous access
DROP POLICY IF EXISTS "Service role has full access to analytics" ON public.analytics;
CREATE POLICY "analytics_admin_only" ON public.analytics
FOR ALL
USING (
    auth.role() = 'service_role'::text OR 
    has_role(auth.uid(), 'admin'::app_role)
);

-- Secure SMS logs - admin only access
DROP POLICY IF EXISTS "sms_logs_read_anon" ON public.sms_logs;
DROP POLICY IF EXISTS "sms_logs_select_authenticated" ON public.sms_logs;
CREATE POLICY "sms_logs_admin_only" ON public.sms_logs
FOR SELECT
USING (
    auth.role() = 'service_role'::text OR 
    has_role(auth.uid(), 'admin'::app_role)
);