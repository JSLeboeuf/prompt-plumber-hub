/**
 * Security Middleware Stack - Comprehensive security layer
 * Implements multiple security controls including CORS, rate limiting,
 * request size limits, API key management, and audit logging
 */

import { logger } from '@/lib/logger';
// Security imports for future use
// import { csrfProtection } from './csrf';
// import { withSecurityHeaders } from './headers';

export interface SecurityConfig {
  cors: {
    enabled: boolean;
    allowedOrigins: string[];
    allowedMethods: string[];
    allowedHeaders: string[];
    credentials: boolean;
    maxAge: number;
  };
  rateLimiting: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
    keyGenerator?: (request: SecurityRequest) => string;
  };
  requestLimits: {
    maxBodySize: number;
    maxHeaderSize: number;
    maxUrlLength: number;
  };
  apiKeys: {
    enabled: boolean;
    headerName: string;
    requiredScopes?: string[];
  };
  auditLogging: {
    enabled: boolean;
    logLevel: 'minimal' | 'standard' | 'detailed';
    sensitiveFields: string[];
    retentionDays: number;
  };
  contentSecurity: {
    validateContentType: boolean;
    allowedContentTypes: string[];
    validateJsonSchema: boolean;
  };
}

export interface SecurityRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
  clientId?: string;
  userId?: string;
  timestamp: number;
  requestId: string;
}

export interface SecurityResponse {
  allowed: boolean;
  blocked?: {
    reason: string;
    code: string;
    retryAfter?: number;
  };
  headers?: Record<string, string>;
  transformed?: {
    headers?: Record<string, string>;
    body?: unknown;
  };
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  type: 'request' | 'security_violation' | 'authentication' | 'authorization';
  source: string;
  userId?: string;
  clientId?: string;
  action: string;
  resource: string;
  outcome: 'success' | 'failure' | 'blocked';
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
}

export class SecurityMiddleware {
  private static instance: SecurityMiddleware;
  private config: SecurityConfig;
  private rateLimitStore = new Map<string, { count: number; resetTime: number }>();
  private apiKeyCache = new Map<string, { valid: boolean; scopes: string[]; expiry: number }>();
  private auditEvents: AuditEvent[] = [];
  private suspiciousActivities = new Map<string, number>();

  private constructor(config: SecurityConfig) {
    this.config = config;
    this.startPeriodicCleanup();
  }

