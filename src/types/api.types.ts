/**
 * API Type Definitions
 * Centralized type definitions for API requests and responses
 */

// ============================================
// Base API Types
// ============================================

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  message?: string;
  error?: ApiError;
  metadata?: ApiMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode?: number;
  retryable?: boolean;
}

export interface ApiMetadata {
  timestamp: number;
  requestId?: string;
  version?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  perPage: number;
  total: number;
  hasMore: boolean;
}

// ============================================
// Request Types
// ============================================

export interface ApiRequest<T = unknown> {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: T;
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
}

export interface ApiQueryOptions {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  filters?: Record<string, unknown>;
  include?: string[];
  fields?: string[];
}

// ============================================
// Supabase Types
// ============================================

export interface SupabaseQueryBuilder<T = unknown> {
  select: (columns?: string) => SupabaseQueryBuilder<T>;
  filter: (column: string, operator: string, value: unknown) => SupabaseQueryBuilder<T>;
  eq: (column: string, value: unknown) => SupabaseQueryBuilder<T>;
  neq: (column: string, value: unknown) => SupabaseQueryBuilder<T>;
  gt: (column: string, value: unknown) => SupabaseQueryBuilder<T>;
  gte: (column: string, value: unknown) => SupabaseQueryBuilder<T>;
  lt: (column: string, value: unknown) => SupabaseQueryBuilder<T>;
  lte: (column: string, value: unknown) => SupabaseQueryBuilder<T>;
  like: (column: string, pattern: string) => SupabaseQueryBuilder<T>;
  ilike: (column: string, pattern: string) => SupabaseQueryBuilder<T>;
  in: (column: string, values: unknown[]) => SupabaseQueryBuilder<T>;
  or: (filter: string) => SupabaseQueryBuilder<T>;
  order: (column: string, options?: { ascending?: boolean }) => SupabaseQueryBuilder<T>;
  limit: (count: number) => SupabaseQueryBuilder<T>;
  range: (from: number, to: number) => SupabaseQueryBuilder<T>;
  single: () => Promise<T>;
  execute: () => Promise<{ data: T[]; error: ApiError | null }>;
}

// Enhanced Supabase query builder type that matches actual Supabase client
export type SupabaseQuery<T = unknown> = SupabaseQueryBuilder<T>;

export interface SupabaseResponse<T = unknown> {
  data: T | T[] | null;
  error: {
    message: string;
    details?: string;
    hint?: string;
    code?: string;
  } | null;
  count?: number;
  status?: number;
  statusText?: string;
}

// ============================================
// External Service Types
// ============================================

export interface VAPIResponse {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  phoneNumber: string;
  assistantId: string;
  duration?: number;
  cost?: number;
  transcript?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface GoogleMapsGeocodeResponse {
  results: Array<{
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
      location_type: string;
      viewport: {
        northeast: { lat: number; lng: number };
        southwest: { lat: number; lng: number };
      };
    };
    place_id: string;
    types: string[];
  }>;
  status: 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST';
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant' | 'user' | 'system';
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ============================================
// WebSocket Types
// ============================================

export interface WebSocketMessage<T = unknown> {
  event: string;
  type: 'broadcast' | 'presence' | 'postgres_changes';
  payload: T;
  timestamp?: number;
  ref?: string;
}

export interface RealtimeSubscription {
  channel: string;
  event: string;
  callback: (payload: unknown) => void;
  unsubscribe: () => void;
}

// Specific WebSocket message types
export interface VAPIWebSocketMessage {
  event: 'call_start' | 'call_end' | 'transcription' | 'error';
  data: {
    callId?: string;
    phoneNumber?: string;
    status?: string;
    transcript?: string;
    error?: string;
  };
}

export interface AlertWebSocketMessage {
  type: 'emergency' | 'info' | 'warning';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// Realtime subscription payload types
export interface RealtimeInsertPayload<T = Record<string, unknown>> {
  eventType: 'INSERT';
  new: T;
  old: null;
  schema: string;
  table: string;
}

export interface RealtimeUpdatePayload<T = Record<string, unknown>> {
  eventType: 'UPDATE';
  new: T;
  old: T;
  schema: string;
  table: string;
}

export interface RealtimeDeletePayload<T = Record<string, unknown>> {
  eventType: 'DELETE';
  new: null;
  old: T;
  schema: string;
  table: string;
}

export type RealtimePayload<T = Record<string, unknown>> =
  | RealtimeInsertPayload<T>
  | RealtimeUpdatePayload<T>
  | RealtimeDeletePayload<T>;

// ============================================
// Form Data Types
// ============================================

export interface FormSubmitEvent<T = Record<string, unknown>> extends Event {
  currentTarget: HTMLFormElement;
  preventDefault: () => void;
  formData?: T;
}

export interface FileUploadEvent extends Event {
  target: HTMLInputElement & { files: FileList | null };
}

// ============================================
// Validation Types
// ============================================

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: string[] };

export interface ValidationSchema {
  validate: <T>(data: unknown) => ValidationResult<T>;
  parse: <T>(data: unknown) => T;
  safeParse: <T>(data: unknown) => ValidationResult<T>;
}

// ============================================
// Type Guards
// ============================================

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}

export function isSupabaseError(error: unknown): error is SupabaseResponse['error'] {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as SupabaseResponse['error'])?.message === 'string'
  );
}

export function isApiResponse<T>(response: unknown): response is ApiResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'data' in response &&
    'status' in response
  );
}

// ============================================
// Service & Webhook Types
// ============================================

export interface WebhookClientData {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  metadata?: Record<string, unknown>;
}

export interface WebhookCallData {
  id: string;
  phoneNumber: string;
  direction: 'inbound' | 'outbound';
  status: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface WebhookInterventionData {
  id: string;
  clientId: string;
  type: string;
  status: string;
  scheduledAt: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface WebhookFeedbackData {
  id: string;
  rating: number;
  comment?: string;
  clientId?: string;
  interventionId?: string;
  metadata?: Record<string, unknown>;
}

export interface BatchOperation {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  data?: Record<string, unknown>;
  id?: string;
}

export interface HttpRequestOptions {
  timeout?: number;
  retries?: number;
  validateResponse?: (data: unknown) => boolean;
  headers?: Record<string, string>;
}

export interface CallContext {
  clientId?: string;
  campaignId?: string;
  metadata?: Record<string, unknown>;
  priority?: 'low' | 'normal' | 'high';
}

// ============================================
// Utility Types
// ============================================

export type AsyncFunction<T = unknown, R = unknown> = (args: T) => Promise<R>;
export type EventHandler<T = Event> = (event: T) => void | Promise<void>;
export type Callback<T = unknown> = (data: T) => void;
export type ErrorCallback = (error: Error | ApiError) => void;

// Make certain properties optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Make certain properties required
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

// Extract the type of array elements
export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

// Server middleware types
export interface ServerRequest {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
}

export interface ServerResponse {
  setHeader: (name: string, value: string) => void;
  writeHead?: (status: number, headers?: Record<string, string>) => void;
  end?: (data?: string) => void;
}

export type NextFunction = () => void;
export type MiddlewareFunction = (req: ServerRequest, res: ServerResponse, next: NextFunction) => void;