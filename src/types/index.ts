/**
 * Centralized Type Exports
 * Single source of truth for all TypeScript type definitions
 */

// API Types
export * from './api.types';
export * from './models.types';

// Re-export commonly used types for convenience
export type {
  // API
  ApiResponse,
  ApiError,
  ApiRequest,
  SupabaseResponse,
  WebSocketMessage,

  // Models
  User,
  UserRole,
  Client,
  Call,
  Intervention,
  DashboardMetrics,
  SupportTicket,

  // Common
  ValidationResult,
  AsyncFunction,
  EventHandler,
} from './api.types';

// Type utilities
export {
  isApiError,
  isSupabaseError,
  isApiResponse,
  isUser,
  isClient,
  isCall,
  isIntervention,
} from './models.types';

/**
 * Global type augmentations
 */
declare global {
  // Extend Window interface if needed
  interface Window {
    __APP_VERSION__?: string;
    __DEBUG__?: boolean;
  }

  // Extend process.env types
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
    }
  }
}

/**
 * Module augmentations
 */
declare module '*.svg' {
  const content: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}