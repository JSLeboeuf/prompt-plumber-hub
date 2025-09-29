import { apiConfig } from '@/config/api.secure';
import { logger } from '@/lib/logger';
import {
  GeocodeAddressSchema,
  OptimizeRouteSchema,
  VAPICallSchema,
  OpenAICompletionSchema,
  createValidatedFunction,
} from './validation/schemas';

/**
 * Secure API Service
 * All external API calls with input validation and sanitization
 */

// ============================================
// Google Maps Service (Validated)
// ============================================

export class SecureMapsService {
  /**
   * Geocode address with input validation
   */
  static geocodeAddress = createValidatedFunction(
    GeocodeAddressSchema,
    async (input) => {
      try {
        const params = new URLSearchParams({
          address: input.address,
          key: apiConfig.googleMaps.apiKey || '',
        });

        if (input.country) {
          params.append('components', `country:${input.country}`);
        }

        if (input.bounds) {
          const boundsStr = `${input.bounds.southwest.lat},${input.bounds.southwest.lng}|${input.bounds.northeast.lat},${input.bounds.northeast.lng}`;
          params.append('bounds', boundsStr);
        }

        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?${params}`,
          {
            headers: apiConfig.headers,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          logger.error('Geocoding API error', { status: response.status, data });
          throw new Error('Geocoding service unavailable');
        }

        if (data.status === 'OK' && data.results?.length > 0) {
          const location = data.results[0].geometry.location;
          return {
            lat: location.lat,
            lng: location.lng,
            formatted_address: data.results[0].formatted_address,
            placeId: data.results[0].place_id,
          };
        }

        throw new Error('Address not found');
      } catch (error) {
        logger.error('Geocoding error', { error, input });
        throw new Error('Failed to geocode address');
      }
    }
  );

  /**
   * Optimize route with validated waypoints
   */
  static optimizeRoute = createValidatedFunction(
    OptimizeRouteSchema,
    async (input) => {
      try {
        if (input.waypoints.length < 2) {
          throw new Error('At least 2 waypoints required');
        }

        const origin = input.waypoints[0];
        const destination = input.waypoints[input.waypoints.length - 1];
        const intermediateWaypoints = input.waypoints.slice(1, -1);

        const params = new URLSearchParams({
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`,
          mode: input.travelMode.toLowerCase(),
          key: apiConfig.googleMaps.apiKey || '',
        });

        if (intermediateWaypoints.length > 0) {
          const waypointsStr = intermediateWaypoints
            .map(wp => `${wp.lat},${wp.lng}`)
            .join('|');
          params.append('waypoints', `optimize:true|${waypointsStr}`);
        }

        if (input.avoidHighways) params.append('avoid', 'highways');
        if (input.avoidTolls) params.append('avoid', 'tolls');

        const response = await fetch(
          `https://maps.googleapis.com/maps/api/directions/json?${params}`,
          {
            headers: apiConfig.headers,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          logger.error('Route optimization API error', { status: response.status, data });
          throw new Error('Route optimization service unavailable');
        }

        return data;
      } catch (error) {
        logger.error('Route optimization error', { error, input });
        throw new Error('Failed to optimize route');
      }
    }
  );
}

// ============================================
// VAPI Service (Validated)
// ============================================

export class SecureVAPIService {
  /**
   * Make outbound call with validation
   */
  static makeCall = createValidatedFunction(
    VAPICallSchema,
    async (input) => {
      if (!apiConfig.vapi.enabled) {
        throw new Error('VAPI service not configured');
      }

      try {
        // Note: Private key should be used server-side only
        // This should ideally be proxied through your backend
        const response = await fetch(`${apiConfig.vapi.apiUrl}/calls`, {
          method: 'POST',
          headers: {
            ...apiConfig.headers,
            'Authorization': `Bearer VAPI_PRIVATE_KEY`, // Should be from secure backend
          },
          body: JSON.stringify({
            phoneNumber: input.phoneNumber,
            assistantId: input.assistantId,
            metadata: input.metadata,
            voicemailDetection: input.voicemailDetection,
            maxDuration: input.maxDuration,
          }),
        });

        if (!response.ok) {
          logger.error('VAPI call error', { status: response.status });
          throw new Error('Failed to initiate call');
        }

        return await response.json();
      } catch (error) {
        logger.error('VAPI service error', { error, phoneNumber: input.phoneNumber });
        throw new Error('Call service unavailable');
      }
    }
  );
}

