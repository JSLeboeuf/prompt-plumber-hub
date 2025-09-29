/**
 * Production Webhook Services for Drain Fortin
 * Handles all external API integrations with proper error handling
 */

import { API_CONFIG, apiClient, webhookUtils } from '@/config/api.config';
import type {
  WebhookClientData,
  WebhookCallData,
  WebhookInterventionData,
  WebhookFeedbackData
} from '@/types/api.types';
import logger from '@/lib/logger';
import { getServiceConfig } from '@/config/unified.api.config';
import type { UnifiedAPIConfig } from '@/config/unified.api.config';

export interface VapiCallRequest {
  phoneNumber: string;
  assistantId?: string;
  context?: {
    clientId?: string;
    campaignId?: string;
    metadata?: Record<string, unknown>;
    priority?: 'low' | 'normal' | 'high';
    [key: string]: unknown;
  };
  clientName?: string;
  urgency?: 'low' | 'normal' | 'high';
}

export interface TwilioSmsRequest {
  to: string;
  message: string;
  clientName?: string;
  serviceType?: string;
  priority?: string;
}

export interface SupportFeedbackRequest {
  type: 'call' | 'chat' | 'email' | 'sms';
  message: string;
  clientInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  urgency?: 'low' | 'normal' | 'high';
  metadata?: Record<string, unknown>;
}

type DisabledFeatureResponse = {
  disabled: true;
  reason: string;
};

type FeatureKey = 'vapi' | 'sms' | 'maps' | 'automation';

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

// VAPI Voice AI Service
export const VapiService = {
  async makeCall(request: VapiCallRequest) {
    const availability = getFeatureAvailability('vapi');
    if (!availability.enabled) {
      logger.warn('VAPI call skipped because the feature is disabled', {
        reason: availability.reason,
      });
      return { disabled: true as const, reason: availability.reason } satisfies DisabledFeatureResponse;
    }

    const { data, error } = await apiClient.post('/functions/v1/vapi-call', {
      phone_number: request.phoneNumber,
      assistant_id: request.assistantId || availability.config.assistantId,
      context: {
        client_name: request.clientName,
        urgency: request.urgency || 'normal',
        timestamp: new Date().toISOString(),
        ...request.context
      }
    });

    if (error) {
      throw new Error(`Erreur VAPI: ${error}`);
    }

    return data;
  },

  async initiateEmergencyCall(phoneNumber: string, clientName: string) {
    return this.makeCall({
      phoneNumber,
      clientName,
      urgency: 'high',
      context: {
        call_type: 'emergency',
        auto_greeting: `Bonjour ${clientName}, vous avez contacté Drain Fortin pour une urgence plomberie. Je vais vous mettre en relation avec un technicien.`
      }
    });
  },

  async initiateFollowUpCall(phoneNumber: string, clientName: string, interventionId: string) {
    return this.makeCall({
      phoneNumber,
      clientName,
      urgency: 'normal',
      context: {
        call_type: 'follow_up',
        intervention_id: interventionId,
        auto_greeting: `Bonjour ${clientName}, nous vous contactons pour un suivi de votre intervention Drain Fortin. Comment s'est déroulé le service?`
      }
    });
  },

  async initiateSupportCall(phoneNumber: string, clientName?: string) {
    return this.makeCall({
      phoneNumber,
      clientName: clientName || 'Client',
      urgency: 'normal',
      context: {
        call_type: 'support',
        auto_greeting: 'Bonjour, merci de contacter le support Drain Fortin. Comment puis-je vous aider aujourd\'hui?'
      }
    });
  }
};

