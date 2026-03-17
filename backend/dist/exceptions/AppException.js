"use strict";
/**
 * EXCEPTIONS & ERROR HANDLING
 * Custom exception classes for enterprise error handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoftDeleteException = exports.RateLimitException = exports.DuplicateKeyException = exports.ConflictException = exports.PermissionDeniedException = exports.ForbiddenException = exports.UnauthorizedException = exports.NotFoundException = exports.DatabaseException = exports.QueryComplexityException = exports.FieldNotSelectableException = exports.FieldNotFoundException = exports.OperatorNotFoundException = exports.FilterValidationException = exports.QueryValidationException = exports.ValidationException = exports.AppException = void 0;
exports.toAppException = toAppException;
exports.errorHandler = errorHandler;
exports.safeErrorHandler = safeErrorHandler;
/**
 * Base exception class
 */
class AppException extends Error {
    constructor(message, code = "INTERNAL_ERROR", statusCode = 500, details) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.timestamp = new Date();
        // Maintain proper stack trace
        Error.captureStackTrace(this, this.constructor);
    }
    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            error: {
                name: this.name,
                message: this.message,
                code: this.code,
                statusCode: this.statusCode,
                details: this.details,
                timestamp: this.timestamp,
            },
        };
    }
}
exports.AppException = AppException;
/**
 * Validation error
 */
class ValidationException extends AppException {
    constructor(message, details) {
        super(message, "VALIDATION_ERROR", 400, details);
    }
}
exports.ValidationException = ValidationException;
/**
 * Query validation error
 */
class QueryValidationException extends ValidationException {
    constructor(message, details) {
        super(message, {
            type: "query_validation",
            ...details,
        });
    }
}
exports.QueryValidationException = QueryValidationException;
/**
 * Filter validation error
 */
class FilterValidationException extends QueryValidationException {
    constructor(field, operator, message, details) {
        super(message, {
            field,
            operator,
            ...details,
        });
    }
}
exports.FilterValidationException = FilterValidationException;
/**
 * Operator not found error
 */
class OperatorNotFoundException extends QueryValidationException {
    constructor(operator, supportedOperators) {
        super(`Operator "${operator}" is not supported`, {
            operator,
            supportedOperators,
        });
    }
}
exports.OperatorNotFoundException = OperatorNotFoundException;
/**
 * Field not found error
 */
class FieldNotFoundException extends QueryValidationException {
    constructor(fieldName) {
        super(`Field "${fieldName}" not found in schema or not filterable`, {
            field: fieldName,
        });
    }
}
exports.FieldNotFoundException = FieldNotFoundException;
/**
 * Field not selectable error
 */
class FieldNotSelectableException extends ValidationException {
    constructor(fieldName) {
        super(`Field "${fieldName}" cannot be selected (restricted or not configured)`, {
            field: fieldName,
        });
    }
}
exports.FieldNotSelectableException = FieldNotSelectableException;
/**
 * Query complexity exceeded error
 */
class QueryComplexityException extends AppException {
    constructor(complexity, maxPermitted) {
        super(`Query complexity (${complexity}) exceeds maximum allowed (${maxPermitted}). Simplify your filters or reduce pagination limit.`, "QUERY_TOO_COMPLEX", 429, { complexity, maxPermitted });
    }
}
exports.QueryComplexityException = QueryComplexityException;
/**
 * Database error
 */
class DatabaseException extends AppException {
    constructor(message, originalError, details) {
        super(message, "DATABASE_ERROR", 500, {
            originalError: originalError?.message,
            ...details,
        });
    }
}
exports.DatabaseException = DatabaseException;
/**
 * Not found error
 */
class NotFoundException extends AppException {
    constructor(resource, identifier) {
        const message = identifier
            ? `${resource} with ID "${identifier}" not found`
            : `${resource} not found`;
        super(message, "NOT_FOUND", 404, {
            resource,
            identifier,
        });
    }
}
exports.NotFoundException = NotFoundException;
/**
 * Unauthorized error
 */
