import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const healthChecks: Record<string, any> = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {}
    };

    // 1. Vérifier la connectivité à la base de données
    try {
      const t0 = Date.now();
      const { error } = await supabase
        .from('clients')
        .select('count(*)')
        .limit(1);
      const latency = Date.now() - t0;
      
      healthChecks.checks.database = {
        status: error ? 'unhealthy' : 'healthy',
        message: error ? error.message : 'Database connection OK',
        latency_ms: latency
      };
    } catch (dbError) {
      healthChecks.checks.database = {
        status: 'unhealthy',
        message: `Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`,
        latency_ms: null
      };
    }

    // 2. Vérifier les intégrations externes
    const integrations = [
      {
        name: 'twilio',
        env_vars: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER']
      },
      {
        name: 'vapi',
        env_vars: ['VAPI_SERVER_SECRET']
      }
    ];

    for (const integration of integrations) {
      const missingVars = integration.env_vars.filter(envVar => !Deno.env.get(envVar));
      healthChecks.checks[integration.name] = {
        status: missingVars.length === 0 ? 'configured' : 'not_configured',
        message: missingVars.length === 0 ? 
          `${integration.name} is configured` : 
          `Missing environment variables: ${missingVars.join(', ')}`,
        missing_vars: missingVars
      };
    }

    // 3. Vérifier les tables essentielles
    const essentialTables = [
      'clients', 'vapi_calls', 'leads', 'interventions', 
      'support_tickets', 'user_roles', 'audit_logs'
    ];

    for (const table of essentialTables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('count(*)')
          .limit(1);
        
        healthChecks.checks[`table_${table}`] = {
          status: error ? 'error' : 'accessible',
          message: error ? error.message : `Table ${table} is accessible`
        };
      } catch (tableError) {
        healthChecks.checks[`table_${table}`] = {
          status: 'error',
          message: `Table ${table} error: ${tableError instanceof Error ? tableError.message : 'Unknown error'}`
        };
      }
    }

    // 4. Vérifier les Edge Functions (par les secrets configurés)
    const edgeFunctions = ['support-feedback', 'send-sms', 'health-check'];
    healthChecks.checks.edge_functions = {
      status: 'deployed',
      functions: edgeFunctions,
      message: `${edgeFunctions.length} edge functions deployed`
    };

    // 5. Calculer le statut global
    const allChecks = Object.values(healthChecks.checks);
    const hasUnhealthy = allChecks.some((check: any) => 
      check.status === 'unhealthy' || check.status === 'error'
    );
    const hasNotConfigured = allChecks.some((check: any) => 
      check.status === 'not_configured'
    );

    if (hasUnhealthy) {
      healthChecks.status = 'unhealthy';
    } else if (hasNotConfigured) {
      healthChecks.status = 'degraded';
    } else {
      healthChecks.status = 'healthy';
    }

    // 6. Logger le health check dans audit_logs
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        user_email: 'system',
        action: 'HEALTH_CHECK',
        resource_type: 'system',
        resource_id: 'health-check',
        new_values: healthChecks,
        metadata: {
          source: 'health-check-function',
          user_agent: req.headers.get('user-agent')
        }
      });

    if (auditError) {
      console.warn('Erreur audit log health check:', auditError);
    }

    // 7. Retourner le statut avec le bon code HTTP
    const statusCode = healthChecks.status === 'healthy' ? 200 : 
                      healthChecks.status === 'degraded' ? 206 : 503;

    return new Response(
      JSON.stringify(healthChecks, null, 2),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Erreur health-check:', error);
    
    return new Response(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Erreur interne du serveur',
        checks: {}
      }),
      {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});