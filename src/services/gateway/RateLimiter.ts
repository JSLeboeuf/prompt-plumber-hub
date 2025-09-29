/**
 * Rate Limiter - Token bucket algorithm implementation
 * Provides sliding window rate limiting with per-client and per-endpoint controls
 */

import { logger } from '@/lib/logger';

export interface RateLimitConfig {
  enabled: boolean;
  windowMs: number;
  maxRequests: number;
  skipSuccessful?: boolean;
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
  maxTokens: number;
  refillRate: number; // tokens per second
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  bucket?: TokenBucket;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout;

  constructor(config: RateLimitConfig) {
    this.config = config;

    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if request is allowed under rate limits
   */
  async isAllowed(clientId: string, endpoint: string): Promise<boolean> {
    if (!this.config.enabled) {
      return true;
    }

    const key = `${clientId}:${endpoint}`;
    const now = Date.now();

    // Get or create rate limit entry
    let entry = this.store.get(key);
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs,
        bucket: this.createTokenBucket()
      };
      this.store.set(key, entry);
    }

    // Check token bucket first (for burst protection)
    if (!this.consumeToken(entry.bucket!)) {
      logger.warn('Rate limit exceeded (burst protection)', {
        clientId,
        endpoint,
        tokens: entry.bucket!.tokens
      });
      return false;
    }

    // Check sliding window
    if (entry.count >= this.config.maxRequests) {
      logger.warn('Rate limit exceeded (window limit)', {
        clientId,
        endpoint,
        count: entry.count,
        limit: this.config.maxRequests,
        windowMs: this.config.windowMs
      });
      return false;
    }

    // Allow request and increment counter
    entry.count++;

    logger.debug('Rate limit check passed', {
      clientId,
      endpoint,
      count: entry.count,
      limit: this.config.maxRequests,
      tokens: entry.bucket!.tokens
    });

    return true;
  }

  /**
   * Get current rate limit status for a client/endpoint
   */
  getStatus(clientId: string, endpoint: string): {
    allowed: boolean;
    count: number;
    limit: number;
    resetTime: number;
    tokens: number;
  } {
    const key = `${clientId}:${endpoint}`;
    const entry = this.store.get(key);
    const now = Date.now();

    if (!entry || now > entry.resetTime) {
      return {
        allowed: true,
        count: 0,
        limit: this.config.maxRequests,
        resetTime: now + this.config.windowMs,
        tokens: this.config.maxRequests
      };
    }

    this.refillTokens(entry.bucket!);

    return {
      allowed: entry.count < this.config.maxRequests && entry.bucket!.tokens > 0,
      count: entry.count,
      limit: this.config.maxRequests,
      resetTime: entry.resetTime,
      tokens: entry.bucket!.tokens
    };
  }

  /**
   * Reset rate limits for a specific client/endpoint
   */
  reset(clientId: string, endpoint?: string): void {
    if (endpoint) {
      const key = `${clientId}:${endpoint}`;
      this.store.delete(key);
      logger.info('Rate limit reset for endpoint', { clientId, endpoint });
    } else {
      // Reset all endpoints for client
      const keysToDelete = Array.from(this.store.keys())
        .filter(key => key.startsWith(`${clientId}:`));

      keysToDelete.forEach(key => this.store.delete(key));
      logger.info('Rate limits reset for client', { clientId, count: keysToDelete.length });
    }
  }

  /**
   * Create a new token bucket for burst protection
   */
  private createTokenBucket(): TokenBucket {
    const refillRate = this.config.maxRequests / (this.config.windowMs / 1000);
    return {
      tokens: this.config.maxRequests,
      lastRefill: Date.now(),
      maxTokens: this.config.maxRequests,
      refillRate
    };
  }

  /**
   * Consume a token from the bucket
   */
  private consumeToken(bucket: TokenBucket): boolean {
    this.refillTokens(bucket);

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refillTokens(bucket: TokenBucket): void {
    const now = Date.now();
    const elapsed = (now - bucket.lastRefill) / 1000; // seconds
    const tokensToAdd = elapsed * bucket.refillRate;

    bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Rate limiter cleanup completed', { cleaned });
    }
  }

  /**
   * Get rate limiter statistics
   */
  getStats(): {
    totalEntries: number;
    activeClients: number;
    topEndpoints: Array<{ endpoint: string; requests: number }>;
  } {
    const endpointCounts = new Map<string, number>();
    const clients = new Set<string>();

    for (const [key, entry] of this.store.entries()) {
      const [clientId, endpoint] = key.split(':');
      clients.add(clientId);

      const current = endpointCounts.get(endpoint) || 0;
      endpointCounts.set(endpoint, current + entry.count);
    }

    const topEndpoints = Array.from(endpointCounts.entries())
      .map(([endpoint, requests]) => ({ endpoint, requests }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10);

    return {
      totalEntries: this.store.size,
      activeClients: clients.size,
      topEndpoints
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}