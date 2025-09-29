# Secure API Layer Architecture

## Overview

This document describes the comprehensive secure API layer architecture implemented for the Prompt Plumber Hub application. The architecture provides enterprise-grade security, reliability, and scalability patterns for API management.

## Architecture Components

### 1. API Gateway (`/services/gateway/`)

**Core Component**: `ApiGateway.ts`

The API Gateway serves as the single entry point for all API requests, implementing:

- **Request Routing**: Centralized routing with endpoint-specific configuration
- **Rate Limiting**: Token bucket algorithm with sliding window protection
- **Authentication/Authorization**: CSRF protection and API key validation
- **Request/Response Transformation**: Consistent data formatting and sanitization
- **Comprehensive Logging**: Request tracking with correlation IDs
- **Circuit Breaker**: Fault tolerance for external service dependencies
- **Health Monitoring**: Service availability and performance tracking

**Key Features**:
- Parallel tool execution optimization
- Retry logic with exponential backoff
- Request/response caching
- Security header injection
- Performance metrics collection

### 2. Rate Limiting (`RateLimiter.ts`)

**Implementation**: Token bucket algorithm with sliding window

- **Per-client Rate Limiting**: Individual client tracking
- **Per-endpoint Controls**: Specific limits per API endpoint
- **Burst Protection**: Token bucket prevents traffic spikes
- **Automatic Cleanup**: Memory management for expired entries
- **Configurable Windows**: Flexible time window configuration

### 3. Circuit Breaker (`CircuitBreaker.ts`)

**Pattern**: Fault tolerance for external services

- **State Management**: CLOSED → OPEN → HALF_OPEN transitions
- **Failure Threshold**: Configurable failure count before opening
- **Recovery Mechanism**: Automatic retry after timeout
- **Fallback Support**: Graceful degradation with cached responses
- **Health Monitoring**: Service availability tracking

### 4. Request Validation (`RequestValidator.ts`)

**Multi-layer Validation Pipeline**:

- **Structure Validation**: Zod schema validation for request format
- **Input Sanitization**: XSS and injection attack prevention
- **Size Limits**: Request/response size boundaries
- **Security Patterns**: Dangerous content detection
- **Endpoint-specific Schemas**: Custom validation per API endpoint

### 5. Response Transformation (`ResponseTransformer.ts`)

**Consistent Response Formatting**:

- **Data Sanitization**: Sensitive information masking
- **Structure Normalization**: Consistent field naming and formats
- **Error Transformation**: Standardized error response format
- **Performance Metadata**: Request timing and processing information
- **Pagination Support**: Uniform pagination structure

### 6. Metrics Collection (`MetricsCollector.ts`)

**Performance and Usage Monitoring**:

- **Request Metrics**: Duration, success rate, error tracking
- **Aggregated Statistics**: P95/P99 response times, throughput
- **Real-time Alerts**: Performance degradation detection
- **Prometheus Export**: Standard metrics format for monitoring
- **Dashboard Data**: Real-time metrics for operations

## Security Layer (`/services/security/`)

### Security Middleware (`SecurityMiddleware.ts`)

**Comprehensive Security Controls**:

- **CORS Validation**: Cross-origin request security
- **Request Size Limits**: Body, header, and URL size restrictions
- **Content Security**: Content-Type validation and JSON schema checking
- **API Key Management**: Authentication and scope validation
- **Suspicious Activity Detection**: Pattern-based threat detection
- **Audit Logging**: Security event tracking and compliance

**Security Features**:
- SQL injection detection
- XSS pattern recognition
- Path traversal prevention
- Header injection protection
- Rate limiting per client

### CSRF Protection (`csrf.ts`)

**Enhanced Implementation**:
- Double-submit cookie pattern
- Secure token generation
- Session-based validation
- Automatic token refresh
- React hook integration

### Security Headers (`headers.ts`)

**Production-Ready Headers**:
- Content Security Policy (CSP)
- Strict Transport Security (HSTS)
- X-Frame-Options, X-Content-Type-Options
- Subresource Integrity (SRI) support
- Vite plugin for development integration

## Service Layer (`/services/core/`)

### Service Registry (`ServiceRegistry.ts`)

**Dependency Injection and Service Management**:

