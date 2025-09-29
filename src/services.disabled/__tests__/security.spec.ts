import { describe, it, expect, beforeEach } from 'vitest';
import { validateInput, sanitizeSQL, encodeHTML, GeocodeAddressSchema, WaypointSchema } from '../validation/schemas';
import { csrfProtection } from '../security/csrf';
import { generateCSP, validateResponseHeaders } from '../security/headers';

describe('Security - Input Validation', () => {
  it('should validate and sanitize geocode address input', () => {
    const input = {
      address: '<script>alert("xss")</script>123 Main St',
      country: 'US',
    };

    const result = validateInput(GeocodeAddressSchema, input);
    expect(result.success).toBe(true);
    if (result.success) {
      // The sanitization removes < > characters, not the entire script tag
      expect(result.data.address).toBe('scriptalert(xss)/script123 Main St');
      expect(result.data.country).toBe('US');
    }
  });

  it('should reject invalid waypoint coordinates', () => {
    const invalidWaypoint = {
      lat: 91, // Invalid - exceeds 90
      lng: -181, // Invalid - exceeds -180
    };

    const result = validateInput(WaypointSchema, invalidWaypoint);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toContain('lat: Number must be less than or equal to 90');
      expect(result.errors).toContain('lng: Number must be greater than or equal to -180');
    }
  });

  it('should sanitize SQL injection attempts', () => {
    const maliciousInput = "'; DROP TABLE users; --";
    const sanitized = sanitizeSQL(maliciousInput);
    expect(sanitized).not.toContain('DROP');
    expect(sanitized).not.toContain(';');
    expect(sanitized).not.toContain('--');
  });

  it('should encode HTML to prevent XSS', () => {
    const maliciousHTML = '<script>alert("xss")</script>';
    const encoded = encodeHTML(maliciousHTML);
    expect(encoded).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
  });
});

describe('Security - CSRF Protection', () => {
  beforeEach(() => {
    // Clear document cookies
    document.cookie = 'csrf_token=; Path=/; Max-Age=0';
    // Clear meta tags
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
      metaTag.remove();
    }
  });

  it('should generate cryptographically secure CSRF token', () => {
    const token = csrfProtection.generateToken();
    expect(token).toHaveLength(64); // 32 bytes in hex
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should create and validate CSRF token for session', () => {
    const sessionId = 'test-session-123';
    const token = csrfProtection.createToken(sessionId);

    expect(token).toBeTruthy();
    expect(csrfProtection.validateToken(sessionId, token)).toBe(true);
    expect(csrfProtection.validateToken(sessionId, 'invalid-token')).toBe(false);
  });

  it('should set CSRF token in meta tag', () => {
    const sessionId = 'test-session-456';
    const token = csrfProtection.createToken(sessionId);

    // Check meta tag
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    expect(metaTag).toBeTruthy();
    expect(metaTag?.getAttribute('content')).toBe(token);

    // Verify token is stored internally (not in cookie for security)
    const isValid = csrfProtection.validateToken(sessionId, token);
    expect(isValid).toBe(true);
  });

  it('should remove token on logout', () => {
    const sessionId = 'test-session-789';
    csrfProtection.createToken(sessionId);
    csrfProtection.removeToken(sessionId);

    const isValid = csrfProtection.validateToken(sessionId, 'any-token');
    expect(isValid).toBe(false);

    const metaTag = document.querySelector('meta[name="csrf-token"]');
    expect(metaTag?.getAttribute('content')).toBe('');
  });
});

describe('Security - Headers', () => {
  it('should generate proper CSP header', () => {
    const csp = generateCSP();

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain('upgrade-insecure-requests');
  });

  it('should validate response headers for security issues', () => {
    const goodHeaders = new Headers();
    goodHeaders.set('x-content-type-options', 'nosniff');
    goodHeaders.set('x-frame-options', 'DENY');

    const validation = validateResponseHeaders(goodHeaders);
    expect(validation.valid).toBe(true);
    expect(validation.issues).toHaveLength(0);
  });

  it('should detect missing security headers', () => {
    const badHeaders = new Headers();
    badHeaders.set('server', 'Apache/2.4.41');
    badHeaders.set('x-powered-by', 'PHP/7.4.3');

    const validation = validateResponseHeaders(badHeaders);
    expect(validation.valid).toBe(false);
    expect(validation.issues).toContain('Missing X-Content-Type-Options header');
    expect(validation.issues).toContain('Missing X-Frame-Options header');
    expect(validation.issues).toContain('Server header exposes version information');
    expect(validation.issues).toContain('X-Powered-By header should be removed');
  });

  it('should include necessary CSP directives for Supabase', () => {
    const csp = generateCSP();

    expect(csp).toContain('https://*.supabase.co');
    expect(csp).toContain('wss://*.supabase.co');
  });
});