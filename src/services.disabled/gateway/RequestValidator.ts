/**
 * Request Validator - Multi-layer validation pipeline
 * Implements comprehensive validation for API requests
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { z } from 'zod';
import { logger } from '@/lib/logger';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitized?: unknown;
}

export interface ValidationRule {
  name: string;
  validate: (request: unknown) => Promise<ValidationResult> | ValidationResult;
}

export class RequestValidator {
  private rules: ValidationRule[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Validate a request through all registered rules
   */
  async validate(request: unknown): Promise<ValidationResult> {
    const allErrors: string[] = [];
    let sanitizedRequest = request;

    for (const rule of this.rules) {
      try {
        const result = await rule.validate(sanitizedRequest);

        if (!result.valid) {
          allErrors.push(...result.errors.map(error => `${rule.name}: ${error}`));
        } else if (result.sanitized !== undefined) {
          sanitizedRequest = result.sanitized;
        }
      } catch (error) {
        logger.error('Validation rule failed', {
          rule: rule.name,
          error: error instanceof Error ? error.message : String(error)
        });
        allErrors.push(`${rule.name}: Validation rule error`);
      }
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      sanitized: sanitizedRequest
    };
  }

  /**
   * Add a custom validation rule
   */
  addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  /**
   * Remove a validation rule by name
   */
  removeRule(name: string): void {
    this.rules = this.rules.filter(rule => rule.name !== name);
  }

  /**
   * Initialize default validation rules
   */
  private initializeDefaultRules(): void {
    // Basic structure validation
    this.addRule({
      name: 'structure',
      validate: (request) => this.validateStructure(request)
    });

    // Input sanitization
    this.addRule({
      name: 'sanitization',
      validate: (request) => this.sanitizeInput(request)
    });

    // Size limits
    this.addRule({
      name: 'size',
      validate: (request) => this.validateSize(request)
    });

    // Security patterns
    this.addRule({
      name: 'security',
      validate: (request) => this.validateSecurity(request)
    });
  }

  /**
   * Validate basic request structure
   */
  private validateStructure(request: unknown): ValidationResult {
    const requestSchema = z.object({
      method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
      endpoint: z.string().min(1).regex(/^\/[a-zA-Z0-9/_-]*$/, 'Invalid endpoint format'),
      data: z.unknown().optional(),
      headers: z.record(z.string()).optional(),
      timeout: z.number().positive().max(300000).optional(), // Max 5 minutes
      retries: z.number().int().min(0).max(5).optional(),
      skipAuth: z.boolean().optional(),
      skipRateLimit: z.boolean().optional(),
      transform: z.function().optional()
    });

    try {
      const validated = requestSchema.parse(request);
      return {
        valid: true,
        errors: [],
        sanitized: validated
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        };
      }

      return {
        valid: false,
        errors: ['Invalid request structure']
      };
    }
  }

  /**
   * Sanitize input data to prevent injection attacks
   */
  private sanitizeInput(request: unknown): ValidationResult {
    try {
      const sanitized = this.deepSanitize(request);
      return {
        valid: true,
        errors: [],
        sanitized
      };
    } catch (sanitizeError) {
      logger.error('Input sanitization failed', { error: sanitizeError });
      return {
        valid: false,
        errors: ['Input sanitization failed']
      };
    }
  }

  /**
   * Validate request size limits
   */
  private validateSize(request: unknown): ValidationResult {
    const errors: string[] = [];

    try {
      const requestString = JSON.stringify(request);
      const sizeInBytes = new Blob([requestString]).size;

      // 10MB limit for requests
      const maxSize = 10 * 1024 * 1024;
      if (sizeInBytes > maxSize) {
        errors.push(`Request size ${sizeInBytes} exceeds limit of ${maxSize} bytes`);
      }

      // Check data field specifically
      const req = request as any;
      if (req?.data) {
        const dataString = JSON.stringify(req.data);
        const dataSizeInBytes = new Blob([dataString]).size;

        // 5MB limit for data payload
        const maxDataSize = 5 * 1024 * 1024;
        if (dataSizeInBytes > maxDataSize) {
          errors.push(`Data payload size ${dataSizeInBytes} exceeds limit of ${maxDataSize} bytes`);
        }
      }

    } catch (sizeError) {
      logger.error('Size calculation failed', { error: sizeError });
      errors.push('Unable to calculate request size');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate against security patterns
   */
  private validateSecurity(request: unknown): ValidationResult {
    const errors: string[] = [];
    const req = request as any;

    // Check for dangerous patterns in strings
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
      /javascript:/gi,                                        // JavaScript URLs
      /on\w+\s*=/gi,                                         // Event handlers
      /expression\s*\(/gi,                                   // CSS expressions
      /eval\s*\(/gi,                                         // Eval calls
      /setTimeout\s*\(/gi,                                   // setTimeout calls
      /setInterval\s*\(/gi,                                  // setInterval calls
    ];

    const checkForPatterns = (obj: unknown, path = ''): void => {
      if (typeof obj === 'string') {
        for (const pattern of dangerousPatterns) {
          if (pattern.test(obj)) {
            errors.push(`Potentially dangerous content detected at ${path || 'root'}`);
            break;
          }
        }
      } else if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          checkForPatterns(item, `${path}[${index}]`);
        });
      } else if (obj && typeof obj === 'object') {
        Object.entries(obj).forEach(([key, value]) => {
          const newPath = path ? `${path}.${key}` : key;
          checkForPatterns(value, newPath);
        });
      }
    };

    checkForPatterns(req);

    // Check endpoint for path traversal
    if (req?.endpoint && typeof req.endpoint === 'string') {
      if (req.endpoint.includes('..') || req.endpoint.includes('~')) {
        errors.push('Path traversal attempt detected in endpoint');
      }
    }

    // Check headers for dangerous values
    if (req?.headers && typeof req.headers === 'object') {
      for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === 'string') {
          // Check for header injection
          if (value.includes('\n') || value.includes('\r')) {
            errors.push(`Header injection attempt detected in ${key}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Deep sanitize an object, removing dangerous content
   */
  private deepSanitize(obj: unknown): unknown {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepSanitize(item));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize key names
        const sanitizedKey = this.sanitizeString(key);
        sanitized[sanitizedKey] = this.deepSanitize(value);
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Sanitize a string value
   */
  private sanitizeString(str: string): string {
    return str
      // Remove null bytes
      // eslint-disable-next-line no-control-regex
      .replace(/\x00/g, '')
      // Remove control characters except newlines and tabs
      // eslint-disable-next-line no-control-regex
      .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      // Trim
      .trim();
  }

  /**
   * Validate specific data schemas based on endpoint
   */
  validateEndpointData(endpoint: string, data: unknown): ValidationResult {
    // Define endpoint-specific schemas
    const endpointSchemas: Record<string, z.ZodSchema> = {
      '/api/calls': z.object({
        phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
        assistantId: z.string().uuid().optional(),
        context: z.record(z.unknown()).optional()
      }),

      '/api/sms': z.object({
        to: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
        message: z.string().min(1).max(1600, 'Message too long'),
        priority: z.enum(['low', 'normal', 'high']).optional()
      }),

      '/api/support': z.object({
        type: z.enum(['call', 'chat', 'email', 'sms']),
        message: z.string().min(1).max(5000),
        urgency: z.enum(['low', 'normal', 'high']).optional(),
        clientInfo: z.object({
          name: z.string().optional(),
          phone: z.string().optional(),
          email: z.string().email().optional()
        }).optional()
      })
    };

    const schema = endpointSchemas[endpoint];
    if (!schema) {
      return { valid: true, errors: [] }; // No specific validation
    }

    try {
      const validated = schema.parse(data);
      return {
        valid: true,
        errors: [],
        sanitized: validated
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        };
      }

      return {
        valid: false,
        errors: ['Data validation failed']
      };
    }
  }
}