  static getInstance(config?: SecurityConfig): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      if (!config) {
        config = SecurityMiddleware.getDefaultConfig();
      }
      SecurityMiddleware.instance = new SecurityMiddleware(config);
    }
    return SecurityMiddleware.instance;
  }

  /**
   * Main security middleware processing pipeline
   */
  async processRequest(request: SecurityRequest): Promise<SecurityResponse> {
    const startTime = Date.now();

    try {
      // 1. CORS validation
      const corsResult = await this.validateCORS(request);
      if (!corsResult.allowed) {
        await this.auditSecurityViolation(request, 'cors_violation', corsResult.blocked!.reason);
        return corsResult;
      }

      // 2. Request size validation
      const sizeResult = await this.validateRequestSize(request);
      if (!sizeResult.allowed) {
        await this.auditSecurityViolation(request, 'size_limit_exceeded', sizeResult.blocked!.reason);
        return sizeResult;
      }

      // 3. Content security validation
      const contentResult = await this.validateContentSecurity(request);
      if (!contentResult.allowed) {
        await this.auditSecurityViolation(request, 'content_security_violation', contentResult.blocked!.reason);
        return contentResult;
      }

      // 4. Rate limiting
      const rateLimitResult = await this.checkRateLimit(request);
      if (!rateLimitResult.allowed) {
        await this.auditSecurityViolation(request, 'rate_limit_exceeded', rateLimitResult.blocked!.reason);
        return rateLimitResult;
      }

      // 5. API key validation
      const apiKeyResult = await this.validateApiKey(request);
      if (!apiKeyResult.allowed) {
        await this.auditSecurityViolation(request, 'api_key_invalid', apiKeyResult.blocked!.reason);
        return apiKeyResult;
      }

      // 6. CSRF protection for state-changing operations
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        const csrfResult = await this.validateCSRF(request);
        if (!csrfResult.allowed) {
          await this.auditSecurityViolation(request, 'csrf_validation_failed', csrfResult.blocked!.reason);
          return csrfResult;
        }
      }

      // 7. Suspicious activity detection
      await this.detectSuspiciousActivity(request);

      // 8. Apply security headers
      const securityHeaders = this.generateSecurityHeaders(request);

      // 9. Audit successful request
      await this.auditRequest(request, 'success', Date.now() - startTime);

      return {
        allowed: true,
        headers: securityHeaders,
        transformed: {
          headers: { ...request.headers, ...securityHeaders }
        }
      };

    } catch (error) {
      logger.error('Security middleware error', {
        requestId: request.requestId,
        error: error instanceof Error ? error.message : String(error)
      });

      await this.auditSecurityViolation(
        request,
        'middleware_error',
        'Security middleware processing failed'
      );

      return {
        allowed: false,
        blocked: {
          reason: 'Security validation failed',
          code: 'SECURITY_ERROR'
        }
      };
    }
  }

  /**
   * CORS validation
   */
  private async validateCORS(request: SecurityRequest): Promise<SecurityResponse> {
    if (!this.config.cors.enabled) {
      return { allowed: true };
    }

    const origin = request.headers['origin'] || request.headers['Origin'];

    // Allow requests without origin (same-origin, mobile apps, etc.)
    if (!origin) {
      return { allowed: true };
    }

    // Check if origin is allowed
    const allowedOrigins = this.config.cors.allowedOrigins;
    const isAllowed = allowedOrigins.includes('*') ||
                     allowedOrigins.includes(origin) ||
                     allowedOrigins.some(allowed => {
                       // Support wildcard subdomains
                       if (allowed.startsWith('*.')) {
                         const domain = allowed.substring(2);
                         return origin.endsWith(domain);
                       }
                       return false;
                     });

    if (!isAllowed) {
      return {
        allowed: false,
        blocked: {
          reason: `Origin ${origin} not allowed`,
          code: 'CORS_ORIGIN_NOT_ALLOWED'
        }
      };
    }

    // Generate CORS headers
    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': allowedOrigins.includes('*') ? '*' : origin,
      'Access-Control-Allow-Methods': this.config.cors.allowedMethods.join(', '),
      'Access-Control-Allow-Headers': this.config.cors.allowedHeaders.join(', '),
      'Access-Control-Max-Age': this.config.cors.maxAge.toString()
    };

    if (this.config.cors.credentials) {
      corsHeaders['Access-Control-Allow-Credentials'] = 'true';
    }

    return {
      allowed: true,
      headers: corsHeaders
    };
  }

  /**
   * Request size validation
   */
  private async validateRequestSize(request: SecurityRequest): Promise<SecurityResponse> {
    const { maxBodySize, maxHeaderSize, maxUrlLength } = this.config.requestLimits;

    // Check URL length
    if (request.url.length > maxUrlLength) {
      return {
        allowed: false,
        blocked: {
          reason: `URL length ${request.url.length} exceeds limit of ${maxUrlLength}`,
          code: 'URL_TOO_LONG'
        }
      };
    }

    // Check headers size
    const headerSize = JSON.stringify(request.headers).length;
    if (headerSize > maxHeaderSize) {
      return {
        allowed: false,
        blocked: {
          reason: `Headers size ${headerSize} exceeds limit of ${maxHeaderSize}`,
          code: 'HEADERS_TOO_LARGE'
        }
      };
    }

    // Check body size
    if (request.body) {
      const bodySize = JSON.stringify(request.body).length;
      if (bodySize > maxBodySize) {
        return {
          allowed: false,
          blocked: {
            reason: `Body size ${bodySize} exceeds limit of ${maxBodySize}`,
            code: 'BODY_TOO_LARGE'
          }
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Content security validation
   */
  private async validateContentSecurity(request: SecurityRequest): Promise<SecurityResponse> {
    if (!this.config.contentSecurity.validateContentType) {
      return { allowed: true };
    }

    const contentType = request.headers['content-type'] || request.headers['Content-Type'];

    // Skip validation for GET requests
    if (request.method === 'GET' || !request.body) {
      return { allowed: true };
    }

    if (!contentType) {
      return {
        allowed: false,
        blocked: {
          reason: 'Missing Content-Type header',
          code: 'MISSING_CONTENT_TYPE'
        }
      };
    }

    const baseContentType = contentType.split(';')[0].trim();
    const allowedTypes = this.config.contentSecurity.allowedContentTypes;

    if (!allowedTypes.includes(baseContentType)) {
      return {
        allowed: false,
        blocked: {
          reason: `Content type ${baseContentType} not allowed`,
          code: 'INVALID_CONTENT_TYPE'
        }
      };
    }

    // Additional JSON validation
    if (baseContentType === 'application/json' &&
        this.config.contentSecurity.validateJsonSchema) {
      try {
        // Validate that body is valid JSON if content-type is JSON
        if (typeof request.body === 'string') {
          JSON.parse(request.body);
        }
      } catch {
        return {
          allowed: false,
          blocked: {
            reason: 'Invalid JSON in request body',
            code: 'INVALID_JSON'
          }
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Rate limiting check
   */
  private async checkRateLimit(request: SecurityRequest): Promise<SecurityResponse> {
    if (!this.config.rateLimiting.enabled) {
      return { allowed: true };
    }

    const key = this.config.rateLimiting.keyGenerator ?
      this.config.rateLimiting.keyGenerator(request) :
      this.generateRateLimitKey(request);

    const now = Date.now();
    const windowMs = this.config.rateLimiting.windowMs;
    const maxRequests = this.config.rateLimiting.maxRequests;

    let entry = this.rateLimitStore.get(key);

    // Reset window if expired
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + windowMs
      };
      this.rateLimitStore.set(key, entry);
    }

    // Check if limit exceeded
    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

      return {
        allowed: false,
        blocked: {
          reason: `Rate limit exceeded: ${entry.count}/${maxRequests} requests`,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter
        },
        headers: {
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': entry.resetTime.toString(),
          'Retry-After': retryAfter.toString()
        }
      };
    }

    // Increment counter
    entry.count++;

    return {
      allowed: true,
      headers: {
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': (maxRequests - entry.count).toString(),
        'X-RateLimit-Reset': entry.resetTime.toString()
      }
    };
  }

  /**
   * API key validation
   */
  private async validateApiKey(request: SecurityRequest): Promise<SecurityResponse> {
    if (!this.config.apiKeys.enabled) {
      return { allowed: true };
    }

    const apiKey = request.headers[this.config.apiKeys.headerName.toLowerCase()];

    if (!apiKey) {
      return {
        allowed: false,
        blocked: {
          reason: `Missing API key in ${this.config.apiKeys.headerName} header`,
          code: 'MISSING_API_KEY'
        }
      };
    }

    // Check cache first
    const cached = this.apiKeyCache.get(apiKey);
    if (cached && Date.now() < cached.expiry) {
      if (!cached.valid) {
        return {
          allowed: false,
          blocked: {
            reason: 'Invalid API key',
            code: 'INVALID_API_KEY'
          }
        };
      }

      // Check scopes if required
      if (this.config.apiKeys.requiredScopes) {
        const hasRequiredScopes = this.config.apiKeys.requiredScopes.every(
          scope => cached.scopes.includes(scope)
        );

        if (!hasRequiredScopes) {
          return {
            allowed: false,
            blocked: {
              reason: 'Insufficient API key scopes',
              code: 'INSUFFICIENT_SCOPES'
            }
          };
        }
      }

      return { allowed: true };
    }

    // Validate API key (this would typically call an external service)
    const validation = await this.validateApiKeyExternal(apiKey);

    // Cache result
    this.apiKeyCache.set(apiKey, {
      valid: validation.valid,
      scopes: validation.scopes || [],
      expiry: Date.now() + (5 * 60 * 1000) // 5 minute cache
    });

    if (!validation.valid) {
      return {
        allowed: false,
        blocked: {
          reason: 'Invalid API key',
          code: 'INVALID_API_KEY'
        }
      };
    }

    return { allowed: true };
  }

  /**
   * CSRF validation
   */
  private async validateCSRF(request: SecurityRequest): Promise<SecurityResponse> {
    const csrfToken = request.headers['x-csrf-token'] || request.headers['X-CSRF-Token'];

    if (!csrfToken) {
      return {
        allowed: false,
        blocked: {
          reason: 'Missing CSRF token',
          code: 'MISSING_CSRF_TOKEN'
        }
      };
    }

    // For now, just check that token exists
    // In production, this would validate against stored token
    if (csrfToken.length < 16) {
      return {
        allowed: false,
        blocked: {
          reason: 'Invalid CSRF token format',
          code: 'INVALID_CSRF_TOKEN'
        }
      };
    }

    return { allowed: true };
  }

  /**
   * Detect suspicious activity patterns
   */
  private async detectSuspiciousActivity(request: SecurityRequest): Promise<void> {
    const clientIdentifier = request.clientId || request.headers['x-forwarded-for'] || 'unknown';
    const suspicious = this.suspiciousActivities.get(clientIdentifier) || 0;

    // Check for suspicious patterns
    let suspicionScore = 0;

    // Rapid requests from same client
    suspicionScore += suspicious > 100 ? 2 : 0;

    // Unusual request patterns
    if (request.url.includes('..') || request.url.includes('~')) {
      suspicionScore += 3;
    }

    // SQL injection patterns
    const sqlPatterns = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/i;
    if (sqlPatterns.test(request.url) ||
        (request.body && sqlPatterns.test(JSON.stringify(request.body)))) {
      suspicionScore += 5;
    }

    // XSS patterns
    const xssPatterns = /<script|javascript:|onload=|onerror=/i;
    if (xssPatterns.test(request.url) ||
        (request.body && xssPatterns.test(JSON.stringify(request.body)))) {
      suspicionScore += 4;
    }

    if (suspicionScore > 3) {
      await this.auditSecurityViolation(
        request,
        'suspicious_activity',
        `Suspicion score: ${suspicionScore}`
      );

      // Increase suspicion counter
      this.suspiciousActivities.set(clientIdentifier, suspicious + suspicionScore);

      logger.warn('Suspicious activity detected', {
        clientIdentifier,
        suspicionScore,
        totalSuspicion: suspicious + suspicionScore,
        requestId: request.requestId
      });
    }
  }

  /**
   * Generate security headers
   */
  private generateSecurityHeaders(request: SecurityRequest): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Request-ID': request.requestId
    };
  }

  /**
   * Audit logging methods
   */
  private async auditRequest(
    request: SecurityRequest,
    outcome: 'success' | 'failure',
    duration: number
  ): Promise<void> {
    if (!this.config.auditLogging.enabled) {
      return;
    }

    const auditEvent: AuditEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type: 'request',
      source: 'security_middleware',
      userId: request.userId,
      clientId: request.clientId,
      action: request.method,
      resource: request.url,
      outcome,
      details: {
        duration,
        userAgent: request.headers['user-agent'],
        contentType: request.headers['content-type']
      },
      ipAddress: request.headers['x-forwarded-for'] || request.headers['x-real-ip'],
      userAgent: request.headers['user-agent'],
      correlationId: request.requestId
    };

    this.auditEvents.push(auditEvent);
    this.cleanupAuditEvents();

    // Log based on level
    if (this.config.auditLogging.logLevel !== 'minimal') {
      logger.info('Security audit event', auditEvent);
    }
  }

  private async auditSecurityViolation(
    request: SecurityRequest,
    violationType: string,
    reason: string
  ): Promise<void> {
    const auditEvent: AuditEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type: 'security_violation',
      source: 'security_middleware',
      userId: request.userId,
      clientId: request.clientId,
      action: violationType,
      resource: request.url,
      outcome: 'blocked',
      details: {
        reason,
        method: request.method,
        userAgent: request.headers['user-agent']
      },
      ipAddress: request.headers['x-forwarded-for'] || request.headers['x-real-ip'],
      userAgent: request.headers['user-agent'],
      correlationId: request.requestId
    };

    this.auditEvents.push(auditEvent);
    this.cleanupAuditEvents();

    logger.warn('Security violation detected', auditEvent);
  }

  /**
   * Helper methods
   */
  private generateRateLimitKey(request: SecurityRequest): string {
    // Use client ID if available, otherwise use IP
    return request.clientId ||
           request.headers['x-forwarded-for'] ||
           request.headers['x-real-ip'] ||
           'unknown';
  }

  private async validateApiKeyExternal(apiKey: string): Promise<{
    valid: boolean;
    scopes?: string[];
  }> {
    // This would typically validate against an external service
    // For now, just check basic format
    if (apiKey.length < 32) {
      return { valid: false };
    }

    // Mock validation - in production, this would call your API key service
    return {
      valid: true,
      scopes: ['read', 'write']
    };
  }

  private startPeriodicCleanup(): void {
    // Cleanup expired entries every 5 minutes
    setInterval(() => {
      this.cleanupRateLimitStore();
      this.cleanupApiKeyCache();
      this.cleanupSuspiciousActivities();
    }, 5 * 60 * 1000);
  }

  private cleanupRateLimitStore(): void {
    const now = Date.now();
    for (const [key, entry] of this.rateLimitStore) {
      if (now > entry.resetTime) {
        this.rateLimitStore.delete(key);
      }
    }
  }

  private cleanupApiKeyCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.apiKeyCache) {
      if (now > entry.expiry) {
        this.apiKeyCache.delete(key);
      }
    }
  }

  private cleanupSuspiciousActivities(): void {
    // Reset suspicion scores periodically
    this.suspiciousActivities.clear();
  }

  private cleanupAuditEvents(): void {
    const maxEvents = 10000;
    if (this.auditEvents.length > maxEvents) {
      this.auditEvents = this.auditEvents.slice(-maxEvents);
    }
  }

  /**
   * Get security statistics
   */
  getSecurityStats(): {
    rateLimits: { active: number; violations: number };
    apiKeys: { cached: number; valid: number };
    auditEvents: { total: number; violations: number };
    suspiciousClients: number;
  } {
    const violations = this.auditEvents.filter(
      event => event.type === 'security_violation'
    ).length;

    const validApiKeys = Array.from(this.apiKeyCache.values())
      .filter(entry => entry.valid).length;

    return {
      rateLimits: {
        active: this.rateLimitStore.size,
        violations: 0 // Would track this in production
      },
      apiKeys: {
        cached: this.apiKeyCache.size,
        valid: validApiKeys
      },
      auditEvents: {
        total: this.auditEvents.length,
        violations
      },
      suspiciousClients: this.suspiciousActivities.size
    };
  }

  /**
   * Default configuration
   */
  private static getDefaultConfig(): SecurityConfig {
    return {
      cors: {
        enabled: true,
        allowedOrigins: ['http://localhost:3000', 'https://*.vercel.app'],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
        credentials: true,
        maxAge: 86400
      },
      rateLimiting: {
        enabled: true,
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100,
        skipSuccessfulRequests: false
      },
      requestLimits: {
        maxBodySize: 10 * 1024 * 1024, // 10MB
        maxHeaderSize: 16 * 1024,       // 16KB
        maxUrlLength: 2048              // 2KB
      },
      apiKeys: {
        enabled: false,
        headerName: 'X-API-Key'
      },
      auditLogging: {
        enabled: true,
        logLevel: 'standard',
        sensitiveFields: ['password', 'token', 'secret', 'key'],
        retentionDays: 30
      },
      contentSecurity: {
        validateContentType: true,
        allowedContentTypes: ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data'],
        validateJsonSchema: true
      }
    };
  }
}