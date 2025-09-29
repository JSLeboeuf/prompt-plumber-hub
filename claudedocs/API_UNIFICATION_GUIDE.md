# API Service Architecture Unification

## Overview

This document outlines the unified API service architecture that consolidates three different API patterns into a single, maintainable system.

## Previous Architecture Issues

### 1. Multiple API Patterns
- **api.ts**: Service-based classes with Supabase integration
- **api.secure.ts**: Validated secure services with input sanitization
- **legacyApi.ts**: Hybrid approach with backend fallback to Supabase

### 2. Inconsistent Error Handling
- Different error formats across services
- No standardized retry logic
- Inconsistent logging patterns

### 3. Configuration Fragmentation
- Multiple configuration files with overlapping concerns
- No centralized service configuration
- Manual feature flag management

### 4. No Service Abstractions
- Direct HTTP client usage in components
- No caching layer
- No circuit breaker protection

## New Unified Architecture

### Core Components

#### 1. UnifiedAPIClient (`src/services/api/UnifiedAPIClient.ts`)
```typescript
// Single HTTP client with all advanced features
const response = await unifiedAPI.get('/api/users', {
  validateOutput: (data) => Array.isArray(data),
  useCircuitBreaker: true,
  retries: 3
});
```

**Features:**
- Type-safe requests with validation
- Automatic authentication handling
- Circuit breaker pattern for external services
- Request/response interceptors
- Rate limiting and caching
- Comprehensive error handling

#### 2. Service Layer (`src/services/api/ServiceLayer.ts`)
```typescript
// Domain-specific services with consistent patterns
const result = await services.vapi.startCall(phoneNumber, context);
if (!result.success) {
  // Standardized error handling
  console.error(result.error);
}
```

**Services:**
- **VAPIService**: Voice AI integration
- **SMSService**: Messaging with Twilio
- **AutomationService**: n8n workflow triggers
- **MapsService**: Google Maps integration
- **CRMService**: Customer data management
- **AnalyticsService**: Metrics and reporting
- **SettingsService**: Configuration management
- **HealthService**: System health checks

#### 3. Unified Configuration (`src/config/unified.api.config.ts`)
```typescript
// Single source of truth for all API configuration
const config = getUnifiedConfig();
if (isServiceEnabled('vapi')) {
  // Service is properly configured and enabled
}
```

**Features:**
- Environment-based configuration with validation
- Feature flags for conditional service enabling
- Security-first design with proper secret handling
- Runtime validation and health checks

### Architecture Benefits

#### 1. Consistency
- Standardized service contracts across all APIs
- Unified error handling and retry logic
- Consistent caching and performance optimization

#### 2. Reliability
- Circuit breaker protection for external services
- Automatic fallback to Supabase for critical operations
- Comprehensive error categorization and handling

#### 3. Performance
- Intelligent caching with configurable TTL
- Request deduplication and batching
- Rate limiting to prevent service overload

#### 4. Security
- Input validation and sanitization
- Output validation against injection attacks
- Secure header management
- CSRF protection

#### 5. Maintainability
- Single entry point for all API operations
- Type-safe interfaces with comprehensive documentation
- Centralized configuration management
- Backward compatibility with legacy code

## Migration Guide

### From api.ts Services

**Before:**
```typescript
import { VAPIService, SMSService } from '@/services/api';

try {
  const result = await VAPIService.startCall(phoneNumber, context);
} catch (error) {
  console.error('Call failed:', error);
}
```

**After:**
```typescript
import { services } from '@/services/api';

const result = await services.vapi.startCall(phoneNumber, context);
if (!result.success) {
  console.error('Call failed:', result.error.userMessage);
} else {
  console.log('Call started:', result.data);
}
```

### From legacyApi.ts

**Before:**
```typescript
import { api } from '@/services/legacyApi';

const calls = await api.getCalls();
const leads = await api.getLeads();
```

**After:**
```typescript
import { services } from '@/services/api';

const callsResult = await services.crm.getCalls({ page: 1, pageSize: 25 });
if (callsResult.success) {
  const calls = callsResult.data.items;
}

const leadsResult = await services.crm.getLeads();
if (leadsResult.success) {
  const leads = leadsResult.data.items;
}
```

### From api.secure.ts

**Before:**
```typescript
import { SecureMapsService } from '@/services/api.secure';

const location = await SecureMapsService.geocodeAddress({
  address: '123 Main St',
  country: 'US'
});
```

**After:**
```typescript
import { services } from '@/services/api';

const result = await services.maps.geocodeAddress('123 Main St');
if (result.success) {
  const location = result.data;
}
```

## Service Configuration

### Environment Variables

```bash
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Optional - services are auto-disabled if keys are missing
VITE_VAPI_PUBLIC_KEY=your_vapi_key
VITE_VAPI_ASSISTANT_ID=your_assistant_id
VITE_GOOGLE_MAPS_API_KEY=your_maps_key
VITE_TWILIO_ACCOUNT_SID=your_twilio_sid
VITE_N8N_BASE_URL=https://your-n8n-instance.com

# Feature flags (default: true)
VITE_ENABLE_VAPI=true
VITE_ENABLE_MAPS=true
VITE_ENABLE_SMS=true
VITE_ENABLE_AUTOMATION=true
VITE_ENABLE_ANALYTICS=true
```

### Runtime Configuration

```typescript
import { unifiedAPI, getUnifiedConfig } from '@/services/api';

// Update client configuration
unifiedAPI.updateConfig({
  timeout: 60000,
  maxRetries: 5,
  enableCaching: true
});

// Check service status
const health = await unifiedAPI.healthCheck();
console.log('System status:', health.status);

// Validate configuration
const config = getUnifiedConfig();
const validation = validateConfig(config);
if (!validation.valid) {
  console.error('Configuration errors:', validation.errors);
}
```

