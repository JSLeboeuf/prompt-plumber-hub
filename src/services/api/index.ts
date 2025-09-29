/**
 * Unified API Services Export
 * Single entry point for all API operations
 *
 * MIGRATION GUIDE:
 * Old: import { VAPIService } from '@/services/api'
 * New: import { services } from '@/services/api'
 *      services.vapi.startCall(phoneNumber, context)
 *
 * Old: import { api } from '@/services/legacyApi'
 * New: import { services } from '@/services/api'
 *      services.crm.getCalls()
 *
 * Benefits:
 * - Unified error handling and retry logic
 * - Consistent caching and performance optimization
 * - Type-safe requests with validation
 * - Circuit breaker protection for external services
 * - Automatic fallback to Supabase for reliability
 */

// Core unified API client
export {
  UnifiedAPIClient,
  unifiedAPI,
  type APIRequest,
  type APIResponse,
  type APIErrorResponse,
  type UnifiedAPIConfig as APIClientConfig
} from './UnifiedAPIClient';

// Unified service layer
export {
  services,
  vapiService,
  smsService,
  automationService,
  mapsService,
  crmService,
  analyticsService,
  settingsService,
  healthService,
  type ServiceConfig,
  type ServiceResult,
  type PaginatedResult,
  type QueryOptions
} from './ServiceLayer';

// Configuration
export {
  unifiedConfig,
  getUnifiedConfig,
  isServiceEnabled,
  getServiceConfig,
  validateConfig,
  getHealthCheckEndpoints,
  type UnifiedAPIConfig
} from '@/config/unified.api.config';

// Error handling
export {
  ErrorHandler,
  ErrorCategory,
  ErrorSeverity,
  type StandardError,
  type RetryConfig,
  type ErrorHandlerConfig
} from '@/services/errors/ErrorHandler';

// Legacy compatibility exports (deprecated - use services object instead)
// These will be removed in a future version
import {
  vapiService,
  smsService,
  automationService,
  mapsService
} from './ServiceLayer';

/**
 * @deprecated Use services.vapi instead
 */
export const VAPIService = {
  startCall: (phoneNumber: string, context: Record<string, unknown>) =>
    vapiService.startCall(phoneNumber, context).then(result => {
      if (!result.success) throw result.error;
      return result.data;
    }),
  getCallTranscript: (callId: string) =>
    vapiService.getCallTranscript(callId).then(result => {
      if (!result.success) throw result.error;
      return result.data;
    })
};

/**
 * @deprecated Use services.sms instead
 */
export const SMSService = {
  sendSMS: (to: string, message: string, priority?: 'normal' | 'urgent') =>
    smsService.sendSMS(to, message, priority).then(result => {
      if (!result.success) throw result.error;
      return result.data;
    }),
  sendBulkSMS: (recipients: string[], message: string) =>
    smsService.sendBulkSMS(recipients, message).then(result => {
      if (!result.success) throw result.error;
      return result.data;
    })
};

/**
 * @deprecated Use services.automation instead
 */
export const AutomationService = {
  triggerWorkflow: (workflowName: string, data: Record<string, unknown>) =>
    automationService.triggerWorkflow(workflowName, data).then(result => {
      if (!result.success) throw result.error;
      return result.data;
    }),
  sendFeedback: (feedback: Record<string, unknown>) =>
    automationService.sendFeedback(feedback).then(result => {
      if (!result.success) throw result.error;
      return result.data;
    })
};

/**
 * @deprecated Use services.maps instead
 */
export const MapsService = {
  geocodeAddress: (address: string) =>
    mapsService.geocodeAddress(address).then(result => {
      if (!result.success) throw result.error;
      return result.data;
    }),
  optimizeRoute: (waypoints: Array<{ lat: number; lng: number }>) =>
    mapsService.optimizeRoute(waypoints).then(result => {
      if (!result.success) throw result.error;
      return result.data;
    })
};

/**
 * @deprecated Use services.health.testConnection() instead
 */
export const api = {
  testConnection: () =>
    healthService.testConnection().then(result => {
      if (!result.success) throw result.error;
      return result.data;
    })
};

// Re-export commonly used types
export type {
  CallData,
  LeadData,
  AnalyticsData,
  SettingsData,
  ConnectionTestResult
} from '@/types/api';

export type {
  CallContext,
  WebhookClientData,
  WebhookCallData,
  WebhookInterventionData,
  WebhookFeedbackData
} from '@/types/api.types';

/**
 * Default export - main services object
 *
 * Usage:
 * import api from '@/services/api';
 *
 * const calls = await api.crm.getCalls();
 * const result = await api.vapi.startCall(phoneNumber, context);
 */
export default services;