// Twilio SMS Service
export const TwilioService = {
  async sendSms(request: TwilioSmsRequest) {
    const availability = getFeatureAvailability('sms');
    if (!availability.enabled) {
      logger.warn('SMS sending skipped because the feature is disabled', {
        reason: availability.reason,
      });
      return { disabled: true as const, reason: availability.reason } satisfies DisabledFeatureResponse;
    }

    const { data, error } = await apiClient.post('/functions/v1/send-sms', {
      to: request.to,
      message: request.message,
      client_name: request.clientName,
      service_type: request.serviceType,
      priority: request.priority || 'normal'
    });

    if (error) {
      throw new Error(`Erreur SMS: ${error}`);
    }

    return data;
  },

  async sendEmergencyConfirmation(phoneNumber: string, clientName: string, estimatedArrival: string) {
    return this.sendSms({
      to: phoneNumber,
      clientName,
      message: `Bonjour ${clientName}, votre demande d'urgence Drain Fortin a été prise en compte. Technicien en route, arrivée prévue: ${estimatedArrival}. Urgence? Appelez: +1 438-601-2625`,
      serviceType: 'emergency',
      priority: 'high'
    });
  },

  async sendInterventionReminder(phoneNumber: string, clientName: string, appointmentDate: string) {
    return this.sendSms({
      to: phoneNumber,
      clientName,
      message: `Rappel RDV Drain Fortin - ${clientName}, intervention prévue le ${appointmentDate}. Pour modifier: +1 438-601-2625`,
      serviceType: 'appointment',
      priority: 'normal'
    });
  },

  async sendCompletionSurvey(phoneNumber: string, clientName: string, interventionId: string) {
    const surveyLink = `${window.location.origin}/feedback?id=${interventionId}`;
    return this.sendSms({
      to: phoneNumber,
      clientName,
      message: `Merci ${clientName}! Votre intervention Drain Fortin est terminée. Évaluez notre service: ${surveyLink}`,
      serviceType: 'feedback',
      priority: 'low'
    });
  },

  async sendCustomMessage(phoneNumber: string, message: string, clientName?: string) {
    return this.sendSms({
      to: phoneNumber,
      message: message,
      clientName: clientName || 'Client',
      serviceType: 'custom',
      priority: 'normal'
    });
  }
};

// n8n Automation Service
export const N8nService = {
  async triggerNewClientWorkflow(clientData: WebhookClientData) {
    const availability = getFeatureAvailability('automation');
    if (!availability.enabled) {
      logger.warn('Automation workflow skipped', {
        workflow: 'newClient',
        reason: availability.reason,
      });
      return { disabled: true as const, reason: availability.reason } satisfies DisabledFeatureResponse;
    }

    return webhookUtils.triggerN8nWebhook('newClient', {
      event: 'client_created',
      client: clientData,
      actions_required: [
        'send_welcome_email',
        'create_crm_record',
        'schedule_follow_up'
      ]
    });
  },

  async triggerEmergencyCallWorkflow(callData: WebhookCallData) {
    const availability = getFeatureAvailability('automation');
    if (!availability.enabled) {
      logger.warn('Automation workflow skipped', {
        workflow: 'emergencyCall',
        reason: availability.reason,
      });
      return { disabled: true as const, reason: availability.reason } satisfies DisabledFeatureResponse;
    }

    return webhookUtils.triggerN8nWebhook('emergencyCall', {
      event: 'emergency_call',
      call: callData,
      actions_required: [
        'notify_on_duty_technician',
        'send_sms_confirmation',
        'create_intervention_record',
        'alert_supervisor_if_P1'
      ]
    });
  },

  async triggerInterventionCompletedWorkflow(interventionData: WebhookInterventionData) {
    const availability = getFeatureAvailability('automation');
    if (!availability.enabled) {
      logger.warn('Automation workflow skipped', {
        workflow: 'interventionCompleted',
        reason: availability.reason,
      });
      return { disabled: true as const, reason: availability.reason } satisfies DisabledFeatureResponse;
    }

    return webhookUtils.triggerN8nWebhook('interventionCompleted', {
      event: 'intervention_completed',
      intervention: interventionData,
      actions_required: [
        'generate_invoice',
        'send_completion_sms',
        'schedule_feedback_call',
        'update_client_history'
      ]
    });
  },

  async triggerFeedbackWorkflow(feedbackData: WebhookFeedbackData) {
    const availability = getFeatureAvailability('automation');
    if (!availability.enabled) {
      logger.warn('Automation workflow skipped', {
        workflow: 'feedback',
        reason: availability.reason,
      });
      return { disabled: true as const, reason: availability.reason } satisfies DisabledFeatureResponse;
    }

    return webhookUtils.triggerN8nWebhook('feedback', {
      event: 'customer_feedback',
      feedback: feedbackData,
      actions_required: [
        'analyze_sentiment',
        'route_to_manager_if_negative',
        'update_client_satisfaction_score',
        'trigger_follow_up_if_needed'
      ]
    });
  }
};

