import { supabase } from "@/integrations/supabase/client";
import { apiClient } from "@/config/api.config";
import logger from '@/lib/logger';
import { getServiceConfig } from '@/config/unified.api.config';
import type { UnifiedAPIConfig } from '@/config/unified.api.config';
import type {
  CallContext,
  RealtimePayload,
  WebhookClientData,
  WebhookCallData,
  WebhookInterventionData,
  WebhookFeedbackData
} from '@/types/api.types';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Environment configuration
type FeatureKey = 'vapi' | 'sms' | 'automation' | 'maps';

type DisabledFeatureResponse = {
  disabled: true;
  reason: string;
};

function getFeatureAvailability<T extends FeatureKey>(feature: T):
  | { enabled: true; config: UnifiedAPIConfig['services'][T] }
  | { enabled: false; reason: string } {
  const config = getServiceConfig(feature);

  if (config.enabled) {
    return { enabled: true as const, config };
  }

  let reason = 'Feature disabled in configuration';

  switch (feature) {
    case 'vapi': {
      const vapiConfig = config as UnifiedAPIConfig['services']['vapi'];
      reason = vapiConfig.publicKey
        ? 'VITE_ENABLE_VAPI est désactivé'
        : 'Clé publique VAPI manquante';
      break;
    }
    case 'sms': {
      const smsConfig = config as UnifiedAPIConfig['services']['sms'];
      reason = smsConfig.accountSid
        ? 'VITE_ENABLE_SMS est désactivé'
        : 'Identifiant de compte Twilio manquant';
      break;
    }
    case 'maps': {
      const mapsConfig = config as UnifiedAPIConfig['services']['maps'];
      reason = mapsConfig.apiKey
        ? 'VITE_ENABLE_MAPS est désactivé'
        : 'Clé Google Maps manquante';
      break;
    }
    case 'automation': {
      const automationConfig = config as UnifiedAPIConfig['services']['automation'];
      reason = automationConfig.baseUrl
        ? 'VITE_ENABLE_AUTOMATION est désactivé'
        : 'URL n8n manquante';
      break;
    }
    default:
      reason = 'Fonctionnalité désactivée';
  }

  return { enabled: false as const, reason };
}


// VAPI Voice AI Integration
export class VAPIService {
  static async startCall(phoneNumber: string, context: CallContext) {
    const availability = getFeatureAvailability('vapi');
    if (!availability.enabled) {
      logger.warn('VAPI call skipped because the feature is disabled', {
        reason: availability.reason,
      });
      return { disabled: true as const, reason: availability.reason } satisfies DisabledFeatureResponse;
    }

    try {
      const { data, error } = await supabase.functions.invoke('vapi-call', {
        body: {
          phone_number: phoneNumber,
          assistant_id: availability.config.assistantId,
          context
        }
      });
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('VAPI call failed:', error);
      throw error;
    }
  }

  static async getCallTranscript(callId: string) {
      const { data, error } = await supabase
        .from('call_transcripts')
        .select('id, call_id, message, role, confidence, created_at, timestamp, metadata')
        .eq('call_id', callId)
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
}

// Twilio SMS Service
export class SMSService {
  static async sendSMS(to: string, message: string, priority: 'normal' | 'urgent' = 'normal') {
    const availability = getFeatureAvailability('sms');
    if (!availability.enabled) {
      logger.warn('SMS sending skipped because the feature is disabled', {
        reason: availability.reason,
      });
      return { disabled: true as const, reason: availability.reason } satisfies DisabledFeatureResponse;
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          to,
          message,
          priority
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('SMS sending failed:', error);
      throw error;
    }
  }

  static async sendBulkSMS(recipients: string[], message: string) {
    const availability = getFeatureAvailability('sms');
    if (!availability.enabled) {
      logger.warn('Bulk SMS skipped because the feature is disabled', {
        reason: availability.reason,
      });
      return { disabled: true as const, reason: availability.reason } satisfies DisabledFeatureResponse;
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-bulk-sms', {
        body: {
          recipients,
          message
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Bulk SMS sending failed:', error);
      throw error;
    }
  }
}

// n8n Automation Service
export class AutomationService {
  static async triggerWorkflow(
    workflowName: string,
    data: WebhookClientData | WebhookCallData | WebhookInterventionData | WebhookFeedbackData
  ) {
    const availability = getFeatureAvailability('automation');
    if (!availability.enabled) {
      logger.warn('Automation workflow skipped because the feature is disabled', {
        workflow: workflowName,
        reason: availability.reason,
      });
      return { disabled: true as const, reason: availability.reason } satisfies DisabledFeatureResponse;
    }

    try {
      const { data: result, error } = await apiClient.post('/functions/v1/n8n-webhook', {
        webhook: workflowName,
        payload: data,
      });
      if (error) throw new Error(error);
      return result;
    } catch (error) {
      logger.error('n8n workflow trigger failed:', error);
      throw error;
    }
  }

  static async sendFeedback(feedback: {
    type: 'bug' | 'feature' | 'general',
    message: string,
    priority: 'low' | 'medium' | 'high',
    userEmail: string
  }) {
    return this.triggerWorkflow('feedback', feedback);
  }
}

// Google Maps Service
export class MapsService {
  static async geocodeAddress(address: string) {
    const availability = getFeatureAvailability('maps');
    if (!availability.enabled) {
      logger.warn('Geocoding skipped because Google Maps is disabled', {
        reason: availability.reason,
      });
      return { lat: null, lng: null, error: availability.reason } satisfies {
        lat: number | null;
        lng: number | null;
        error: string;
      };
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${availability.config.apiKey}`
      );
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng,
          formatted_address: data.results[0].formatted_address
        };
      }
      throw new Error('Geocoding failed');
    } catch (error) {
      logger.error('Geocoding error:', error);
      throw error;
    }
  }

  static async optimizeRoute(waypoints: Array<{lat: number, lng: number}>) {
    const availability = getFeatureAvailability('maps');
    if (!availability.enabled) {
      logger.warn('Route optimization skipped because Google Maps is disabled', {
        reason: availability.reason,
      });
      return { disabled: true as const, reason: availability.reason } satisfies DisabledFeatureResponse;
    }

    try {
      const origin = waypoints[0];
      const destination = waypoints[waypoints.length - 1];
      const intermediateWaypoints = waypoints.slice(1, -1);
      
      const waypointsParam = intermediateWaypoints
        .map(wp => `${wp.lat},${wp.lng}`)
        .join('|');
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin?.lat},${origin?.lng}&destination=${destination?.lat},${destination?.lng}&waypoints=optimize:true|${waypointsParam}&key=${availability.config.apiKey}`
      );
      
      return await response.json();
    } catch (error) {
      logger.error('Route optimization error:', error);
      throw error;
    }
  }
}

// Supabase Real-time Service
export class RealtimeService {
  static subscribeToTable(
    table: string,
    callback: (payload: RealtimePayload) => void
  ): RealtimeChannel {
    return supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe();
  }

  static subscribeToUserData(
    userId: string,
    callback: (payload: RealtimePayload) => void
  ): RealtimeChannel {
    return supabase
      .channel(`user:${userId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'vapi_calls'
        }, 
        callback
      )
      .subscribe();
  }

  static unsubscribe(channel: RealtimeChannel) {
    return supabase.removeChannel(channel);
  }
}

export { config };
