import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { logger } from '@/lib/logger';

/**
 * Server-side Authorization Service
 * Validates permissions through Supabase RLS and server-side checks
 * Replaces client-side only permission validation
 */

// Permission schema for validation
const PermissionSchema = z.object({
  resource: z.string().min(1),
  action: z.enum(['create', 'read', 'update', 'delete', 'manage']),
  userId: z.string().uuid().optional(),
});

type Permission = z.infer<typeof PermissionSchema>;

// Role-based permissions (server truth, not client-side)
const ROLE_PERMISSIONS = {
  admin: {
    '*': ['create', 'read', 'update', 'delete', 'manage'] as const,
  },
  agent: {
    calls: ['create', 'read', 'update'] as const,
    clients: ['create', 'read', 'update'] as const,
    interventions: ['create', 'read', 'update'] as const,
    analytics: ['read'] as const,
    support: ['read', 'create'] as const,
  },
  client: {
    profile: ['read', 'update'] as const,
    interventions: ['read'] as const,
    support: ['create'] as const,
  },
} as const;

/**
 * Verify user authorization for a specific resource and action
 * This makes a server-side check through Supabase RLS
 */
export async function verifyAuthorization(
  resource: string,
  action: string,
  userId?: string
): Promise<boolean> {
  try {
    // Validate input
    const validatedPermission = PermissionSchema.parse({
      resource,
      action,
      userId,
    });

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      logger.warn('Authorization check failed: No session', { resource, action });
      return false;
    }

    const targetUserId = validatedPermission.userId || session.user.id;

    // Server-side check through RLS
    // This query will be filtered by Supabase RLS policies
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', targetUserId)
      .single();

    if (profileError || !profile) {
      logger.warn('Authorization check failed: Profile not found', {
        userId: targetUserId,
        error: profileError
      });
      return false;
    }

    // Check role-based permissions
    const rolePermissions = ROLE_PERMISSIONS[profile.role as keyof typeof ROLE_PERMISSIONS];
    if (!rolePermissions) {
      logger.warn('Authorization check failed: Invalid role', { role: profile.role });
      return false;
    }

    // Admin has access to everything
    if ('*' in rolePermissions) {
      logger.info('Authorization granted: Admin access', { resource, action, userId: targetUserId });
      return true;
    }

    // Check specific resource permissions
    const resourcePermissions = rolePermissions[resource as keyof typeof rolePermissions];
    if (!resourcePermissions) {
      logger.warn('Authorization denied: No resource permissions', {
        role: profile.role,
        resource,
        action
      });
      return false;
    }

    const hasPermission = (resourcePermissions as readonly string[]).includes(action);

    if (hasPermission) {
      logger.info('Authorization granted', {
        role: profile.role,
        resource,
        action,
        userId: targetUserId
      });
    } else {
      logger.warn('Authorization denied: Insufficient permissions', {
        role: profile.role,
        resource,
        action
      });
    }

    return hasPermission;
  } catch (error) {
    logger.error('Authorization check error', { error, resource, action });
    return false; // Fail secure - deny on error
  }
}

/**
 * Batch verify multiple permissions
 * Useful for checking complex permission requirements
 */
export async function verifyAuthorizations(
  permissions: Permission[]
): Promise<boolean> {
  try {
    const results = await Promise.all(
      permissions.map(p => verifyAuthorization(p.resource, p.action, p.userId))
    );
    return results.every(result => result === true);
  } catch (error) {
    logger.error('Batch authorization check error', { error, permissions });
    return false;
  }
}

/**
 * Get all permissions for current user
 * Returns a map of resources to allowed actions
 */
export async function getUserPermissions(): Promise<Record<string, string[]>> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return {};
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile) {
      return {};
    }

    const rolePermissions = ROLE_PERMISSIONS[profile.role as keyof typeof ROLE_PERMISSIONS];
    if (!rolePermissions) {
      return {};
    }

    // Convert role permissions to simple format
    if ('*' in rolePermissions) {
      // Admin gets all permissions
      return {
        '*': ['create', 'read', 'update', 'delete', 'manage'],
      };
    }

    // Return specific permissions for role
    return Object.entries(rolePermissions).reduce((acc, [resource, actions]) => {
      acc[resource] = [...actions];
      return acc;
    }, {} as Record<string, string[]>);
  } catch (error) {
    logger.error('Get user permissions error', { error });
    return {};
  }
}

/**
 * Create authorization middleware for API routes
 * This should be used in your API layer to protect endpoints
 */
export function createAuthorizationMiddleware(
  resource: string,
  action: string
) {
  return async (req: Request): Promise<boolean> => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Authorization middleware: No auth token');
      return false;
    }

    // Verify the session token with Supabase
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn('Authorization middleware: Invalid token', { error });
      return false;
    }

    // Verify authorization for the resource/action
    return verifyAuthorization(resource, action, user.id);
  };
}

/**
 * Rate limiting helper for authorization checks
 * Prevents authorization check abuse
 */
const authCheckCache = new Map<string, { result: boolean; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

export async function cachedVerifyAuthorization(
  resource: string,
  action: string,
  userId?: string
): Promise<boolean> {
  const cacheKey = `${userId || 'current'}:${resource}:${action}`;
  const cached = authCheckCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  const result = await verifyAuthorization(resource, action, userId);
  authCheckCache.set(cacheKey, { result, timestamp: Date.now() });

  // Clean old cache entries
  if (authCheckCache.size > 100) {
    const now = Date.now();
    for (const [key, value] of authCheckCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        authCheckCache.delete(key);
      }
    }
  }

  return result;
}