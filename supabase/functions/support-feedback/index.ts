import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SupportRequest {
  client_name: string;
  client_phone?: string;
  client_email?: string;
  subject: string;
  description: string;
  category?: 'general' | 'technical' | 'billing' | 'urgent' | 'feedback';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const supportRequest: SupportRequest = await req.json();

    // Validation des données obligatoires
    if (!supportRequest.client_name || !supportRequest.subject || !supportRequest.description) {
      throw new Error('client_name, subject et description sont obligatoires');
    }

    // Créer le ticket de support dans la base de données
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        client_name: supportRequest.client_name,
        client_phone: supportRequest.client_phone,
        client_email: supportRequest.client_email,
        subject: supportRequest.subject,
        description: supportRequest.description,
        category: supportRequest.category || 'general',
        priority: supportRequest.priority || 'normal',
        status: 'open'
      })
      .select()
      .single();

    if (ticketError) {
      console.error('Erreur création ticket:', ticketError);
      throw new Error(`Erreur création ticket: ${ticketError.message}`);
    }

    console.log('Ticket de support créé:', ticket);

    // Logger l'action dans audit_logs
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        user_email: supportRequest.client_email || 'anonymous',
        action: 'CREATE',
        resource_type: 'support_tickets',
        resource_id: ticket.id,
        new_values: ticket,
        metadata: {
          source: 'support-feedback-function',
          client_name: supportRequest.client_name
        }
      });

    if (auditError) {
      console.warn('Erreur audit log:', auditError);
    }

    // Si le ticket est urgent, créer une alerte
    if (supportRequest.priority === 'urgent') {
      const { error: alertError } = await supabase
        .from('alerts')
        .insert({
          type: 'support_urgent',
          message: `Ticket urgent créé: ${supportRequest.subject}`,
          priority: 'high',
          metadata: {
            ticket_id: ticket.id,
            client_name: supportRequest.client_name,
            client_phone: supportRequest.client_phone
          }
        });

      if (alertError) {
        console.warn('Erreur création alerte:', alertError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        ticket,
        message: 'Ticket de support créé avec succès'
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Erreur support-feedback:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur interne du serveur'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});