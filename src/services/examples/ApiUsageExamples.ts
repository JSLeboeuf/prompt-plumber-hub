/**
 * API Usage Examples - Demonstrates how to use the secure API layer
 * This file provides practical examples for developers integrating with the API layer
 */

import { ApiServiceManager } from '../ApiServiceManager';
import { logger } from '@/lib/logger';

// Example: Initializing the API Service Manager
export async function initializeApiServices() {
  const apiManager = ApiServiceManager.getInstance();

  await apiManager.initialize({
    environment: 'development',
    gateway: {
      timeout: 30000,
      retries: 3,
      rateLimiting: {
        enabled: true,
        windowMs: 60000,
        maxRequests: 1000 // Higher limit for development
      }
    },
    security: {
      cors: {
        allowedOrigins: ['http://localhost:3000', 'http://localhost:5173'],
        credentials: true
      },
      rateLimiting: {
        enabled: false // Disable in development
      }
    },
    services: {
      supabase: { enabled: true },
      vapi: {
        enabled: true,
        baseUrl: 'https://api.vapi.ai',
        apiKey: process.env.VAPI_API_KEY || '',
        assistantId: process.env.VAPI_ASSISTANT_ID || ''
      },
      twilio: {
        enabled: true,
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || ''
      },
      googleMaps: {
        enabled: true,
        apiKey: process.env.GOOGLE_MAPS_API_KEY || ''
      },
      n8n: {
        enabled: true,
        webhookBaseUrl: process.env.N8N_WEBHOOK_BASE_URL || ''
      }
    },
    monitoring: {
      enabled: true,
      healthCheckInterval: 30000
    }
  });

  logger.info('API Services initialized successfully!');
  return apiManager.getApiClient();
}

// Example: Making Supabase operations
export async function supabaseExamples() {
  const api = ApiServiceManager.getInstance().getApiClient();

  try {
    // Fetch data with filters
    const callsResponse = await api.supabase.fetchData('vapi_calls', {
      status: 'completed',
      limit: 10
    });

    if (callsResponse.success) {
      logger.info('Recent calls loaded', { count: callsResponse.data?.length });
    } else {
      logger.error('Failed to fetch calls', { error: callsResponse.error });
    }

    // Insert new data
    const newCall = {
      call_id: 'call_123',
      customer_phone: '+1234567890',
      status: 'active',
      priority: 'P2',
      started_at: new Date().toISOString()
    };

    const insertResponse = await api.supabase.insertData('vapi_calls', newCall);

    if (insertResponse.success) {
      logger.info('Call created successfully', { callId: insertResponse.data?.call_id });

      // Update the call
      const updateResponse = await api.supabase.updateData(
        'vapi_calls',
        insertResponse.data.id,
        { status: 'completed', ended_at: new Date().toISOString() }
      );

      if (updateResponse.success) {
        logger.info('Call updated successfully', { callId: updateResponse.data?.call_id });
      }
    }

  } catch (error) {
    logger.error('Supabase operation failed', { error });
  }
}

// Example: Making VAPI calls
export async function vapiExamples() {
  const api = ApiServiceManager.getInstance().getApiClient();

  try {
    // Emergency call
    const emergencyCallResponse = await api.vapi.makeCall({
      phoneNumber: '+1234567890',
      assistantId: 'emergency-assistant-id',
      context: {
        client_name: 'John Doe',
        urgency: 'high',
        call_type: 'emergency',
        auto_greeting: 'Bonjour John, vous avez contacté Drain Fortin pour une urgence plomberie.'
      }
    });

    if (emergencyCallResponse.success) {
      logger.info('Emergency call initiated', { callId: emergencyCallResponse.data?.id });
    } else {
      logger.error('Emergency call failed', { error: emergencyCallResponse.error });
    }

    // Follow-up call
    const followUpResponse = await api.vapi.makeCall({
      phoneNumber: '+1234567890',
      context: {
        client_name: 'John Doe',
        call_type: 'follow_up',
        intervention_id: 'intervention_123',
        auto_greeting: 'Bonjour John, nous vous contactons pour un suivi de votre intervention.'
      }
    });

    if (followUpResponse.success) {
      logger.info('Follow-up call initiated', { callId: followUpResponse.data?.id });
    }

  } catch (error) {
    logger.error('VAPI operation failed', { error });
  }
}

