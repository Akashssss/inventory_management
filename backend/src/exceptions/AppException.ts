/**
 * EXCEPTIONS & ERROR HANDLING
 * Custom exception classes for enterprise error handling
 */

/**
 * Base exception class
 */
export class AppException extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: string = "INTERNAL_ERROR",
    statusCode: number = 500,
    details?: Record<string, any>
  ) {
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

/**
 * Validation error
 */
export class ValidationException extends AppException {
  constructor(
    message: string,
    details?: Record<string, any>
  ) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

/**
 * Query validation error
 */
export class QueryValidationException extends ValidationException {
  constructor(
    message: string,
    details?: Record<string, any>
  ) {
    super(message, {
      type: "query_validation",
      ...details,
    });
  }
}

/**
 * Filter validation error
 */
export class FilterValidationException extends QueryValidationException {
  constructor(
    field: string,
    operator: string,
    message: string,
    details?: Record<string, any>
  ) {
    super(message, {
      field,
      operator,
      ...details,
    });
  }
}

/**
 * Operator not found error
 */
export class OperatorNotFoundException extends QueryValidationException {
  constructor(
    operator: string,
    supportedOperators?: string[]
  ) {
    super(`Operator "${operator}" is not supported`, {
      operator,
      supportedOperators,
    });
  }
}

/**
 * Field not found error
 */
export class FieldNotFoundException extends QueryValidationException {
  constructor(fieldName: string) {
    super(`Field "${fieldName}" not found in schema or not filterable`, {
      field: fieldName,
    });
  }
}

/**
 * Field not selectable error
 */
export class FieldNotSelectableException extends ValidationException {
  constructor(fieldName: string) {
    super(`Field "${fieldName}" cannot be selected (restricted or not configured)`, {
      field: fieldName,
    });
  }
}

/**
 * Query complexity exceeded error
 */
export class QueryComplexityException extends AppException {
  constructor(complexity: number, maxPermitted: number) {
    super(
      `Query complexity (${complexity}) exceeds maximum allowed (${maxPermitted}). Simplify your filters or reduce pagination limit.`,
      "QUERY_TOO_COMPLEX",
      429,
      { complexity, maxPermitted }
    );
  }
}

/**
 * Database error
 */
export class DatabaseException extends AppException {
  constructor(
    message: string,
    originalError?: Error,
    details?: Record<string, any>
  ) {
    super(message, "DATABASE_ERROR", 500, {
      originalError: originalError?.message,
      ...details,
    });
  }
}

/**
 * Not found error
 */
export class NotFoundException extends AppException {
  constructor(resource: string, identifier?: string | number) {
    const message =
      identifier
      ? `${resource} with ID "${identifier}" not found`
      : `${resource} not found`;
    super(message, "NOT_FOUND", 404, {
      resource,
      identifier,
    });
  }
}

/**
 * Unauthorized error
 */
export class UnauthorizedException extends AppException {
  constructor(message: string = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
  }
}

/**
 * Forbidden error
 */
export class ForbiddenException extends AppException {
  constructor(
    message: string = "Access forbidden",
    details?: Record<string, any>
  ) {
    super(message, "FORBIDDEN", 403, details);
  }
}

/**
 * Permission denied error
 */
export class PermissionDeniedException extends ForbiddenException {
  constructor(permission: string, resource?: string) {
    const message = resource
      ? `Permission "${permission}" denied for ${resource}`
      : `Permission "${permission}" denied`;

    super(message, { permission, resource });
  }
}

/**
 * Conflict error (e.g., duplicate unique field)
 */
export class ConflictException extends AppException {
  constructor(message: string, details?: Record<string, any>) {
    super(message, "CONFLICT", 409, details);
  }
}

/**
 * Duplicate key error
 */
export class DuplicateKeyException extends ConflictException {
  constructor(field: string, value: any) {
    super(`A record with ${field} "${value}" already exists`, {
      field,
      value,
    });
  }
}

/**
 * Rate limit exceeded
 */
export class RateLimitException extends AppException {
  constructor(
    message: string = "Too many requests",
    retryAfter?: number
  ) {
    super(message, "RATE_LIMIT_EXCEEDED", 429, { retryAfter });
  }
}

/**
 * Soft delete error
 */
export class SoftDeleteException extends AppException {
  constructor(message: string, details?: Record<string, any>) {
    super(message, "SOFT_DELETE_ERROR", 400, details);
  }
}

/**
 * ERROR HANDLER HELPER
 */

/**
 * Convert any error to AppException
 */
export function toAppException(error: any): AppException {
  if (error instanceof AppException) {
    return error;
  }

  if (error instanceof Error) {
    // MongoDB specific errors
    if (error.name === "MongoServerError") {
      const mongoError = error as any;

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
      return new ValidationException(
        `Invalid value for field "${(error as any).path}"`
      );
    }

    if (error.name === "ValidationError") {
      const details = Object.fromEntries(
        Object.entries((error as any).errors).map(([key, err]: any) => [
          key,
          err.message,
        ])
      );
      return new ValidationException("Validation failed", details);
    }

    // Generic error
    return new AppException(error.message);
  }

  // Unknown error
  return new AppException(
    typeof error === "string" ? error : "An unexpected error occurred"
  );
}

/**
 * ERROR MIDDLEWARE
 */

/**
 * Express error handler middleware
 * Use: app.use(errorHandler);
 */
export function errorHandler(
  error: any,
  _req: any,
  res: any,
  _next?: any
) {
  const appError = toAppException(error);

  res.status(appError.statusCode).json(appError.toJSON());
}

/**
 * Safe error handler (logs without exposing details in production)
 */
export function safeErrorHandler(
  error: any,
  _req: any,
  res: any,
  isDevelopment: boolean = false
) {
  const appError = toAppException(error);

  if (isDevelopment) {
    res.status(appError.statusCode).json(appError.toJSON());
  } else {
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
