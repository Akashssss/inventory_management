/**
 * EXCEPTIONS & ERROR HANDLING
 * Custom exception classes for enterprise error handling
 */
/**
 * Base exception class
 */
export declare class AppException extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly details?: Record<string, any>;
    readonly timestamp: Date;
    constructor(message: string, code?: string, statusCode?: number, details?: Record<string, any>);
    /**
     * Serialize to JSON
     */
    toJSON(): {
        error: {
            name: string;
            message: string;
            code: string;
            statusCode: number;
            details: Record<string, any> | undefined;
            timestamp: Date;
        };
    };
}
/**
 * Validation error
 */
export declare class ValidationException extends AppException {
    constructor(message: string, details?: Record<string, any>);
}
/**
 * Query validation error
 */
export declare class QueryValidationException extends ValidationException {
    constructor(message: string, details?: Record<string, any>);
}
/**
 * Filter validation error
 */
export declare class FilterValidationException extends QueryValidationException {
    constructor(field: string, operator: string, message: string, details?: Record<string, any>);
}
/**
 * Operator not found error
 */
export declare class OperatorNotFoundException extends QueryValidationException {
    constructor(operator: string, supportedOperators?: string[]);
}
/**
 * Field not found error
 */
export declare class FieldNotFoundException extends QueryValidationException {
    constructor(fieldName: string);
}
/**
 * Field not selectable error
 */
export declare class FieldNotSelectableException extends ValidationException {
    constructor(fieldName: string);
}
/**
 * Query complexity exceeded error
 */
export declare class QueryComplexityException extends AppException {
    constructor(complexity: number, maxPermitted: number);
}
/**
 * Database error
 */
export declare class DatabaseException extends AppException {
    constructor(message: string, originalError?: Error, details?: Record<string, any>);
}
/**
 * Not found error
 */
export declare class NotFoundException extends AppException {
    constructor(resource: string, identifier?: string | number);
}
/**
 * Unauthorized error
 */
export declare class UnauthorizedException extends AppException {
    constructor(message?: string);
}
/**
 * Forbidden error
 */
export declare class ForbiddenException extends AppException {
    constructor(message?: string, details?: Record<string, any>);
}
/**
 * Permission denied error
 */
export declare class PermissionDeniedException extends ForbiddenException {
    constructor(permission: string, resource?: string);
}
/**
 * Conflict error (e.g., duplicate unique field)
 */
export declare class ConflictException extends AppException {
    constructor(message: string, details?: Record<string, any>);
}
/**
 * Duplicate key error
 */
export declare class DuplicateKeyException extends ConflictException {
    constructor(field: string, value: any);
}
/**
 * Rate limit exceeded
 */
export declare class RateLimitException extends AppException {
    constructor(message?: string, retryAfter?: number);
}
/**
 * Soft delete error
 */
export declare class SoftDeleteException extends AppException {
    constructor(message: string, details?: Record<string, any>);
}
/**
 * ERROR HANDLER HELPER
 */
/**
 * Convert any error to AppException
 */
export declare function toAppException(error: any): AppException;
/**
 * ERROR MIDDLEWARE
 */
/**
 * Express error handler middleware
 * Use: app.use(errorHandler);
 */
export declare function errorHandler(error: any, _req: any, res: any, _next?: any): void;
/**
 * Safe error handler (logs without exposing details in production)
 */
export declare function safeErrorHandler(error: any, _req: any, res: any, isDevelopment?: boolean): void;
//# sourceMappingURL=AppException.d.ts.map