// Example: Sending SMS with Twilio
export async function twilioExamples() {
  const api = ApiServiceManager.getInstance().getApiClient();

  try {
    // Emergency confirmation SMS
    const emergencySmsResponse = await api.twilio.sendSms({
      to: '+1234567890',
      message: 'Bonjour John, votre demande d\'urgence Drain Fortin a été prise en compte. Technicien en route, arrivée prévue: 30 minutes. Urgence? Appelez: +1 438-601-2625',
      priority: 'high'
    });

    if (emergencySmsResponse.success) {
      logger.info('Emergency SMS sent', { messageId: emergencySmsResponse.data?.id });
    } else {
      logger.error('Emergency SMS failed', { error: emergencySmsResponse.error });
    }

    // Appointment reminder SMS
    const reminderResponse = await api.twilio.sendSms({
      to: '+1234567890',
      message: 'Rappel RDV Drain Fortin - John, intervention prévue demain à 14h. Pour modifier: +1 438-601-2625',
      priority: 'normal'
    });

    if (reminderResponse.success) {
      logger.info('Reminder SMS sent', { messageId: reminderResponse.data?.id });
    }

  } catch (error) {
    logger.error('Twilio operation failed', { error });
  }
}

// Example: Google Maps operations
export async function googleMapsExamples() {
  const api = ApiServiceManager.getInstance().getApiClient();

  try {
    // Geocode an address
    const geocodeResponse = await api.googleMaps.geocode('1234 Main St, Montreal, QC');

    if (geocodeResponse.success) {
      logger.info('Geocoding completed', { address: geocodeResponse.data?.formatted_address });
    } else {
      logger.error('Geocoding failed', { error: geocodeResponse.error });
    }

    // Calculate distance
    const distanceResponse = await api.googleMaps.distanceMatrix(
      'Montreal, QC',
      '1234 Main St, Montreal, QC'
    );

    if (distanceResponse.success) {
      logger.info('Distance calculation completed', { distance: distanceResponse.data?.distance });
    }

  } catch (error) {
    logger.error('Google Maps operation failed', { error });
  }
}

// Example: n8n workflow triggers
export async function n8nExamples() {
  const api = ApiServiceManager.getInstance().getApiClient();

  try {
    // Trigger new client workflow
    const newClientResponse = await api.n8n.triggerWorkflow('newClient', {
      client: {
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john@example.com',
        address: '1234 Main St, Montreal, QC'
      },
      actions_required: [
        'send_welcome_email',
        'create_crm_record',
        'schedule_follow_up'
      ]
    });

    if (newClientResponse.success) {
      logger.info('New client workflow triggered', { workflowId: newClientResponse.data?.id });
    }

    // Trigger emergency workflow
    const emergencyResponse = await api.n8n.triggerWorkflow('emergencyCall', {
      call: {
        client_name: 'John Doe',
        phone: '+1234567890',
        urgency: 'high',
        problem: 'Burst pipe in basement'
      },
      actions_required: [
        'notify_on_duty_technician',
        'send_sms_confirmation',
        'create_intervention_record',
        'alert_supervisor_if_P1'
      ]
    });

    if (emergencyResponse.success) {
      logger.info('Emergency workflow triggered', { workflowId: emergencyResponse.data?.id });
    }

  } catch (error) {
    logger.error('n8n workflow failed', { error });
  }
}

