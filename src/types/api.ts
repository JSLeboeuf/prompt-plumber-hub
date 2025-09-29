// API Types Definition File
// This file provides proper TypeScript types to replace 'any' usage

export interface APIResponse<T = unknown> {
  data?: T;
  error?: APIErrorData;
  success: boolean;
}

export interface APIErrorData {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

// Call-related types
export interface CallData {
  id: string;
  phoneNumber: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  transcript?: string;
  priority: CallPriority;
  status: CallStatus;
  recordingUrl?: string;
  metadata: CallMetadata;
}

export type CallPriority = 'P1' | 'P2' | 'P3' | 'P4';
export type CallStatus = 'completed' | 'in_progress' | 'failed' | 'cancelled';

export interface CallMetadata {
  [key: string]: unknown;
  userAgent?: string;
  ipAddress?: string;
  tags?: string[];
}

// Lead-related types
export interface LeadData {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  status: LeadStatus;
  source?: string;
  created_at: string;
  updated_at: string;
  metadata: LeadMetadata;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

export interface LeadMetadata {
  [key: string]: unknown;
  score?: number;
  notes?: string;
  tags?: string[];
}

// Analytics types
export interface AnalyticsData {
  totalCalls: number;
  todayCalls: number;
  totalLeads: number;
  conversionRate: number;
  metrics: MetricData[];
  timeRange: TimeRange;
}

export interface MetricData {
  name: string;
  value: number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface TimeRange {
  start: Date;
  end: Date;
  period: 'day' | 'week' | 'month' | 'year';
}

// Settings types
export interface SettingsData {
  constraints: ConstraintConfig[];
  pricing: PricingConfig;
  prompts: PromptConfig;
  webhooks: WebhookConfig;
}

export interface ConstraintConfig {
  id: string;
  name: string;
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'array';
}

export interface PricingConfig {
  [key: string]: unknown;
  baseRate?: number;
  minimumCharge?: number;
  currency?: string;
}

export interface PromptConfig {
  [key: string]: unknown;
  greeting?: string;
  farewell?: string;
  errorMessage?: string;
}

export interface WebhookConfig {
  url?: string;
  events?: string[];
  secret?: string;
  timeout?: number;
}

// Connection test types
export interface ConnectionTestResult {
  backend: boolean;
  supabase: boolean;
  timestamp: Date;
  details?: ConnectionDetails;
}

export interface ConnectionDetails {
  backendUrl?: string;
  supabaseProject?: string;
  latency?: number;
  error?: string;
}

// Form data types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  message: string;
  subject?: string;
}

// API service function types
export type APIServiceFunction<TParams = unknown, TReturn = unknown> = (
  params: TParams
) => Promise<APIResponse<TReturn>>;

export type APIServiceVoidFunction<TParams = unknown> = (
  params: TParams
) => Promise<APIResponse<void>>;

// Generic fetch types
export interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  baseURL?: string;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Error handling
export class APIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Event types for real-time subscriptions
export interface RealtimeEvent<T = unknown> {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  data: T;
  old?: T;
  timestamp: Date;
}

export type RealtimeCallback<T = unknown> = (event: RealtimeEvent<T>) => void;

// Filter types for data queries
export interface DataFilter {
  [key: string]: FilterValue;
}

export type FilterValue =
  | string
  | number
  | boolean
  | Date
  | FilterOperator
  | FilterValue[];

export interface FilterOperator {
  gte?: string | number | Date;
  lte?: string | number | Date;
  gt?: string | number | Date;
  lt?: string | number | Date;
  in?: FilterValue[];
  not?: FilterValue;
  like?: string;
  ilike?: string;
}

// Service response transformer types
export type ResponseTransformer<TInput = unknown, TOutput = unknown> = (
  input: TInput
) => TOutput;

// Generic service interface
export interface BaseService {
  get<T = unknown>(endpoint: string, options?: FetchOptions): Promise<APIResponse<T>>;
  post<T = unknown>(endpoint: string, data: unknown, options?: FetchOptions): Promise<APIResponse<T>>;
  put<T = unknown>(endpoint: string, data: unknown, options?: FetchOptions): Promise<APIResponse<T>>;
  delete<T = unknown>(endpoint: string, options?: FetchOptions): Promise<APIResponse<T>>;
  patch<T = unknown>(endpoint: string, data: unknown, options?: FetchOptions): Promise<APIResponse<T>>;
}