// Support Service - Unified support interface
export const SupportService = {
  async submitFeedback(request: SupportFeedbackRequest) {
    // Log the support request
    const { data, error } = await apiClient.post('/functions/v1/support-feedback', {
      type: request.type,
      message: request.message,
      client_info: request.clientInfo,
      urgency: request.urgency || 'normal',
      metadata: {
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        page_url: window.location.href,
        ...request.metadata
      }
    });

    if (error) {
      throw new Error(`Erreur support: ${error}`);
    }

    // Trigger n8n workflow for feedback processing
    await N8nService.triggerFeedbackWorkflow({
      id: (data as { id?: string })?.id || 'unknown',
      rating: 0,
      comment: request.message,
      metadata: {
        type: request.type,
        clientInfo: request.clientInfo,
        urgency: request.urgency,
        ...request.metadata
      }
    });

    return data;
  },

  async initiateLiveSupport(clientInfo?: { name?: string; phone?: string; email?: string }) {
    const phone = clientInfo?.phone || '+14386012625'; // Default support number
    const clientName = clientInfo?.name || 'Client';

    return VapiService.initiateSupportCall(phone, clientName);
  },

  async requestCallback(phoneNumber: string, preferredTime?: string, message?: string) {
    return this.submitFeedback({
      type: 'call',
      message: `Demande de rappel${preferredTime ? ` à ${preferredTime}` : ''}${message ? `: ${message}` : ''}`,
      clientInfo: { phone: phoneNumber },
      urgency: 'normal',
      metadata: { 
        callback_request: true, 
        preferred_time: preferredTime 
      }
    });
  }
};

// Google Maps Service for geolocation
export const MapsService = {
  async geocodeAddress(address: string) {
    const availability = getFeatureAvailability('maps');
    if (!availability.enabled) {
      logger.warn('Geocoding skipped because Google Maps is disabled', {
        reason: availability.reason,
      });
      return { lat: null, lng: null, error: availability.reason };
    }

    const apiKey = availability.config.apiKey;

    try {
      const response = await fetch(
        `${API_CONFIG.maps?.baseUrl || 'https://maps.googleapis.com/maps/api'}/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results?.[0]) {
        const location = data.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng, error: null };
      }
      
      return { lat: null, lng: null, error: data.error_message || 'Adresse non trouvée' };
    } catch (error) {
      logger.error('Geocoding operation failed:', error);
      return { lat: null, lng: null, error: 'Erreur géocodage' };
    }
  },

  async getRouteDistance(origin: string, destination: string) {
    const availability = getFeatureAvailability('maps');
    if (!availability.enabled) {
      logger.warn('Route distance calculation skipped because Google Maps is disabled', {
        reason: availability.reason,
      });
      return { distance: null, duration: null, error: availability.reason };
    }

    const apiKey = availability.config.apiKey;

    try {
      const response = await fetch(
        `${API_CONFIG.maps?.baseUrl || 'https://maps.googleapis.com/maps/api'}/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.rows?.[0]?.elements?.[0]) {
        const element = data.rows[0].elements[0];
        if (element.status === 'OK') {
          return {
            distance: element.distance.text,
            duration: element.duration.text,
            error: null
          };
        }
      }
      
      return { distance: null, duration: null, error: 'Route non trouvée' };
    } catch (error) {
      logger.error('Route calculation failed:', error);
      return { distance: null, duration: null, error: 'Erreur calcul route' };
    }
  },

  generateMapUrl(address: string, zoom = 15) {
    const availability = getFeatureAvailability('maps');
    if (!availability.enabled) {
      logger.warn('Map URL generation skipped because Google Maps is disabled', {
        reason: availability.reason,
      });
      return '';
    }

    const apiKey = availability.config.apiKey;
    const encodedAddress = encodeURIComponent(address);
    return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodedAddress}&zoom=${zoom}`;
  }
};