- **Service Discovery**: Centralized service registration
- **Dependency Resolution**: Automatic dependency injection
- **Lifecycle Management**: Service initialization and cleanup
- **Health Monitoring**: Periodic service health checks
- **Configuration Management**: Service-specific configuration

### Error Handling (`/services/errors/ErrorHandler.ts`)

**Comprehensive Error Management**:

- **Error Categorization**: CLIENT_ERROR, SERVER_ERROR, NETWORK_ERROR, etc.
- **Severity Classification**: LOW, MEDIUM, HIGH, CRITICAL levels
- **Retry Logic**: Configurable retry strategies with exponential backoff
- **Circuit Breaker Integration**: Fault tolerance for external services
- **User-friendly Messages**: Production-appropriate error responses
- **Audit Logging**: Error pattern tracking and alerting

**Error Categories**:
```typescript
enum ErrorCategory {
  CLIENT_ERROR = 'CLIENT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTH_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXT_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  CONFIGURATION_ERROR = 'CONFIG_ERROR'
}
```

## Integration Layer (`/services/integration/`)

### Service Orchestrator (`ServiceOrchestrator.ts`)

**Unified Service Coordination**:

- **Multi-service Operations**: Coordinated calls across Supabase, VAPI, Twilio, Google Maps
- **Batch Processing**: Parallel execution with concurrency control
- **Caching Strategy**: Response caching with TTL management
- **Fallback Mechanisms**: Graceful degradation when services fail
- **Performance Optimization**: Request batching and response caching

**Supported Services**:
- **Supabase**: Database operations with relationship handling
- **VAPI**: Voice AI call management
- **Twilio**: SMS and communication services
- **Google Maps**: Geocoding and distance calculations
- **n8n**: Workflow automation triggers

## Configuration and Management

### API Service Manager (`ApiServiceManager.ts`)

**Main Orchestration Layer**:

- **Environment-aware Configuration**: Development/staging/production settings
- **Service Initialization**: Coordinated startup sequence
- **Health Monitoring**: Comprehensive system health tracking
- **Graceful Shutdown**: Clean resource cleanup
- **Unified API Client**: Single interface for all services

**Configuration Structure**:
```typescript
interface ApiServiceConfig {
  environment: 'development' | 'staging' | 'production';
  gateway: GatewayConfig;
  security: SecurityConfig;
  errorHandling: ErrorHandlerConfig;
  services: ServiceConfigurations;
  monitoring: MonitoringConfig;
}
```

## Usage Examples (`/services/examples/`)

### Complete Integration Examples

The `ApiUsageExamples.ts` file provides comprehensive examples:

- **Service Initialization**: Complete setup and configuration
- **CRUD Operations**: Supabase database interactions
- **External API Calls**: VAPI, Twilio, Google Maps integrations
- **Batch Operations**: Parallel processing examples
- **Error Handling**: Comprehensive error management patterns
- **Health Monitoring**: System status checking
- **Complete Workflows**: End-to-end business process examples

### Emergency Workflow Example

```typescript
async function completeEmergencyWorkflow() {
  // 1. Create call record in Supabase
  // 2. Calculate ETA with Google Maps
  // 3. Send SMS confirmation via Twilio
  // 4. Trigger n8n workflow for dispatch
  // 5. Initiate VAPI follow-up call
  // 6. Handle failures with fallbacks
}
```

## Security Considerations

### Production Security Features

1. **API Gateway Security**:
   - Request rate limiting per client
   - Input validation and sanitization
   - CSRF protection for state-changing operations
   - Security headers on all responses

2. **Authentication & Authorization**:
   - API key validation with scope checking
   - Session-based CSRF tokens
   - Origin validation for CORS

3. **Data Protection**:
   - PII masking in logs and responses
   - Sensitive field identification
   - Secure error messages (no stack traces in production)

4. **Network Security**:
   - HTTPS enforcement
   - Content Security Policy
   - Secure cookie configuration

### Audit and Compliance

- **Audit Logging**: All security events logged with retention policies
- **Performance Monitoring**: Real-time metrics and alerting
- **Error Tracking**: Categorized error logging with correlation IDs
- **Health Checks**: Automated service monitoring

## Performance Optimizations

### Caching Strategy

