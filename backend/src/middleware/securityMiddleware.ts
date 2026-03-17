/**
 * MIDDLEWARE
 * Request context injection and multi-tenant/RBAC support
 */

import { Request, Response, NextFunction } from "express";
import { RequestContext } from "../types/query.types";

/**
 * Extend Express Request with context
 */
declare global {
  namespace Express {
    interface Request {
      context?: RequestContext;
    }
  }
}

/**
 * Tenant middleware
 * Injects tenant ID from JWT token or headers
 * Critical for multi-tenant isolation
 * 
 * For local development: uses "default-tenant" if no tenantId provided
 * For production: requires explicit tenantId via header or JWT
 */
export function tenantMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  // Extract tenant ID from multiple sources (in priority order)
  const tenantId =
    req.headers["x-tenant-id"] as string ||
    extractTenantFromJWT(req) ||
    req.query.tenantId as string ||
    (process.env.NODE_ENV === "development" ? "default-tenant" : null);

  if (!tenantId) {
    return _res.status(401).json({
      error: {
        code: "TENANT_NOT_FOUND",
        message: "Tenant ID is required (missing x-tenant-id header or JWT)",
      },
    });
  }

  // Initialize context
  if (!req.context) {
    req.context = {};
  }

  req.context.tenantId = tenantId;
  next();
}

/**
 * Auth middleware
 * Injects user info and RBAC permissions
 */
export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  // Extract from JWT token
  const token = extractJWTToken(req);

  if (!token) {
    return _res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Missing or invalid authentication token",
      },
    });
  }

  try {
    // Decode JWT (simplified - use real JWT library in production)
    const payload = decodeJWT(token);

    // Initialize context
    if (!req.context) {
      req.context = {};
    }

    req.context.userId = payload.sub;
    req.context.roles = payload.roles || [];
    req.context.permissions = payload.permissions || [];
    req.context.tenantId = payload.tenantId || req.context.tenantId;

    next();
  } catch (error) {
    return _res.status(401).json({
      error: {
        code: "TOKEN_INVALID",
        message: "Invalid authentication token",
      },
    });
  }
}

/**
 * RBAC middleware
 * Checks if user has required permission
 */
export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userPermissions = req.context?.permissions || [];

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        error: {
          code: "PERMISSION_DENIED",
          message: `Permission "${permission}" required`,
          requiredPermission: permission,
        },
      });
    }

    next();
  };
}

/**
 * Soft delete middleware
 * Injects includeSoftDeleted flag based on permission
 */
export function softDeleteMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  // Initialize context
  if (!req.context) {
    req.context = {};
  }

  // Only admins can see soft-deleted records
  const hasAdminAccess =
    req.context.permissions?.includes("admin") ||
    req.context.roles?.includes("admin");

  req.context.includeSoftDeleted = hasAdminAccess ? true : false;

  next();
}

/**
 * Request ID middleware
 * Adds request ID for tracing
 */
export function requestIdMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  // Initialize context
  if (!req.context) {
    req.context = {};
  }

  req.context.requestId =
    (req.headers["x-request-id"] as string) ||
    generateRequestId();

  next();
}

/**
 * HELPER FUNCTIONS
 */

/**
 * Extract JWT token from request
 */
function extractJWTToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.substring(7);
}

/**
 * Extract tenant from JWT payload
 */
function extractTenantFromJWT(req: Request): string | null {
  const token = extractJWTToken(req);
  if (!token) return null;

  try {
    const payload = decodeJWT(token);
    return payload.tenantId;
  } catch {
    return null;
  }
}

/**
 * Simple JWT decode (without verification)
 * In production, use a proper JWT library with verification!
 */
function decodeJWT(token: string): Record<string, any> {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }

  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64").toString("utf-8")
    );
    return payload;
  } catch {
    throw new Error("Failed to decode JWT payload");
  }
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * MIDDLEWARE COMPOSITION
 * Use this to apply security middleware globally
 * NOTE: authMiddleware is NOT applied globally to allow signup/login without tokens
 */
export function applySecurityMiddleware(app: any) {
  app.use(requestIdMiddleware);
  app.use(tenantMiddleware);
  // authMiddleware is NOT applied here - use on specific routes that need auth
  app.use(softDeleteMiddleware);
}

/**
 * Apply auth middleware to specific route(s)
 * Use this for routes that require authentication
 */
export const applyAuthMiddleware = authMiddleware;

/**
 * Example usage in Express app:
 *
 * import express from 'express';
 * import { applySecurityMiddleware } from '@/middleware';
 *
 * const app = express();
 *
 * app.use(express.json());
 * applySecurityMiddleware(app);
 *
 * // Now all routes have access to req.context with:
 * // - tenantId
 * // - userId
 * // - roles
 * // - permissions
 * // - requestId
 * // - includeSoftDeleted
 */
