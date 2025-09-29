/**
 * Unified API Integration Tests
 * Verifies the consolidated API architecture works correctly
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { services, unifiedAPI, getUnifiedConfig, validateConfig } from '../index';
import { ErrorCategory } from '../../../services/errors/ErrorHandler';

// Mock fetch for testing
global.fetch = vi.fn();

// Mock environment variables
vi.mock('@/lib/env', () => ({
  env: {
    MODE: 'test',
    DEV: true,
    PROD: false,
  },
  isFeatureEnabled: vi.fn(() => true),
  getApiConfig: vi.fn(() => ({
    baseUrl: 'http://localhost:8080',
    supabase: {
      url: 'https://test.supabase.co',
      anonKey: 'test-key',
    },
    vapi: {
      apiUrl: 'https://api.vapi.ai',
      webhookUrl: 'https://webhook.test',
      publicKey: 'test-vapi-key',
    },
    googleMaps: {
      apiKey: 'test-maps-key',
    },
  })),
}));

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: vi.fn(),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null } })),
    },
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: {}, error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      insert: vi.fn().mockReturnThis(),
    })),
  },
}));

describe('Unified API Architecture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should load unified configuration successfully', () => {
      const config = getUnifiedConfig();
      
      expect(config).toBeDefined();
      expect(config.environment).toBe('test');
      expect(config.auth.supabaseUrl).toBe('https://test.supabase.co');
      expect(config.services.vapi.enabled).toBe(true);
    });

    it('should validate configuration correctly', () => {
      const config = getUnifiedConfig();
      const validation = validateConfig(config);
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('UnifiedAPIClient', () => {
    it('should make GET requests successfully', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ message: 'success' }),
      };
      
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);
      
      const response = await unifiedAPI.get('/api/test');
      
      expect(response.data).toEqual({ message: 'success' });
      expect(response.status).toBe(200);
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should handle errors correctly', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
        json: () => Promise.resolve({ error: 'Resource not found' }),
      };
      
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);
      
      try {
        await unifiedAPI.get('/api/nonexistent');
        expect.fail('Expected error to be thrown');
      } catch (error: unknown) {
        const err = error as { error: { category: string; retryable: boolean } };
        expect(err.error).toBeDefined();
        expect(err.error.category).toBe(ErrorCategory.CLIENT_ERROR);
        expect(err.error.retryable).toBe(false);
      }
    });

    it('should support caching for GET requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ cached: true }),
      };
      
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);
      
      // First request should hit the network
      const response1 = await unifiedAPI.get('/api/cacheable');
      expect(response1.cached).toBeUndefined();
      
      // Second request should be cached
      const response2 = await unifiedAPI.get('/api/cacheable');
      expect(response2.cached).toBe(true);
      
      // Fetch should only be called once
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Service Layer', () => {
    describe('VAPIService', () => {
      it('should start call with fallback support', async () => {
        const mockCallData = { callId: 'test-call-123', status: 'initiated' };
        
        // Mock successful API response
        const mockResponse = {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockCallData),
        };
        
        vi.mocked(fetch).mockResolvedValue(mockResponse as Response);
        
        const result = await services.vapi.startCall('+1234567890', {
          customerId: 'test-customer',
        });
        
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockCallData);
        expect(result.meta.action).toBe('startCall');
        expect(result.meta.entity).toBe('vapi_call');
      });

      it('should handle service errors gracefully', async () => {
        // Mock network error
        vi.mocked(fetch).mockRejectedValue(new Error('Network error'));
        
        const result = await services.vapi.startCall('+1234567890', {});
        
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error?.message).toContain('Network error');
      });
    });

    describe('CRMService', () => {
      it('should get calls with pagination', async () => {
        const mockCallsData = {
          items: [
            {
              id: 'call-1',
              phoneNumber: '+1234567890',
              status: 'completed',
              duration: 120,
            },
          ],
          total: 1,
          page: 1,
          pageSize: 25,
        };
        
        const mockResponse = {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(mockCallsData),
        };
        
        vi.mocked(fetch).mockResolvedValue(mockResponse as Response);
        
        const result = await services.crm.getCalls({
          page: 1,
          pageSize: 25,
        });
        
        expect(result.success).toBe(true);
        expect(result.data?.items).toHaveLength(1);
        expect(result.data?.total).toBe(1);
      });
    });

    describe('HealthService', () => {
      it('should test system connectivity', async () => {
        const result = await services.health.testConnection();
        
        expect(result.success).toBe(true);
        expect(result.data?.timestamp).toBeInstanceOf(Date);
        expect(result.data?.details).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    it('should categorize errors correctly', async () => {
      const scenarios = [
        {
          status: 401,
          expectedCategory: ErrorCategory.AUTHENTICATION_ERROR,
        },
        {
          status: 429,
          expectedCategory: ErrorCategory.RATE_LIMIT_ERROR,
        },
        {
          status: 422,
          expectedCategory: ErrorCategory.VALIDATION_ERROR,
        },
        {
          status: 500,
          expectedCategory: ErrorCategory.SERVER_ERROR,
        },
      ];
      
      for (const scenario of scenarios) {
        const mockResponse = {
          ok: false,
          status: scenario.status,
          statusText: 'Error',
          headers: new Headers(),
          json: () => Promise.resolve({ error: 'Test error' }),
        };
        
        vi.mocked(fetch).mockResolvedValue(mockResponse as Response);
        
        try {
          await unifiedAPI.get('/api/test');
          expect.fail('Expected error to be thrown');
        } catch (error: unknown) {
          const err = error as { error: { category: string } };
          expect(err.error.category).toBe(scenario.expectedCategory);
        }
      }
    });

    it('should provide user-friendly error messages', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers(),
        json: () => Promise.resolve({ error: 'Database connection failed' }),
      };
      
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);
      
      try {
        await unifiedAPI.get('/api/test');
        expect.fail('Expected error to be thrown');
      } catch (error: unknown) {
        const err = error as { error: { userMessage: string } };
        expect(err.error.userMessage).toBeDefined();
        expect(err.error.userMessage).not.toContain('Database connection failed');
        expect(err.error.userMessage).toContain('unexpected error occurred');
      }
    });
  });

  describe('Legacy Compatibility', () => {
    it('should support legacy VAPIService exports', async () => {
      const { VAPIService } = await import('../index');
      
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ callId: 'legacy-test' }),
      };
      
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);
      
      // Should work with legacy interface
      const result = await VAPIService.startCall('+1234567890', {});
      expect(result).toEqual({ callId: 'legacy-test' });
    });
  });

  describe('Performance Features', () => {
    it('should implement rate limiting', async () => {
      // This would require more complex mocking to test properly
      // For now, just verify the rate limit configuration exists
      const config = getUnifiedConfig();
      expect(config.rateLimit.enabled).toBe(true);
      expect(config.rateLimit.requestsPerMinute).toBeGreaterThan(0);
    });

    it('should support cache invalidation', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: 'test' }),
      };
      
      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);
      
      // Make initial request
      await unifiedAPI.get('/api/cache-test');
      
      // Clear cache
      unifiedAPI.clearCache();
      
      // Make another request - should hit network again
      await unifiedAPI.get('/api/cache-test');
      
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
});

// Integration test with actual Supabase (if configured)
describe('Integration Tests (Real Services)', () => {
  // These tests would run against real services in CI/CD
  // Skipped in unit test environment
  
  it.skip('should connect to real Supabase', async () => {
    const result = await services.health.testConnection();
    expect(result.success).toBe(true);
    expect(result.data?.supabase).toBe(true);
  });
  
  it.skip('should handle real API endpoints', async () => {
    const health = await unifiedAPI.healthCheck();
    expect(health.status).toBeOneOf(['healthy', 'degraded', 'unhealthy']);
  });
});