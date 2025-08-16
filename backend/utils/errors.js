/**
 * Custom error classes for the Claude Split Bill backend services
 */

/**
 * Base error class for all backend service errors
 */
export class BackendError extends Error {
  constructor(message, code = 'BACKEND_ERROR', statusCode = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Maintain proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON for API responses
   * @returns {Object} Error object suitable for JSON response
   */
  toJSON() {
    return {
      success: false,
      error: {
        name: this.name,
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        details: this.details,
        timestamp: this.timestamp
      }
    };
  }
}

/**
 * Validation error - for invalid input data
 */
export class ValidationError extends BackendError {
  constructor(message, details = null) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * Authentication error - for auth-related issues
 */
export class AuthenticationError extends BackendError {
  constructor(message = 'Authentication required', details = null) {
    super(message, 'AUTHENTICATION_ERROR', 401, details);
  }
}

/**
 * Authorization error - for permission issues
 */
export class AuthorizationError extends BackendError {
  constructor(message = 'Insufficient permissions', details = null) {
    super(message, 'AUTHORIZATION_ERROR', 403, details);
  }
}

/**
 * Not found error - for missing resources
 */
export class NotFoundError extends BackendError {
  constructor(resource = 'Resource', details = null) {
    super(`${resource} not found`, 'NOT_FOUND', 404, details);
  }
}

/**
 * Conflict error - for conflicting operations
 */
export class ConflictError extends BackendError {
  constructor(message, details = null) {
    super(message, 'CONFLICT', 409, details);
  }
}

/**
 * Database error - for database-related issues
 */
export class DatabaseError extends BackendError {
  constructor(message, details = null) {
    super(message, 'DATABASE_ERROR', 500, details);
  }
}

/**
 * Business logic error - for domain-specific validation failures
 */
export class BusinessLogicError extends BackendError {
  constructor(message, details = null) {
    super(message, 'BUSINESS_LOGIC_ERROR', 422, details);
  }
}

/**
 * Helper function to create appropriate error from Supabase error
 * @param {Object} supabaseError - Error from Supabase
 * @param {string} operation - Description of the operation that failed
 * @returns {BackendError} Appropriate error instance
 */
export const createErrorFromSupabase = (supabaseError, operation = 'database operation') => {
  const message = `Failed to ${operation}: ${supabaseError.message}`;
  
  // Map common Supabase error codes to our error types
  switch (supabaseError.code) {
    case 'PGRST116': // No rows returned
      return new NotFoundError('Resource', { supabaseError, operation });
    
    case '23505': // Unique violation
      return new ConflictError(message, { supabaseError, operation });
    
    case '23503': // Foreign key violation
      return new ValidationError(message, { supabaseError, operation });
    
    case '23514': // Check violation
      return new ValidationError(message, { supabaseError, operation });
    
    case '42501': // Insufficient privilege
      return new AuthorizationError(message, { supabaseError, operation });
    
    default:
      return new DatabaseError(message, { supabaseError, operation });
  }
};

/**
 * Helper function to handle async operations with error wrapping
 * @param {Function} operation - Async operation to execute
 * @param {string} operationName - Name of the operation for error context
 * @returns {Promise<any>} Result of the operation
 * @throws {BackendError} Wrapped error if operation fails
 */
export const handleAsyncOperation = async (operation, operationName = 'operation') => {
  try {
    return await operation();
  } catch (error) {
    // If it's already a BackendError, re-throw it
    if (error instanceof BackendError) {
      throw error;
    }
    
    // If it's a Supabase error, convert it
    if (error.code && error.message) {
      throw createErrorFromSupabase(error, operationName);
    }
    
    // Otherwise, wrap it in a generic BackendError
    throw new BackendError(
      `${operationName} failed: ${error.message}`,
      'OPERATION_FAILED',
      500,
      { originalError: error.message, stack: error.stack }
    );
  }
};

/**
 * Validation helper for required fields
 * @param {Object} data - Data to validate
 * @param {Array<string>} requiredFields - List of required field names
 * @throws {ValidationError} If any required fields are missing
 */
export const validateRequiredFields = (data, requiredFields) => {
  const missing = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      { missingFields: missing }
    );
  }
};

/**
 * Validation helper for UUID format
 * @param {string} value - Value to validate
 * @param {string} fieldName - Name of the field for error message
 * @throws {ValidationError} If value is not a valid UUID
 */
export const validateUUID = (value, fieldName = 'ID') => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!value || !uuidRegex.test(value)) {
    throw new ValidationError(
      `Invalid ${fieldName} format`,
      { field: fieldName, value, expected: 'UUID format' }
    );
  }
};

export default {
  BackendError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  BusinessLogicError,
  createErrorFromSupabase,
  handleAsyncOperation,
  validateRequiredFields,
  validateUUID
};
