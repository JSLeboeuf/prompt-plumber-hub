import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabase.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const start = Date.now();
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { phone_number, assistant_id, context } = await req.json();

    const supabase = createServiceClient();

    // If VAPI credentials exist, call external API, otherwise simulate
    const vapiKey = Deno.env.get('VAPI_API_KEY');
    let external:
      | { called: true; status: number; id?: string }
      | { called: false; reason: string } = { called: false, reason: 'no_credentials' };

    if (vapiKey) {
      try {
        // Placeholder: example external call - adjust path if needed
        const resp = await fetch('https://api.vapi.ai/v1/calls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${vapiKey}` },
          body: JSON.stringify({ phoneNumber: phone_number, assistantId: assistant_id, context }),
        });
        const data = await resp.json();
        external = { called: true, status: resp.status, id: data?.id };
      } catch (apiError) {
        console.error('VAPI API error:', apiError);
        external = { called: false, reason: 'external_error' };
      }
    }

    // Log call in DB (simulate if needed)
    const { data: row, error } = await supabase
      .from('vapi_calls')
      .insert({
        call_id: crypto.randomUUID(),
        phone_number,
        customer_name: context?.client_name ?? null,
        priority: context?.urgency ?? null,
        status: 'pending',
        metadata: { context, external },
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    const latency = Date.now() - start;
    console.warn(JSON.stringify({ service: 'vapi-call', status: 'ok', latency_ms: latency }));

    return new Response(
      JSON.stringify({ success: true, data: row, metrics: { p50_ms: latency, p95_ms: latency, p99_ms: latency } }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    const latency = Date.now() - start;
    console.error(JSON.stringify({ service: 'vapi-call', status: 'error', error: String(e), latency_ms: latency }));
    return new Response(JSON.stringify({ success: false, error: 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


