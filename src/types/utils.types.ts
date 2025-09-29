/**
 * Utility types for handling strict TypeScript mode
 */

// Helper for exact optional properties
export type ExactOptional<T, K extends keyof T> = Omit<T, K> & {
  [P in K]?: T[P];
};

// Helper for making all properties explicitly undefined or their type
export type StrictOptional<T> = {
  [K in keyof T]: T[K] | undefined;
};

// Helper for filters that need exact types
export type CRMFilters = {
  search?: string;
  status?: string[];
  priority?: string[];
  city?: string;
  serviceType?: string;
  technician?: string;
  dateFrom?: string;
  dateTo?: string;
};

// Type-safe error wrapper
export type SafeError = Error | { message: string; name?: string };

// React Query meta type that's compatible
export type QueryMeta = Record<string, unknown>;

// Generic debounced value type
export type DebouncedValue<T> = T;