// ============================================
// OpenAI Service (Validated)
// ============================================

export class SecureOpenAIService {
  /**
   * Get completion with validated input
   */
  static getCompletion = createValidatedFunction(
    OpenAICompletionSchema,
    async (input) => {
      if (!apiConfig.openai.enabled) {
        throw new Error('OpenAI service not configured');
      }

      try {
        // Note: API key should be used server-side only
        // This should ideally be proxied through your backend
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            ...apiConfig.headers,
            'Authorization': `Bearer OPENAI_API_KEY`, // Should be from secure backend
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: input.messages,
            temperature: input.temperature,
            max_tokens: input.maxTokens,
            top_p: input.topP,
            frequency_penalty: input.frequencyPenalty,
            presence_penalty: input.presencePenalty,
          }),
        });

        if (!response.ok) {
          logger.error('OpenAI API error', { status: response.status });
          throw new Error('AI service unavailable');
        }

        return await response.json();
      } catch (error) {
        logger.error('OpenAI service error', { error });
        throw new Error('AI service unavailable');
      }
    }
  );
}

// ============================================
// Secure API Client Factory
// ============================================

export class SecureAPIClient {
  private static instance: SecureAPIClient;
  private requestCount = 0;
  private lastReset = Date.now();
  private readonly maxRequestsPerMinute = 100;

  private constructor() {}

  static getInstance(): SecureAPIClient {
    if (!SecureAPIClient.instance) {
      SecureAPIClient.instance = new SecureAPIClient();
    }
    return SecureAPIClient.instance;
  }

  /**
   * Rate limiting check
   */
  private checkRateLimit(): void {
    const now = Date.now();
    const timeSinceReset = now - this.lastReset;

    if (timeSinceReset > 60000) {
      this.requestCount = 0;
      this.lastReset = now;
    }

    if (this.requestCount >= this.maxRequestsPerMinute) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    this.requestCount++;
  }

  /**
   * Make secure API request with validation
   */
  async request<T>(
    url: string,
    options: RequestInit & { validateResponse?: (data: unknown) => boolean }
  ): Promise<T> {
    this.checkRateLimit();

    // Add security headers
    const secureOptions: RequestInit = {
      ...options,
      headers: {
        ...apiConfig.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, secureOptions);

      if (!response.ok) {
        logger.error('API request failed', {
          url,
          status: response.status,
          statusText: response.statusText,
        });
        throw new Error(`Request failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Optional response validation
      if (options.validateResponse && !options.validateResponse(data)) {
        logger.error('Response validation failed', { url, data });
        throw new Error('Invalid response format');
      }

      return data as T;
    } catch (error) {
      logger.error('API request error', { url, error });
      throw error;
    }
  }
}

// ============================================
// Export Validated Services
// ============================================

export const secureAPI = {
  maps: SecureMapsService,
  vapi: SecureVAPIService,
  openai: SecureOpenAIService,
  client: SecureAPIClient.getInstance(),
};

// Type exports for better TypeScript support
export type GeocodeResult = {
  lat: number;
  lng: number;
  formatted_address: string;
  placeId: string;
};

export type RouteOptimizationResult = {
  routes: Array<{
    summary: string;
    legs: Array<{
      distance: { text: string; value: number };
      duration: { text: string; value: number };
    }>;
  }>;
  status: string;
};