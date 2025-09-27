import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const start = Date.now();
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { webhook, payload } = await req.json();
    const base = Deno.env.get('N8N_BASE_URL');
    if (!base) {
      return new Response(JSON.stringify({ success: false, error: 'N8N not configured' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const url = `${base}/webhook/${webhook}`;
    const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await resp.text();

    const latency = Date.now() - start;
    return new Response(JSON.stringify({ success: resp.ok, status: resp.status, data, metrics: { p50_ms: latency } }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    const latency = Date.now() - start;
    console.error(JSON.stringify({ service: 'n8n-webhook', status: 'error', error: String(e), latency_ms: latency }));
    return new Response(JSON.stringify({ success: false, error: 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


