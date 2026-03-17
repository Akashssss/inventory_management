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
export declare function tenantMiddleware(req: Request, _res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
/**
 * Auth middleware
 * Injects user info and RBAC permissions
 */
export declare function authMiddleware(req: Request, _res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
/**
 * RBAC middleware
 * Checks if user has required permission
 */
export declare function requirePermission(permission: string): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Soft delete middleware
 * Injects includeSoftDeleted flag based on permission
 */
export declare function softDeleteMiddleware(req: Request, _res: Response, next: NextFunction): void;
/**
 * Request ID middleware
 * Adds request ID for tracing
 */
export declare function requestIdMiddleware(req: Request, _res: Response, next: NextFunction): void;
/**
 * MIDDLEWARE COMPOSITION
 * Use this to apply security middleware globally
 * NOTE: authMiddleware is NOT applied globally to allow signup/login without tokens
 */
export declare function applySecurityMiddleware(app: any): void;
/**
 * Apply auth middleware to specific route(s)
 * Use this for routes that require authentication
 */
export declare const applyAuthMiddleware: typeof authMiddleware;
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
//# sourceMappingURL=securityMiddleware.d.ts.map