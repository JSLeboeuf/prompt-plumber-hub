import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BulkSMSRequest {
  message: string;
  recipients: {
    name: string;
    phone: string;
    client_id?: string;
  }[];
  service_type?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  schedule_at?: string; // ISO string pour envoi différé
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const bulkRequest: BulkSMSRequest = await req.json();

    // Validation des données obligatoires
    if (!bulkRequest.message || !bulkRequest.recipients || bulkRequest.recipients.length === 0) {
      throw new Error('Le message et la liste des destinataires sont obligatoires');
    }

    // Validation des destinataires
    for (const recipient of bulkRequest.recipients) {
      if (!recipient.name || !recipient.phone) {
        throw new Error('Chaque destinataire doit avoir un nom et un numéro de téléphone');
      }
    }

    console.log(`Envoi de SMS en masse à ${bulkRequest.recipients.length} destinataires`);

    const results: any[] = [];
    const isSimulated = !twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber;

    if (isSimulated) {
      console.warn('Twilio non configuré, simulation d\'envoi SMS en masse');
    }

    // Traitement par lot pour éviter de surcharger l'API
    const batchSize = 10;
    for (let i = 0; i < bulkRequest.recipients.length; i += batchSize) {
      const batch = bulkRequest.recipients.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (recipient) => {
        try {
          let twilioData = null;
          
          if (!isSimulated) {
            // Envoi réel via Twilio
            const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
            const credentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`);

            const formData = new URLSearchParams();
            formData.append('To', recipient.phone);
            formData.append('From', twilioPhoneNumber);
            formData.append('Body', bulkRequest.message);

            if (bulkRequest.schedule_at) {
              // Note: Twilio ne supporte pas nativement l'envoi différé via l'API REST
              // Il faudrait utiliser un système de queue/cron
              console.warn('Envoi différé non supporté par cette implémentation');
            }

            const twilioResponse = await fetch(twilioUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: formData
            });

            twilioData = await twilioResponse.json();
            
            if (!twilioResponse.ok) {
              throw new Error(`Erreur Twilio: ${twilioData.message || 'Erreur inconnue'}`);
            }
          }

          return {
            recipient,
            success: true,
            status: isSimulated ? 'simulated' : twilioData?.status,
            sid: twilioData?.sid,
            twilio_data: twilioData
          };

        } catch (error) {
          console.error(`Erreur envoi SMS à ${recipient.name} (${recipient.phone}):`, error);
          return {
            recipient,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 'failed'
          };
        }
      });

      // Attendre que le lot se termine avant de passer au suivant
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Pause entre les lots pour respecter les limites de taux
      if (i + batchSize < bulkRequest.recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Statistiques des résultats
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`SMS en masse terminé: ${successful} réussis, ${failed} échoués`);

    // Logger l'envoi en masse dans sms_logs
    const { data: smsLog, error: logError } = await supabase
      .from('sms_logs')
      .insert({
        customer_phone: 'BULK',
        customer_name: `Envoi en masse (${bulkRequest.recipients.length} destinataires)`,
        service_type: bulkRequest.service_type || 'bulk',
        priority: bulkRequest.priority || 'normal',
        message: bulkRequest.message,
        recipients: results.map(r => ({
          name: r.recipient.name,
          phone: r.recipient.phone,
          status: r.status,
          sid: r.sid,
          success: r.success,
          error: r.error
        }))
      })
      .select()
      .single();

    if (logError) {
      console.error('Erreur log SMS en masse:', logError);
    }

    // Logger l'action dans audit_logs
    const { error: auditError } = await supabase
      .from('audit_logs')
      .insert({
        user_email: 'system',
        action: 'BULK_SMS_SENT',
        resource_type: 'sms_logs',
        resource_id: smsLog?.id,
        new_values: {
          message: bulkRequest.message,
          recipients_count: bulkRequest.recipients.length,
          successful_count: successful,
          failed_count: failed
        },
        metadata: {
          source: 'send-bulk-sms-function',
          simulated: isSimulated,
          service_type: bulkRequest.service_type,
          priority: bulkRequest.priority
        }
      });

    if (auditError) {
      console.warn('Erreur audit log:', auditError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `SMS en masse ${isSimulated ? 'simulé' : 'envoyé'}`,
        summary: {
          total: bulkRequest.recipients.length,
          successful,
          failed,
          simulated: isSimulated
        },
        results,
        sms_log: smsLog
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Erreur send-bulk-sms:', error);
    
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