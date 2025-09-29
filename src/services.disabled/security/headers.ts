/**
 * Security Headers Configuration
 * Implements CSP, HSTS, and other security headers
 */

import { logger } from '@/lib/logger';

// Content Security Policy directives
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for React development - remove in production
    "'unsafe-eval'", // Required for development - remove in production
    'https://apis.google.com', // Google Maps
    'https://maps.googleapis.com',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for styled components
    'https://fonts.googleapis.com',
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https://*.googleapis.com',
    'https://*.gstatic.com',
    'https://*.supabase.co',
  ],
  'connect-src': [
    "'self'",
    'https://*.supabase.co',
    'wss://*.supabase.co',
    'https://api.vapi.ai',
    'https://api.openai.com',
    'https://maps.googleapis.com',
  ],
  'frame-src': [
    "'self'",
    'https://maps.google.com',
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': [],
};

/**
 * Generate CSP header string
 */
export function generateCSP(): string {
  const isProduction = import.meta.env.PROD;

  const directives = { ...CSP_DIRECTIVES };

  // Remove unsafe-inline and unsafe-eval in production
  if (isProduction) {
    directives['script-src'] = directives['script-src'].filter(
      src => src !== "'unsafe-inline'" && src !== "'unsafe-eval'"
    );
  }

  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) return key;
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  // Content Security Policy
  'Content-Security-Policy': generateCSP(),

  // Strict Transport Security (HSTS)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // XSS Protection (legacy browsers)
  'X-XSS-Protection': '1; mode=block',

  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions Policy (formerly Feature Policy)
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=(self)',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
  ].join(', '),
};

/**
 * Apply security headers to the document
 * Note: This only works for meta tags, not all headers
 */
export function applySecurityHeaders(): void {
  // CSP can be set as meta tag
  const cspMeta = document.createElement('meta');
  cspMeta.httpEquiv = 'Content-Security-Policy';
  cspMeta.content = generateCSP();
  document.head.appendChild(cspMeta);

  // Referrer policy can be set as meta tag
  const referrerMeta = document.createElement('meta');
  referrerMeta.name = 'referrer';
  referrerMeta.content = 'strict-origin-when-cross-origin';
  document.head.appendChild(referrerMeta);

  logger.info('Security headers applied via meta tags');
}

/**
 * Middleware for adding security headers to fetch requests
 */
export function withSecurityHeaders(
  url: string | URL,
  options: RequestInit = {}
): RequestInit {
  const secureHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  };

  return {
    ...options,
    headers: {
      ...secureHeaders,
      ...options.headers,
    },
  };
}

/**
 * Validate response headers for security
 */
export function validateResponseHeaders(headers: Headers): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check for security headers
  if (!headers.get('x-content-type-options')) {
    issues.push('Missing X-Content-Type-Options header');
  }

  if (!headers.get('x-frame-options')) {
    issues.push('Missing X-Frame-Options header');
  }

  // Check for sensitive information leakage
  const serverHeader = headers.get('server');
  if (serverHeader && (serverHeader.includes('/') || serverHeader.includes('version'))) {
    issues.push('Server header exposes version information');
  }

  const poweredBy = headers.get('x-powered-by');
  if (poweredBy) {
    issues.push('X-Powered-By header should be removed');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Create Vite plugin for security headers (for vite.config.ts)
 */
import type { ServerRequest, ServerResponse, NextFunction } from '@/types/api.types';

export const viteSecurityHeaders = {
  name: 'security-headers',
  configureServer(server: {
    middlewares: {
      use: (middleware: (req: ServerRequest, res: ServerResponse, next: NextFunction) => void) => void;
    };
  }) {
    server.middlewares.use((_req: ServerRequest, res: ServerResponse, next: NextFunction) => {
      // Apply security headers to all responses
      Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      next();
    });
  },
  configurePreviewServer(server: {
    middlewares: {
      use: (middleware: (req: ServerRequest, res: ServerResponse, next: NextFunction) => void) => void;
    };
  }) {
    server.middlewares.use((_req: ServerRequest, res: ServerResponse, next: NextFunction) => {
      // Apply security headers to preview server
      Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      next();
    });
  },
};

/**
 * Subresource Integrity (SRI) hash generator
 */
export async function generateSRIHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-384', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashBase64 = btoa(String.fromCharCode(...hashArray));
  return `sha384-${hashBase64}`;
}

/**
 * Add SRI to script tags
 */
export async function addSRIToScripts(): Promise<void> {
  const scripts = document.querySelectorAll('script[src]');

  for (const script of scripts) {
    const src = script.getAttribute('src');
    if (!src || src.startsWith('http')) continue; // Skip external scripts

    try {
      const response = await fetch(src);
      const content = await response.text();
      const sri = await generateSRIHash(content);
      script.setAttribute('integrity', sri);
      script.setAttribute('crossorigin', 'anonymous');
    } catch (error) {
      logger.warn('Failed to add SRI to script', { src, error });
    }
  }
}