// Example: Batch operations
export async function batchOperationsExample() {
  const api = ApiServiceManager.getInstance().getApiClient();

  try {
    const operations = [
      {
        service: 'supabase',
        operation: 'fetchData',
        params: { table: 'vapi_calls', filters: { status: 'active' } },
        context: {
          correlationId: crypto.randomUUID(),
          source: 'batch_example',
          operation: 'fetch_active_calls'
        }
      },
      {
        service: 'twilio',
        operation: 'sendSms',
        params: {
          to: '+1234567890',
          message: 'System maintenance in 30 minutes',
          priority: 'normal'
        },
        context: {
          correlationId: crypto.randomUUID(),
          source: 'batch_example',
          operation: 'maintenance_notification'
        }
      },
      {
        service: 'n8n',
        operation: 'systemMaintenance',
        params: {
          type: 'scheduled',
          duration: '30 minutes',
          services: ['api', 'database']
        },
        context: {
          correlationId: crypto.randomUUID(),
          source: 'batch_example',
          operation: 'trigger_maintenance_workflow'
        }
      }
    ];

    const batchResults = await api.batch(operations);

    logger.info('Batch operations completed', { totalOperations: batchResults.length });
    batchResults.forEach((result, index) => {
      if (result.success) {
        logger.info(`Batch operation ${index + 1} completed`, {
          duration: result.metadata.duration,
          service: result.metadata.service
        });
      } else {
        logger.error(`Batch operation ${index + 1} failed`, { error: result.error });
      }
    });

  } catch (error) {
    logger.error('Batch operations failed', { error });
  }
}

// Example: Error handling and retry patterns
export async function errorHandlingExample() {
  const api = ApiServiceManager.getInstance().getApiClient();

  try {
    // This will demonstrate automatic retry on network errors
    const response = await api.vapi.makeCall({
      phoneNumber: '+1234567890' // This might fail due to network issues
    });

    if (response.success) {
      logger.info('Call successful', { callId: response.data?.id });
    } else {
      logger.error('Call failed after retries', {
        category: response.error?.category,
        code: response.error?.code,
        message: response.error?.message,
        retryable: response.error?.retryable
      });

      // Handle different error categories
      switch (response.error?.category) {
        case 'RATE_LIMIT_ERROR':
          logger.warn('Rate limited - backing off');
          break;
        case 'AUTHENTICATION_ERROR':
          logger.error('Auth error - check credentials');
          break;
        case 'NETWORK_ERROR':
          logger.warn('Network error - will retry automatically');
          break;
        default:
          logger.warn('Other error type');
      }
    }

  } catch (error) {
    logger.error('Unexpected error', { error });
  }
}

// Example: Health monitoring
export async function healthMonitoringExample() {
  const apiManager = ApiServiceManager.getInstance();

  try {
    const health = await apiManager.getHealthStatus();

    logger.info('System Health Status', {
      overall: health.status,
      timestamp: health.timestamp,
      services: Object.keys(health.services)
    });

    // Check specific service health
    if (health.services.gateway.status === 'unhealthy') {
      logger.warn('Gateway is unhealthy - API requests may fail');
    }

    if (health.services.orchestrator.vapi?.status === 'unhealthy') {
      logger.warn('VAPI service is down - voice calls unavailable');
    }

  } catch (error) {
    logger.error('Health check failed', { error });
  }
}

// Example: Using with React hooks (for frontend integration)
export function useApiService() {
  const apiManager = ApiServiceManager.getInstance();

  return {
    // Calls service
    calls: {
      getRecentCalls: async (limit = 50) => {
        return await apiManager.getApiClient().supabase.fetchData('vapi_calls', {
          limit,
          order: 'started_at.desc'
        });
      },

      makeEmergencyCall: async (phoneNumber: string, clientName: string) => {
        return await apiManager.getApiClient().vapi.makeCall({
          phoneNumber,
          context: {
            client_name: clientName,
            urgency: 'high',
            call_type: 'emergency'
          }
        });
      }
    },

    // SMS service
    sms: {
      sendEmergencyConfirmation: async (phoneNumber: string, clientName: string, eta: string) => {
        return await apiManager.getApiClient().twilio.sendSms({
          to: phoneNumber,
          message: `Bonjour ${clientName}, votre demande d'urgence a été prise en compte. Arrivée prévue: ${eta}`,
          priority: 'high'
        });
      }
    },

    // Maps service
    maps: {
      calculateDistance: async (origin: string, destination: string) => {
        return await apiManager.getApiClient().googleMaps.distanceMatrix(origin, destination);
      }
    },

    // Health check
    health: {
      getStatus: async () => {
        return await apiManager.getHealthStatus();
      }
    }
  };
}

