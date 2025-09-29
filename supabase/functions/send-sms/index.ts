import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createServiceClient } from '../_shared/supabase.ts';

interface SMSRequest {
  to: string; // Numéro de téléphone du destinataire
  message: string;
  customer_name?: string;
  service_type?: string;
  priority?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createServiceClient();
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const smsRequest: SMSRequest = await req.json();

    // Validation des données obligatoires
    if (!smsRequest.to || !smsRequest.message) {
      throw new Error('Le numéro de téléphone et le message sont obligatoires');
    }

    // Vérifier si Twilio est configuré
    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.warn('Twilio non configuré, simulation d\'envoi SMS');
      
      // Logger le SMS "simulé" dans la base
      const { data: smsLog, error: logError } = await supabase
        .from('sms_logs')
        .insert({
          customer_phone: smsRequest.to,
          customer_name: smsRequest.customer_name || 'Inconnu',
          service_type: smsRequest.service_type || 'general',
          priority: smsRequest.priority || 'normal',
          message: smsRequest.message,
          recipients: [{ phone: smsRequest.to, status: 'simulated' }]
        })
        .select()
        .single();

      if (logError) {
        console.error('Erreur log SMS:', logError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'SMS simulé (Twilio non configuré)',
          sms_log: smsLog,
          simulated: true
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Envoyer le SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
    const credentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

    const formData = new URLSearchParams();
    formData.append('To', smsRequest.to);
    formData.append('From', twilioPhoneNumber);
    formData.append('Body', smsRequest.message);

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      throw new Error(`Erreur Twilio: ${twilioData.message || 'Erreur inconnue'}`);
    }

    console.warn('SMS envoyé avec succès:', twilioData);

    // Logger le SMS dans la base de données
    const { data: smsLog, error: logError } = await supabase
      .from('sms_logs')
      .insert({
        customer_phone: smsRequest.to,
        customer_name: smsRequest.customer_name || 'Inconnu',
        service_type: smsRequest.service_type || 'general',
        priority: smsRequest.priority || 'normal',
        message: smsRequest.message,
        recipients: [{
          phone: smsRequest.to,
          status: twilioData.status,
          sid: twilioData.sid,
          twilio_data: twilioData
        }]
      })
      .select()
      .single();

    if (logError) {
      console.error('Erreur log SMS:', logError);
    }

    // Logger l'action dans audit_logs
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        user_email: 'system',
        action: 'SMS_SENT',
        resource_type: 'sms_logs',
        resource_id: smsLog?.id,
        new_values: {
          to: smsRequest.to,
          message: smsRequest.message,
          twilio_sid: twilioData.sid
        },
        metadata: {
          source: 'send-sms-function',
          twilio_status: twilioData.status
        }
      });

    if (auditError) {
      console.warn('Erreur audit log:', auditError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'SMS envoyé avec succès',
        twilio_data: twilioData,
        sms_log: smsLog
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Erreur send-sms:', error);
    
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