import { supabase } from "@/integrations/supabase/client";
import { apiClient } from "@/config/api.config";
import { logger } from '@/lib/logger';
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
const config = {
  vapi: {
    publicKey: import.meta.env.VITE_VAPI_PUBLIC_KEY,
    assistantId: import.meta.env.VITE_VAPI_ASSISTANT_ID,
  },
  twilio: {
    accountSid: import.meta.env.VITE_TWILIO_ACCOUNT_SID,
  },
  n8n: {
    webhookUrl: import.meta.env.VITE_N8N_BASE_URL,
  },
  maps: {
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  }
};

// VAPI Voice AI Integration
export class VAPIService {
  static async startCall(phoneNumber: string, context: CallContext) {
    try {
      const { data, error } = await supabase.functions.invoke('vapi-call', {
        body: {
          phone_number: phoneNumber,
          assistant_id: config.vapi.assistantId,
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
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${config.maps.apiKey}`
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
    try {
      const origin = waypoints[0];
      const destination = waypoints[waypoints.length - 1];
      const intermediateWaypoints = waypoints.slice(1, -1);
      
      const waypointsParam = intermediateWaypoints
        .map(wp => `${wp.lat},${wp.lng}`)
        .join('|');
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin?.lat},${origin?.lng}&destination=${destination?.lat},${destination?.lng}&waypoints=optimize:true|${waypointsParam}&key=${config.maps.apiKey}`
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