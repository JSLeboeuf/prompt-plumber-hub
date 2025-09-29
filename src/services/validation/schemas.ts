import { z } from 'zod';

/**
 * Input Validation Schemas
 * Prevents injection attacks and validates all external API inputs
 */

// Sanitization helpers
const sanitizeString = (val: string) => {
  return val
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/['"]/g, '') // Remove quotes that could cause injection
    .replace(/[;]/g, '') // Remove semicolons
    .replace(/[\r\n]/g, ' ') // Remove line breaks
    .trim();
};

// Custom Zod types with sanitization
const SafeString = (minLength = 0, maxLength = 1000) =>
  z.string()
    .min(minLength)
    .max(maxLength)
    .transform(sanitizeString);

const SafeStringWithRegex = (pattern: RegExp, message: string) =>
  z.string()
    .regex(pattern, message)
    .transform(sanitizeString);

const SafeEmail = z.string().email().transform(val => val.toLowerCase().trim());
const _SafeUrl = z.string().url().refine(
  url => url.startsWith('https://') || url.startsWith('http://'),
  'URL must start with http:// or https://'
);

// Geographic coordinates validation
const LatitudeSchema = z.number().min(-90).max(90);
const LongitudeSchema = z.number().min(-180).max(180);

// ============================================
// Google Maps API Schemas
// ============================================

export const GeocodeAddressSchema = z.object({
  address: SafeString(1, 500),
  country: SafeString(0, 2).optional(), // ISO country code
  bounds: z.object({
    northeast: z.object({
      lat: LatitudeSchema,
      lng: LongitudeSchema,
    }),
    southwest: z.object({
      lat: LatitudeSchema,
      lng: LongitudeSchema,
    }),
  }).optional(),
});

export const WaypointSchema = z.object({
  lat: LatitudeSchema,
  lng: LongitudeSchema,
  label: SafeString(0, 100).optional(),
});

export const OptimizeRouteSchema = z.object({
  waypoints: z.array(WaypointSchema).min(2).max(25), // Google Maps limit
  travelMode: z.enum(['DRIVING', 'WALKING', 'BICYCLING', 'TRANSIT']).default('DRIVING'),
  avoidHighways: z.boolean().default(false),
  avoidTolls: z.boolean().default(false),
});

// ============================================
// VAPI Call Schemas
// ============================================

export const VAPICallSchema = z.object({
  phoneNumber: z.string().regex(
    /^\+?[1-9]\d{1,14}$/,
    'Invalid E.164 phone number format'
  ),
  assistantId: z.string().uuid(),
  metadata: z.record(SafeString()).optional(),
  voicemailDetection: z.boolean().default(true),
  maxDuration: z.number().min(1).max(3600).optional(), // seconds
});

export const VAPIMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: SafeString(1, 4000),
  timestamp: z.string().datetime().optional(),
});

// ============================================
// OpenAI Assistant Schemas
// ============================================

export const OpenAIMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: SafeString(1, 4000),
  threadId: z.string().optional(),
});

export const OpenAICompletionSchema = z.object({
  messages: z.array(OpenAIMessageSchema).min(1).max(100),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(4000).default(1000),
  topP: z.number().min(0).max(1).default(1),
  frequencyPenalty: z.number().min(-2).max(2).default(0),
  presencePenalty: z.number().min(-2).max(2).default(0),
});

// ============================================
// Supabase Query Schemas
// ============================================

export const SupabaseFilterSchema = z.object({
  column: SafeStringWithRegex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Invalid column name'),
  operator: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'in', 'is']),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(z.union([z.string(), z.number()])),
  ]),
});