## Error Handling

### Standardized Error Format

```typescript
interface StandardError {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  code: string;
  message: string;
  userMessage: string;
  timestamp: string;
  source: string;
  retryable: boolean;
  details?: Record<string, unknown>;
}
```

### Error Categories

- **CLIENT_ERROR**: 4xx client-side issues
- **SERVER_ERROR**: 5xx server-side issues
- **NETWORK_ERROR**: Connectivity problems
- **TIMEOUT_ERROR**: Request timeouts
- **VALIDATION_ERROR**: Data validation failures
- **AUTHENTICATION_ERROR**: Auth/authz failures
- **RATE_LIMIT_ERROR**: Rate limiting
- **EXTERNAL_SERVICE_ERROR**: External service failures

### Usage Example

```typescript
import { services, ErrorCategory } from '@/services/api';

const result = await services.vapi.startCall(phoneNumber, context);

if (!result.success) {
  const error = result.error;
  
  switch (error.category) {
    case ErrorCategory.NETWORK_ERROR:
      // Show connectivity message
      showNotification(error.userMessage, 'warning');
      break;
    case ErrorCategory.VALIDATION_ERROR:
      // Show form validation errors
      setFormErrors(error.details);
      break;
    case ErrorCategory.RATE_LIMIT_ERROR:
      // Show rate limit message with retry info
      showRateLimitMessage(error.retryAfter);
      break;
    default:
      // Generic error handling
      showErrorDialog(error.userMessage);
  }
}
```

## Performance Features

### Caching

```typescript
// Automatic caching for GET requests
const response1 = await unifiedAPI.get('/api/users'); // Network request
const response2 = await unifiedAPI.get('/api/users'); // Cached response

// Cache invalidation
unifiedAPI.invalidateCache('/api/users/*');

// Bypass cache
const fresh = await unifiedAPI.get('/api/users', { bypassCache: true });
```

### Circuit Breaker

```typescript
// Automatic circuit breaker for external services
const result = await services.maps.geocodeAddress(address);
// If Maps API is failing, circuit opens and requests fail fast
// After recovery timeout, circuit allows test requests
```

### Rate Limiting

```typescript
// Per-user, per-endpoint rate limiting
// Automatically enforced with configurable limits
// Returns descriptive error with retry-after information
```

## Testing

### Service Testing

```typescript
import { services } from '@/services/api';
import { describe, it, expect, vi } from 'vitest';

describe('VAPIService', () => {
  it('should start call successfully', async () => {
    const result = await services.vapi.startCall('+1234567890', {
      customerId: 'test-123'
    });
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
  
  it('should handle network errors gracefully', async () => {
    // Mock network error
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));
    
    const result = await services.vapi.startCall('+1234567890', {});
    
    expect(result.success).toBe(false);
    expect(result.error.category).toBe(ErrorCategory.NETWORK_ERROR);
  });
});
```

### Configuration Testing

```typescript
import { validateConfig, getUnifiedConfig } from '@/services/api';

describe('API Configuration', () => {
  it('should validate required configuration', () => {
    const config = getUnifiedConfig();
    const validation = validateConfig(config);
    
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });
});
```

## Monitoring and Observability

### Health Checks

```typescript
import { services } from '@/services/api';

// System-wide health check
const health = await services.health.testConnection();
console.log('Backend:', health.backend ? '✅' : '❌');
console.log('Supabase:', health.supabase ? '✅' : '❌');

// Service-specific health
const apiHealth = await unifiedAPI.healthCheck();
console.log('API Status:', apiHealth.status);
console.log('Checks:', apiHealth.checks);
```

### Error Statistics

```typescript
import { ErrorHandler } from '@/services/api';

const errorHandler = ErrorHandler.getInstance();
const stats = errorHandler.getErrorStats();

console.log('Total errors:', stats.totalErrors);
console.log('By category:', stats.errorsByCategory);
console.log('By source:', stats.errorsBySource);
console.log('Top errors:', stats.topErrors);
```

## Backward Compatibility

The unified architecture maintains backward compatibility with existing code through legacy exports:

```typescript
// Legacy imports still work (with deprecation warnings)
import { VAPIService, SMSService } from '@/services/api';

// But new code should use the unified services
import { services } from '@/services/api';
```

## Future Roadmap

### Phase 1 (Current)
- ✅ Unified API client with error handling
- ✅ Service layer consolidation
- ✅ Configuration unification
- ✅ Backward compatibility

### Phase 2 (Next)
- 🔄 Advanced caching strategies (Redis integration)
- 🔄 Metrics and monitoring integration
- 🔄 Request/response transformation pipelines
- 🔄 GraphQL support

### Phase 3 (Future)
- 📋 Service mesh integration
- 📋 Advanced load balancing
- 📋 Distributed tracing
- 📋 Auto-scaling circuit breakers

## Conclusion

The unified API architecture provides:

1. **Single Source of Truth**: One place for all API operations
2. **Consistent Patterns**: Standardized service contracts and error handling
3. **Enhanced Reliability**: Circuit breakers, retries, and fallback mechanisms
4. **Better Performance**: Caching, rate limiting, and request optimization
5. **Improved Security**: Input/output validation and secure header management
6. **Easy Migration**: Backward compatibility with existing code

This architecture sets the foundation for a scalable, maintainable API layer that can grow with the application's needs while providing a consistent developer experience.