import { z } from 'zod';
import logger from '@/lib/logger';

/**
 * Environment variable validation schema
 * Ensures all required environment variables are present and valid
 */
const envSchema = z.object({
  // Supabase Configuration
  VITE_SUPABASE_URL: z.string().url().startsWith('https://'),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),

  // API Configuration (Optional)
  VITE_API_BASE_URL: z.string().url().optional(),
  VITE_VAPI_WEBHOOK_URL: z.string().url().optional(),
  VITE_VAPI_API_URL: z.string().url().optional(),
  VITE_VAPI_PUBLIC_KEY: z.string().optional(),
  VITE_VAPI_PRIVATE_KEY: z.string().optional(),

  // Google Maps (Optional)
  VITE_GOOGLE_MAPS_API_KEY: z.string().optional(),

  // OpenAI (Optional)
  VITE_OPENAI_API_KEY: z.string().optional(),
  VITE_OPENAI_ASSISTANT_ID: z.string().optional(),

  // Application Mode
  MODE: z.enum(['development', 'production', 'test']).default('development'),
  DEV: z.boolean().optional(),
  PROD: z.boolean().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables at runtime
 * Throws an error if required variables are missing or invalid
 */
export function validateEnv(): Env {
  try {
    const env = envSchema.parse(import.meta.env);

    // Additional validation for production
    if (env.MODE === 'production') {
      if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_PUBLISHABLE_KEY) {
        throw new Error('Supabase configuration is required in production');
      }

      // Check for development values in production
      if (env.VITE_SUPABASE_URL.includes('localhost')) {
        throw new Error('Production cannot use localhost URLs');
      }

      // Warn about missing optional configs
      if (!env.VITE_GOOGLE_MAPS_API_KEY) {
        logger.warn('Google Maps API key not configured');
      }
    }

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(e => e.path.join('.')).join(', ');
      const baseContext = {
        missingVars,
        required: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_PUBLISHABLE_KEY'],
      } as const;

      if (import.meta.env.DEV) {
        logger.error('Environment validation failed', {
          ...baseContext,
          details: error.errors,
        });
      } else {
        logger.error('Environment validation failed', baseContext);
      }
    }
    throw error;
  }
}

/**
 * Validated environment variables
 * Use this instead of import.meta.env directly
 */
export const env = validateEnv();

/**
 * Helper to check if a feature is enabled based on environment
 */
export function isFeatureEnabled(feature: 'maps' | 'openai' | 'vapi'): boolean {
  switch (feature) {
    case 'maps':
      return Boolean(env.VITE_GOOGLE_MAPS_API_KEY);
    case 'openai':
      return Boolean(env.VITE_OPENAI_API_KEY && env.VITE_OPENAI_ASSISTANT_ID);
    case 'vapi':
      return Boolean(env.VITE_VAPI_PUBLIC_KEY);
    default:
      return false;
  }
}

/**
 * Get API configuration with defaults
 */
export function getApiConfig() {
  return {
    baseUrl: env.VITE_API_BASE_URL || 'http://localhost:8080',
    supabase: {
      url: env.VITE_SUPABASE_URL,
      anonKey: env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    vapi: {
      apiUrl: env.VITE_VAPI_API_URL || 'https://api.vapi.ai',
      webhookUrl: env.VITE_VAPI_WEBHOOK_URL,
      publicKey: env.VITE_VAPI_PUBLIC_KEY,
    },
    googleMaps: {
      apiKey: env.VITE_GOOGLE_MAPS_API_KEY,
    },
    openai: {
      apiKey: env.VITE_OPENAI_API_KEY,
      assistantId: env.VITE_OPENAI_ASSISTANT_ID,
    },
  };
}

export default env;