export const SupabaseQuerySchema = z.object({
  table: SafeStringWithRegex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Invalid table name'),
  select: SafeStringWithRegex(/^[a-zA-Z0-9_,\s*()]*$/, 'Invalid select clause').optional(),
  filters: z.array(SupabaseFilterSchema).max(10).optional(),
  orderBy: z.object({
    column: SafeStringWithRegex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Invalid column name'),
    ascending: z.boolean().default(true),
  }).optional(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
});

// ============================================
// User Input Schemas
// ============================================

export const UserProfileUpdateSchema = z.object({
  name: SafeString(1, 100).optional(),
  email: SafeEmail.optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  company: SafeString(0, 100).optional(),
  role: z.enum(['admin', 'agent', 'client']).optional(),
  metadata: z.record(SafeString()).optional(),
});

export const ClientCreateSchema = z.object({
  name: SafeString(1, 100),
  email: SafeEmail,
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  company: SafeString(0, 100).optional(),
  address: SafeString(0, 500).optional(),
  notes: SafeString(0, 2000).optional(),
  tags: z.array(SafeString(0, 50)).max(20).optional(),
});

export const InterventionCreateSchema = z.object({
  clientId: z.string().uuid(),
  type: z.enum(['urgence', 'entretien', 'installation', 'reparation']),
  description: SafeString(1, 2000),
  scheduledAt: z.string().datetime(),
  duration: z.number().min(15).max(480), // minutes
  address: SafeString(0, 500),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assignedTo: z.string().uuid().optional(),
});

// ============================================
// File Upload Schemas
// ============================================

export const FileUploadSchema = z.object({
  filename: SafeStringWithRegex(/^[a-zA-Z0-9_\-.]+$/, 'Invalid filename'),
  mimetype: z.enum([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/json',
  ]),
  size: z.number().min(1).max(10485760), // 10MB max
  content: z.instanceof(ArrayBuffer).optional(), // For validation of actual content
});

// ============================================
// Search and Filter Schemas
// ============================================

export const SearchQuerySchema = z.object({
  query: SafeString(1, 200),
  filters: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  page: z.number().min(1).default(1),
  perPage: z.number().min(1).max(100).default(20),
  sortBy: SafeStringWithRegex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Invalid sort field').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// ============================================
// Webhook Validation Schemas
// ============================================

export const WebhookPayloadSchema = z.object({
  event: SafeString(0, 100),
  timestamp: z.string().datetime(),
  signature: z.string().regex(/^[a-fA-F0-9]{64}$/), // SHA256 hex
  data: z.record(z.unknown()),
});

// ============================================
// Validation Utilities
// ============================================

/**
 * Validate input against schema and return sanitized data
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Create a validated API function wrapper
 */
export function createValidatedFunction<TInput, TOutput>(
  schema: z.ZodSchema<TInput>,
  fn: (input: TInput) => Promise<TOutput>
) {
  return async (input: unknown): Promise<TOutput> => {
    const validation = validateInput(schema, input);
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    return fn(validation.data);
  };
}

/**
 * SQL Injection Prevention
 * Additional layer for database queries
 */
export function sanitizeSQL(value: string): string {
  // Remove common SQL injection patterns
  return value
    .replace(/;/g, '') // Remove statement terminators
    .replace(/--/g, '') // Remove comments
    .replace(/\/\*/g, '') // Remove multi-line comments
    .replace(/\*\//g, '')
    .replace(/\bunion\b/gi, '') // Remove UNION keyword
    .replace(/\bselect\b/gi, '') // Remove SELECT keyword (when not expected)
    .replace(/\bdrop\b/gi, '') // Remove DROP keyword
    .replace(/\binsert\b/gi, '') // Remove INSERT keyword
    .replace(/\bupdate\b/gi, '') // Remove UPDATE keyword
    .replace(/\bdelete\b/gi, '') // Remove DELETE keyword
    .replace(/\bexec\b/gi, '') // Remove EXEC keyword
    .replace(/\bexecute\b/gi, '') // Remove EXECUTE keyword
    .trim();
}

/**
 * XSS Prevention
 * HTML entity encoding for display
 */
export function encodeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}