- **Response Caching**: Configurable TTL for external service responses
- **Circuit Breaker Fallbacks**: Cached responses when services are down
- **Memory Management**: Automatic cleanup of expired cache entries

### Parallel Processing

- **Batch Operations**: Concurrent execution with configurable limits
- **Tool Optimization**: Parallel tool calls where possible
- **Request Batching**: Multiple operations in single request

### Resource Management

- **Connection Pooling**: Efficient resource utilization
- **Memory Monitoring**: Automatic cleanup of expired data
- **Performance Metrics**: Real-time monitoring and alerting

## Monitoring and Observability

### Health Monitoring

```typescript
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, ServiceHealth>;
  metrics: PerformanceMetrics;
  timestamp: string;
}
```

### Metrics Collection

- **Request Metrics**: Count, duration, success rate
- **Error Metrics**: Error rate by category and service
- **Performance Metrics**: P95/P99 response times
- **System Metrics**: Memory usage, connection counts

### Alerting

- **High Error Rate**: > 5% error rate triggers alerts
- **High Response Time**: P95 > 5 seconds triggers alerts
- **Service Degradation**: Circuit breaker state changes
- **Security Violations**: Suspicious activity detection

## Deployment Considerations

### Environment Configuration

- **Development**: Relaxed security, verbose logging, higher rate limits
- **Staging**: Production-like security, moderate logging
- **Production**: Full security, error-only logging, strict rate limits

### Infrastructure Requirements

- **Load Balancing**: Multiple instance support
- **Database Connections**: Connection pooling and limits
- **External Service Limits**: Rate limiting coordination
- **Monitoring Integration**: Prometheus/Grafana compatible metrics

### Scaling Considerations

- **Horizontal Scaling**: Stateless design for multiple instances
- **Database Scaling**: Optimized queries and connection management
- **Cache Scaling**: Distributed caching support
- **Circuit Breaker Coordination**: Shared state for multiple instances

## Integration Points

### Frontend Integration

```typescript
// React Hook Example
const api = useApiService();
const result = await api.calls.makeEmergencyCall(phone, name);
```

### Backend Integration

```typescript
// Service Layer Integration
const apiManager = ApiServiceManager.getInstance();
await apiManager.initialize(config);
const client = apiManager.getApiClient();
```

### External Service Integration

- **Supabase**: Real-time subscriptions and CRUD operations
- **VAPI**: Voice AI call management with context
- **Twilio**: SMS with priority and delivery tracking
- **Google Maps**: Geocoding and distance calculations
- **n8n**: Workflow automation with event triggering

## File Structure

```
src/services/
├── gateway/
│   ├── ApiGateway.ts           # Main gateway implementation
│   ├── RateLimiter.ts          # Token bucket rate limiting
│   ├── CircuitBreaker.ts       # Fault tolerance pattern
│   ├── RequestValidator.ts     # Multi-layer validation
│   ├── ResponseTransformer.ts  # Response standardization
│   └── MetricsCollector.ts     # Performance monitoring
├── security/
│   ├── SecurityMiddleware.ts   # Comprehensive security
│   ├── csrf.ts                 # CSRF protection (enhanced)
│   └── headers.ts              # Security headers (enhanced)
├── core/
│   └── ServiceRegistry.ts      # Service management
├── errors/
│   └── ErrorHandler.ts         # Comprehensive error handling
├── integration/
│   └── ServiceOrchestrator.ts  # Service coordination
├── examples/
│   └── ApiUsageExamples.ts     # Implementation examples
├── ApiServiceManager.ts        # Main orchestration
└── [existing files...]         # BaseService.ts, etc.
```

## Migration Guide

### From Existing Implementation

1. **Initialize the new API layer**:
   ```typescript
   await ApiServiceManager.getInstance().initialize(config);
   ```

2. **Replace direct service calls**:
   ```typescript
   // Old
   const { data } = await supabase.from('table').select('*');

   // New
   const response = await api.supabase.fetchData('table', filters);
   ```

3. **Add error handling**:
   ```typescript
   if (response.success) {
     // Handle success
   } else {
     // Handle categorized errors
   }
   ```

4. **Update security configuration**:
   - Configure CORS origins
   - Set up rate limiting
   - Enable audit logging

This architecture provides a production-ready, scalable, and secure foundation for all API operations in the Prompt Plumber Hub application.