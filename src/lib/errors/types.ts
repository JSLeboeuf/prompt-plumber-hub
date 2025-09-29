/**
 * Unified Error Types and Interfaces
 * Standardizes error handling across the application
 */

// Base error interface that all app errors should implement
export interface AppError extends Error {
  readonly id: string;
  readonly code: string;
  readonly category: ErrorCategory;
  readonly severity: ErrorSeverity;
  readonly userMessage: string;
  readonly context?: Record<string, unknown>;
  readonly timestamp: string;
  readonly source: string;
  readonly correlationId?: string;
  readonly retryable: boolean;
  readonly retryAfter?: number;
  readonly details?: Record<string, unknown>;
}

// Error categories for classification
export enum ErrorCategory {
  // Client-side errors (4xx equivalent)
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',

  // Server-side errors (5xx equivalent)
  SERVER = 'SERVER',
  DATABASE = 'DATABASE',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',

  // Network and connectivity
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',

  // Application-specific
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  CONFIGURATION = 'CONFIGURATION',
  UNKNOWN = 'UNKNOWN'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',       // User can continue, minor inconvenience
  MEDIUM = 'MEDIUM', // User workflow affected, requires attention
  HIGH = 'HIGH',     // Critical functionality broken
  CRITICAL = 'CRITICAL' // System-wide impact, immediate action required
}

// Error recovery strategies
export enum RecoveryStrategy {
  RETRY = 'RETRY',
  FALLBACK = 'FALLBACK',
  REFRESH = 'REFRESH',
  REDIRECT = 'REDIRECT',
  MANUAL = 'MANUAL',
  NONE = 'NONE'
}

// Error feedback types for UI display
export enum ErrorFeedbackType {
  TOAST = 'TOAST',     // Brief notification
  MODAL = 'MODAL',     // Blocking dialog
  INLINE = 'INLINE',   // Contextual message
  BANNER = 'BANNER',   // Page-level alert
  SILENT = 'SILENT'    // No UI feedback
}

// Error context for tracking and debugging
export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  operation?: string;
  component?: string;
  route?: string;
  timestamp: string;
  userAgent?: string;
  url?: string;
  additionalData?: Record<string, unknown>;
}

// Error recovery options
export interface ErrorRecoveryOptions {
  strategy: RecoveryStrategy;
  maxRetries?: number;
  retryDelay?: number;
  fallbackAction?: () => void | Promise<void>;
  refreshTarget?: string;
  redirectUrl?: string;
  customAction?: {
    label: string;
    action: () => void | Promise<void>;
  };
}

// Error feedback configuration
export interface ErrorFeedbackConfig {
  type: ErrorFeedbackType;
  title?: string;
  message: string;
  details?: string;
  duration?: number; // For toasts
  dismissible?: boolean;
  actions?: Array<{
    label: string;
    action: () => void | Promise<void>;
    variant?: 'primary' | 'secondary' | 'destructive';
  }>;
}

// Error handler configuration
export interface ErrorHandlerConfig {
  enableStackTrace: boolean;
  enableUserFeedback: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  maxRetries: number;
  retryDelay: number;
  enableRecovery: boolean;
  monitoringEndpoint?: string;
  notificationWebhook?: string;
}

// Error monitoring data
export interface ErrorMonitoringData {
  error: AppError;
  context: ErrorContext;
  timestamp: string;
  environment: string;
  version: string;
  sessionId?: string;
  userId?: string;
}

// Standard error codes used throughout the application
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'AUTH_001',
  TOKEN_EXPIRED: 'AUTH_002',
  INSUFFICIENT_PERMISSIONS: 'AUTH_003',
  ACCOUNT_LOCKED: 'AUTH_004',

  // Validation
  REQUIRED_FIELD: 'VAL_001',
  INVALID_FORMAT: 'VAL_002',
  OUT_OF_RANGE: 'VAL_003',
  DUPLICATE_VALUE: 'VAL_004',

  // Business Logic
  INSUFFICIENT_BALANCE: 'BIZ_001',
  OPERATION_NOT_ALLOWED: 'BIZ_002',
  RESOURCE_CONFLICT: 'BIZ_003',
  QUOTA_EXCEEDED: 'BIZ_004',

  // Network & Services
  CONNECTION_FAILED: 'NET_001',
  REQUEST_TIMEOUT: 'NET_002',
  SERVICE_UNAVAILABLE: 'NET_003',
  RATE_LIMITED: 'NET_004',

  // Database
  QUERY_FAILED: 'DB_001',
  CONNECTION_LOST: 'DB_002',
  CONSTRAINT_VIOLATION: 'DB_003',
  TRANSACTION_FAILED: 'DB_004',

  // Configuration
  MISSING_CONFIG: 'CFG_001',
  INVALID_CONFIG: 'CFG_002',
  ENVIRONMENT_ERROR: 'CFG_003',

  // Unknown
  UNEXPECTED_ERROR: 'UNK_001',
  SYSTEM_ERROR: 'UNK_002'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// Predefined user messages for common errors
export const UserMessages = {
  [ErrorCodes.UNAUTHORIZED]: 'Vous devez vous connecter pour accéder à cette fonctionnalité.',
  [ErrorCodes.TOKEN_EXPIRED]: 'Votre session a expiré. Veuillez vous reconnecter.',
  [ErrorCodes.INSUFFICIENT_PERMISSIONS]: 'Vous n\'avez pas les permissions nécessaires pour cette action.',
  [ErrorCodes.CONNECTION_FAILED]: 'Impossible de se connecter au service. Vérifiez votre connexion internet.',
  [ErrorCodes.REQUEST_TIMEOUT]: 'La demande a pris trop de temps. Veuillez réessayer.',
  [ErrorCodes.SERVICE_UNAVAILABLE]: 'Le service est temporairement indisponible. Veuillez réessayer plus tard.',
  [ErrorCodes.RATE_LIMITED]: 'Trop de tentatives. Veuillez attendre avant de réessayer.',
  [ErrorCodes.REQUIRED_FIELD]: 'Ce champ est obligatoire.',
  [ErrorCodes.INVALID_FORMAT]: 'Le format n\'est pas valide.',
  [ErrorCodes.DUPLICATE_VALUE]: 'Cette valeur existe déjà.',
  [ErrorCodes.UNEXPECTED_ERROR]: 'Une erreur inattendue s\'est produite. Veuillez réessayer.'
} as const;