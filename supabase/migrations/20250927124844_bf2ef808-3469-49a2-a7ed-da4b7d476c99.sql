-- Create optimized indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vapi_calls_created_at ON public.vapi_calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vapi_calls_status ON public.vapi_calls(status);
CREATE INDEX IF NOT EXISTS idx_vapi_calls_priority ON public.vapi_calls(priority);
CREATE INDEX IF NOT EXISTS idx_vapi_calls_customer_name ON public.vapi_calls(customer_name);

CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);

CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);

-- Create ultra-fast dashboard snapshot RPC function
CREATE OR REPLACE FUNCTION public.get_dashboard_snapshot(time_period text DEFAULT '24h')
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
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

    -- Get call metrics
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'active'),
        COUNT(*) FILTER (WHERE status = 'completed'),
        AVG(EXTRACT(EPOCH FROM (ended_at - started_at)))::numeric,
        (COUNT(*) FILTER (WHERE status = 'completed')::numeric / GREATEST(COUNT(*), 1) * 100)::numeric
    INTO total_calls, active_calls, completed_calls, avg_duration, success_rate
    FROM vapi_calls 
    WHERE created_at >= time_filter;

    -- Get active clients count
    SELECT COUNT(DISTINCT customer_name)
    INTO active_clients
    FROM vapi_calls 
    WHERE created_at >= time_filter AND status != 'completed';

    -- Get recent calls (last 10)
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'customer_name', customer_name,
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

    -- Build final result
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
$$;

-- Create function to get client summary
CREATE OR REPLACE FUNCTION public.get_client_summary()
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    result jsonb;
    total_clients int;
    active_clients int;
    new_leads int;
BEGIN
    -- Get client counts
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'active')
    INTO total_clients, active_clients
    FROM clients;

    -- Get new leads count
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
$$;