class UnauthorizedException extends AppException {
    constructor(message = "Unauthorized") {
        super(message, "UNAUTHORIZED", 401);
    }
}
exports.UnauthorizedException = UnauthorizedException;
/**
 * Forbidden error
 */
class ForbiddenException extends AppException {
    constructor(message = "Access forbidden", details) {
        super(message, "FORBIDDEN", 403, details);
    }
}
exports.ForbiddenException = ForbiddenException;
/**
 * Permission denied error
 */
class PermissionDeniedException extends ForbiddenException {
    constructor(permission, resource) {
        const message = resource
            ? `Permission "${permission}" denied for ${resource}`
            : `Permission "${permission}" denied`;
        super(message, { permission, resource });
    }
}
exports.PermissionDeniedException = PermissionDeniedException;
/**
 * Conflict error (e.g., duplicate unique field)
 */
class ConflictException extends AppException {
    constructor(message, details) {
        super(message, "CONFLICT", 409, details);
    }
}
exports.ConflictException = ConflictException;
/**
 * Duplicate key error
 */
class DuplicateKeyException extends ConflictException {
    constructor(field, value) {
        super(`A record with ${field} "${value}" already exists`, {
            field,
            value,
        });
    }
}
exports.DuplicateKeyException = DuplicateKeyException;
/**
 * Rate limit exceeded
 */
class RateLimitException extends AppException {
    constructor(message = "Too many requests", retryAfter) {
        super(message, "RATE_LIMIT_EXCEEDED", 429, { retryAfter });
    }
}
exports.RateLimitException = RateLimitException;
/**
 * Soft delete error
 */
class SoftDeleteException extends AppException {
    constructor(message, details) {
        super(message, "SOFT_DELETE_ERROR", 400, details);
    }
}
exports.SoftDeleteException = SoftDeleteException;
/**
 * ERROR HANDLER HELPER
 */
/**
 * Convert any error to AppException
 */
function toAppException(error) {
    if (error instanceof AppException) {
        return error;
    }
    if (error instanceof Error) {
        // MongoDB specific errors
        if (error.name === "MongoServerError") {
            const mongoError = error;
            // Duplicate key error
            if (mongoError.code === 11000) {
                const field = Object.keys(mongoError.keyPattern)[0];
                const value = mongoError.keyValue[field];
                return new DuplicateKeyException(field, value);
            }
            // Validation error
            if (mongoError.code === 121) {
                return new ValidationException("Document validation failed");
            }
            return new DatabaseException(error.message, error);
        }
        // Mongoose specific errors
        if (error.name === "CastError") {
            return new ValidationException(`Invalid value for field "${error.path}"`);
        }
        if (error.name === "ValidationError") {
            const details = Object.fromEntries(Object.entries(error.errors).map(([key, err]) => [
                key,
                err.message,
            ]));
            return new ValidationException("Validation failed", details);
        }
        // Generic error
        return new AppException(error.message);
    }
    // Unknown error
    return new AppException(typeof error === "string" ? error : "An unexpected error occurred");
}
/**
 * ERROR MIDDLEWARE
 */
/**
 * Express error handler middleware
 * Use: app.use(errorHandler);
 */
function errorHandler(error, _req, res, _next) {
    const appError = toAppException(error);
    res.status(appError.statusCode).json(appError.toJSON());
}
/**
 * Safe error handler (logs without exposing details in production)
 */
function safeErrorHandler(error, _req, res, isDevelopment = false) {
    const appError = toAppException(error);
    if (isDevelopment) {
        res.status(appError.statusCode).json(appError.toJSON());
    }
    else {
        // Hide details in production
        res.status(appError.statusCode).json({
            error: {
                message: appError.message,
                code: appError.code,
                timestamp: appError.timestamp,
            },
        });
    }
}
//# sourceMappingURL=AppException.js.map