// Example: Complete workflow - Emergency call handling
export async function completeEmergencyWorkflow() {
  const api = ApiServiceManager.getInstance().getApiClient();

  const clientData = {
    name: 'John Doe',
    phone: '+1234567890',
    address: '1234 Main St, Montreal, QC',
    problem: 'Burst pipe in basement'
  };

  try {
    logger.info('Starting emergency workflow', { clientName: clientData.name });

    // Step 1: Create call record
    const callRecord = await api.supabase.insertData('vapi_calls', {
      call_id: `emergency_${Date.now()}`,
      customer_phone: clientData.phone,
      customer_name: clientData.name,
      address: clientData.address,
      problem_description: clientData.problem,
      status: 'active',
      priority: 'P1',
      started_at: new Date().toISOString()
    });

    if (!callRecord.success) {
      throw new Error('Failed to create call record');
    }

    logger.info('Call record created', { callId: callRecord.data.id });

    // Step 2: Calculate distance/ETA
    const distanceResult = await api.googleMaps.distanceMatrix(
      'Drain Fortin Office, Montreal, QC',
      clientData.address
    );

    const eta = distanceResult.success ?
      distanceResult.data.duration?.text || '30 minutes' :
      '30 minutes';

    // Step 3: Send SMS confirmation
    const smsResult = await api.twilio.sendSms({
      to: clientData.phone,
      message: `Bonjour ${clientData.name}, votre urgence plomberie a été prise en compte. Technicien en route, arrivée: ${eta}. Urgence? +1 438-601-2625`,
      priority: 'high'
    });

    if (smsResult.success) {
      logger.info('SMS confirmation sent');
    }

    // Step 4: Trigger n8n workflow for technician dispatch
    const workflowResult = await api.n8n.triggerWorkflow('emergencyDispatch', {
      call_id: callRecord.data.id,
      client: clientData,
      priority: 'P1',
      eta: eta,
      actions: [
        'notify_on_duty_technician',
        'create_intervention_record',
        'alert_supervisor',
        'update_dispatch_board'
      ]
    });

    if (workflowResult.success) {
      logger.info('Emergency workflow triggered successfully');
    }

    // Step 5: Make VAPI call if needed
    const callResult = await api.vapi.makeCall({
      phoneNumber: clientData.phone,
      context: {
        client_name: clientData.name,
        urgency: 'high',
        call_type: 'emergency_followup',
        auto_greeting: `Bonjour ${clientData.name}, nous avons bien reçu votre demande d'urgence. Un technicien sera chez vous dans ${eta}.`
      }
    });

    if (callResult.success) {
      logger.info('Follow-up call initiated');
    }

    logger.info('Emergency workflow completed successfully!');

    return {
      success: true,
      callId: callRecord.data.id,
      eta: eta,
      notifications: {
        sms: smsResult.success,
        workflow: workflowResult.success,
        call: callResult.success
      }
    };

  } catch (error) {
    logger.error('Emergency workflow failed', { error: error instanceof Error ? error.message : String(error) });

    // Emergency fallback - at least try to send SMS
    try {
      await api.twilio.sendSms({
        to: clientData.phone,
        message: `Urgence reçue pour ${clientData.name}. Nous vous contactons immédiatement. Urgence? +1 438-601-2625`,
        priority: 'high'
      });
    } catch (fallbackError) {
      logger.error('Even fallback SMS failed', { error: fallbackError });
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Export all examples for easy testing
export const apiExamples = {
  initialize: initializeApiServices,
  supabase: supabaseExamples,
  vapi: vapiExamples,
  twilio: twilioExamples,
  googleMaps: googleMapsExamples,
  n8n: n8nExamples,
  batch: batchOperationsExample,
  errorHandling: errorHandlingExample,
  health: healthMonitoringExample,
  emergencyWorkflow: completeEmergencyWorkflow
};