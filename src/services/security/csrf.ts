import { logger } from '@/lib/logger';

/**
 * CSRF Protection Service
 * Implements double-submit cookie pattern for CSRF protection
 */

class CSRFProtection {
  private static instance: CSRFProtection;
  private tokenStore = new Map<string, { token: string; expiry: number }>();
  private readonly TOKEN_EXPIRY = 3600000; // 1 hour
  private readonly TOKEN_LENGTH = 32;

  private constructor() {
    // Clean expired tokens every 5 minutes
    setInterval(() => this.cleanExpiredTokens(), 300000);
  }

  static getInstance(): CSRFProtection {
    if (!CSRFProtection.instance) {
      CSRFProtection.instance = new CSRFProtection();
    }
    return CSRFProtection.instance;
  }

  /**
   * Generate a cryptographically secure CSRF token
   */
  generateToken(): string {
    const array = new Uint8Array(this.TOKEN_LENGTH);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Create and store a new CSRF token for a session
   */
  createToken(sessionId: string): string {
    const token = this.generateToken();
    const expiry = Date.now() + this.TOKEN_EXPIRY;

    this.tokenStore.set(sessionId, { token, expiry });

    // Also set as a secure cookie
    this.setTokenCookie(token);

    // Add to meta tag for AJAX requests
    this.updateMetaTag(token);

    logger.info('CSRF token created', { sessionId, expiry });
    return token;
  }

  /**
   * Validate a CSRF token
   */
  validateToken(sessionId: string, token: string): boolean {
    const stored = this.tokenStore.get(sessionId);

    if (!stored) {
      logger.warn('CSRF validation failed: No token for session', { sessionId });
      return false;
    }

    if (Date.now() > stored.expiry) {
      logger.warn('CSRF validation failed: Token expired', { sessionId });
      this.tokenStore.delete(sessionId);
      return false;
    }

    if (stored.token !== token) {
      logger.warn('CSRF validation failed: Token mismatch', { sessionId });
      return false;
    }

    logger.info('CSRF token validated successfully', { sessionId });
    return true;
  }

  /**
   * Set CSRF token as a secure cookie
   */
  private setTokenCookie(token: string): void {
    const isProduction = import.meta.env.PROD;
    const cookieOptions = [
      `csrf_token=${token}`,
      'Path=/',
      'SameSite=Strict',
      `Max-Age=${this.TOKEN_EXPIRY / 1000}`,
      isProduction ? 'Secure' : '',
      'HttpOnly',
    ].filter(Boolean).join('; ');

    document.cookie = cookieOptions;
  }

  /**
   * Update meta tag with CSRF token
   */
  private updateMetaTag(token: string): void {
    let metaTag = document.querySelector('meta[name="csrf-token"]');

    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'csrf-token');
      document.head.appendChild(metaTag);
    }

    metaTag.setAttribute('content', token);
  }

  /**
   * Get CSRF token from cookie
   */
  getTokenFromCookie(): string | null {
    const match = document.cookie.match(/csrf_token=([^;]+)/);
    return match ? match[1] : null;
  }

  /**
   * Get CSRF token from meta tag
   */
  getTokenFromMeta(): string | null {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag ? metaTag.getAttribute('content') : null;
  }

  /**
   * Clean expired tokens from memory
   */
  private cleanExpiredTokens(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, data] of this.tokenStore.entries()) {
      if (now > data.expiry) {
        this.tokenStore.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info('Cleaned expired CSRF tokens', { count: cleaned });
    }
  }

  /**
   * Refresh token for a session
   */
  refreshToken(sessionId: string): string | null {
    const stored = this.tokenStore.get(sessionId);

    if (!stored || Date.now() > stored.expiry) {
      return this.createToken(sessionId);
    }

    // Extend expiry
    stored.expiry = Date.now() + this.TOKEN_EXPIRY;
    logger.info('CSRF token refreshed', { sessionId });
    return stored.token;
  }

  /**
   * Remove token for a session (on logout)
   */
  removeToken(sessionId: string): void {
    this.tokenStore.delete(sessionId);

    // Clear cookie
    document.cookie = 'csrf_token=; Path=/; Max-Age=0; SameSite=Strict';

    // Clear meta tag
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      metaTag.setAttribute('content', '');
    }

    logger.info('CSRF token removed', { sessionId });
  }
}

// Export singleton instance
export const csrfProtection = CSRFProtection.getInstance();

/**
 * CSRF Middleware for fetch requests
 */
export function withCSRFProtection(
  url: string | URL,
  options: RequestInit = {}
): RequestInit {
  const token = csrfProtection.getTokenFromMeta() || csrfProtection.getTokenFromCookie();

  if (!token) {
    logger.warn('No CSRF token available for request', { url });
  }

  return {
    ...options,
    headers: {
      ...options.headers,
      'X-CSRF-Token': token || '',
    },
  };
}

/**
 * Hook for React components to use CSRF protection
 */
export function useCSRFToken(): {
  token: string | null;
  createToken: () => string;
  validateToken: (token: string) => boolean;
} {
  const sessionId = crypto.randomUUID(); // In production, use actual session ID

  return {
    token: csrfProtection.getTokenFromMeta(),
    createToken: () => csrfProtection.createToken(sessionId),
    validateToken: (token: string) => csrfProtection.validateToken(sessionId, token),
  };
}