import { supabase } from "@/integrations/supabase/client";

// Environment configuration
const config = {
  vapi: {
    publicKey: import.meta.env.VITE_VAPI_PUBLIC_KEY || '',
    assistantId: import.meta.env.VITE_VAPI_ASSISTANT_ID || '',
    webhookUrl: '/api/vapi/webhook'
  },
  twilio: {
    accountSid: import.meta.env.VITE_TWILIO_ACCOUNT_SID || '',
    webhookUrl: '/api/twilio/sms'
  },
  n8n: {
    webhookUrl: import.meta.env.VITE_N8N_WEBHOOK_URL || '',
  },
  maps: {
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  }
};

// VAPI Voice AI Integration
export class VAPIService {
  static async startCall(phoneNumber: string, context: any) {
    try {
      const response = await fetch('/api/vapi/start-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.vapi.publicKey}`
        },
        body: JSON.stringify({
          phoneNumber,
          assistantId: config.vapi.assistantId,
          context
        })
      });
      return await response.json();
    } catch (error) {
      console.error('VAPI call failed:', error);
      throw error;
    }
  }

  static async getCallTranscript(callId: string) {
    const { data, error } = await supabase
      .from('call_transcripts')
      .select('id, customer_phone, service_type, customer_name, priority, status, created_at')
      .eq('call_id', callId)
      .order('timestamp', { ascending: true });
    
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
      console.error('SMS sending failed:', error);
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
      console.error('Bulk SMS sending failed:', error);
      throw error;
    }
  }
}

// n8n Automation Service
export class AutomationService {
  static async triggerWorkflow(workflowName: string, data: any) {
    try {
      const response = await fetch(`${config.n8n.webhookUrl}/${workflowName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      return await response.json();
    } catch (error) {
      console.error('n8n workflow trigger failed:', error);
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
      console.error('Geocoding error:', error);
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
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&waypoints=optimize:true|${waypointsParam}&key=${config.maps.apiKey}`
      );
      
      return await response.json();
    } catch (error) {
      console.error('Route optimization error:', error);
      throw error;
    }
  }
}

// Supabase Real-time Service
export class RealtimeService {
  static subscribeToTable(table: string, callback: (payload: any) => void) {
    return supabase
      .channel(`public:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe();
  }

  static subscribeToUserData(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`user:${userId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'vapi_calls',
          filter: `customer_id=eq.${userId}`
        }, 
        callback
      )
      .subscribe();
  }

  static unsubscribe(channel: any) {
    return supabase.removeChannel(channel);
  }
}

export { config };