-- Create the dashboard metrics function that was missing
-- This function aggregates data from various tables to provide dashboard KPIs

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

  -- Build aggregated result with real data
  SELECT json_build_object(
    'totalCalls', (SELECT COUNT(*) FROM vapi_calls WHERE created_at >= start_time),
    'activeCalls', (SELECT COUNT(*) FROM vapi_calls WHERE status = 'active'),
    'completedCalls', (SELECT COUNT(*) FROM vapi_calls WHERE status = 'completed'),
    'urgentCalls', (SELECT COUNT(*) FROM vapi_calls WHERE priority IN ('P1', 'P2')),
    'activeClients', (SELECT COUNT(*) FROM clients WHERE status = 'active'),
    'totalInterventions', (SELECT COUNT(*) FROM interventions WHERE created_at >= start_time),
    'avgDuration', COALESCE((SELECT AVG(duration) FROM vapi_calls WHERE created_at >= start_time), 0),
    'successRate', CASE
      WHEN (SELECT COUNT(*) FROM vapi_calls WHERE created_at >= start_time) > 0
      THEN ((SELECT COUNT(*) FROM vapi_calls WHERE status = 'completed' AND created_at >= start_time)::float /
            (SELECT COUNT(*) FROM vapi_calls WHERE created_at >= start_time) * 100)
      ELSE 0
    END,
    'timeRange', time_period,
    'startTime', start_time,
    'endTime', NOW()
  ) INTO result;

  RETURN result;
END;
$function$;

-- Add sample data for testing
INSERT INTO vapi_calls (customer_name, phone_number, status, priority, duration, created_at) VALUES
  ('Restaurant Chez Mario', '514-555-0101', 'active', 'P1', 0, NOW() - INTERVAL '2 hours'),
  ('Hôtel Château Frontenac', '418-555-0102', 'completed', 'P2', 180, NOW() - INTERVAL '5 hours'),
  ('École Saint-Joseph', '514-555-0103', 'active', 'P3', 0, NOW() - INTERVAL '1 hour'),
  ('Résidence Bellevue', '450-555-0104', 'completed', 'P2', 240, NOW() - INTERVAL '3 days'),
  ('Copropriété Les Jardins', '514-555-0105', 'pending', 'P1', 0, NOW() - INTERVAL '30 minutes'),
  ('Bureau Municipal', '514-555-0106', 'completed', 'P3', 120, NOW() - INTERVAL '1 day'),
  ('Centre Commercial Plaza', '450-555-0107', 'active', 'P2', 0, NOW() - INTERVAL '4 hours'),
  ('Clinique Médicale', '514-555-0108', 'completed', 'P1', 300, NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- Update some clients to have active status
UPDATE clients SET status = 'active' WHERE name IN (
  'Copropriété Les Jardins',
  'École Primaire Saint-Joseph',
  'Hôtel Château Frontenac'
);

-- Add more interventions for realistic data
INSERT INTO interventions (client_id, title, description, status, priority, service_type, scheduled_date, created_at)
SELECT
  c.id,
  'Maintenance ' || c.name,
  'Intervention de maintenance préventive',
  CASE WHEN random() > 0.5 THEN 'planned' ELSE 'in_progress' END,
  CASE WHEN random() > 0.7 THEN 'urgent' ELSE 'normal' END,
  'plumbing',
  CURRENT_DATE + (random() * 7)::int,
  NOW() - (random() * INTERVAL '7 days')
FROM clients c
WHERE NOT EXISTS (
  SELECT 1 FROM interventions i WHERE i.client_id = c.id
)
LIMIT 5;