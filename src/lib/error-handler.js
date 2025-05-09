/**
 * error-handler.js
 * 
 * Standardized error handling framework for the application.
 * This module provides custom error classes and middleware for consistent error handling.
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Base application error class that extends the standard Error
 * with additional properties for better error handling and tracking.
 */
export class AppError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.status = options.status || 500;
    this.code = options.code || 'INTERNAL_ERROR';
    this.details = options.details || {};
    this.isOperational = options.isOperational !== false; // Default to true
    this.timestamp = new Date().toISOString();
    this.endpoint = options.endpoint || null;
    this.requestId = options.requestId || null;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error for request validation failures
 */
export class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, { 
      status: 400, 
      code: 'VALIDATION_ERROR', 
      details, 
      isOperational: true 
    });
  }
}

/**
 * Authentication error for auth-related failures
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, { 
      status: 401, 
      code: 'AUTHENTICATION_ERROR', 
      isOperational: true 
    });
  }
}

/**
 * Authorization error for permission-related failures
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, { 
      status: 403, 
      code: 'AUTHORIZATION_ERROR', 
      isOperational: true 
    });
  }
}

/**
 * Not found error for resource not found situations
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, { 
      status: 404, 
      code: 'NOT_FOUND_ERROR', 
      isOperational: true 
    });
  }
}

/**
 * Database error for database-related failures
 */
export class DatabaseError extends AppError {
  constructor(message, originalError) {
    super(message, { 
      status: 500, 
      code: 'DATABASE_ERROR', 
      details: { 
        originalError: originalError?.message,
        query: originalError?.query
      }, 
      isOperational: true 
    });
  }
}

/**
 * API error for external API-related failures
 */
export class ApiError extends AppError {
  constructor(message, statusCode, originalError) {
    super(message, { 
      status: statusCode || 500, 
      code: 'API_ERROR', 
      details: { 
        originalError: originalError?.message,
        response: originalError?.response?.data
      }, 
      isOperational: true 
    });
  }
}

/**
 * Global error handler middleware for Express
 */
export function errorHandlerMiddleware(err, req, res, next) {
  // Generate unique request ID if not present
  const requestId = req.id || uuidv4();
  
  // Standardize error format
  const error = err instanceof AppError ? err : new AppError(err.message || 'Unknown error', {
    status: err.status || 500,
    code: err.code || 'INTERNAL_ERROR',
    details: err.details || {},
    isOperational: false,
    requestId
  });
  
  // Add endpoint information
  error.endpoint = req.originalUrl;
  error.requestId = requestId;
  
  // Log error
  console.error(`[ERROR] ${requestId} - ${error.code} - ${error.message}`, {
    status: error.status,
    endpoint: error.endpoint,
    details: error.details,
    stack: error.stack
  });
  
  // Record error in database
  recordErrorInDatabase(error, req).catch(e => {
    console.error('Failed to record error in database:', e);
  });
  
  // Send response
  res.status(error.status).json({
    error: {
      code: error.code,
      message: error.message,
      requestId,
      ...(process.env.NODE_ENV !== 'production' && { details: error.details })
    }
  });
}

/**
 * Record error in database for tracking and analysis
 */
async function recordErrorInDatabase(error, req) {
  try {
    const pool = req.app.locals.pool;
    
    await pool.query(
      `INSERT INTO system_errors (
        id, code, message, status, endpoint, request_id, 
        details, stack_trace, user_id, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        uuidv4(),
        error.code,
        error.message,
        error.status,
        error.endpoint,
        error.requestId,
        JSON.stringify(error.details),
        error.stack,
        req.user?.id || null
      ]
    );
  } catch (dbError) {
    console.error('Error recording error in database:', dbError);
  }
}

/**
 * Async handler to wrap async route handlers and catch errors
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Get error statistics from the database
 */
export async function getErrorStats(pool, options = {}) {
  const { timeframe = '24h', limit = 10 } = options;
  
  // Get error count by endpoint
  const endpointStats = await pool.query(`
    SELECT 
      endpoint, 
      COUNT(*) as count,
      MIN(created_at) as first_occurrence,
      MAX(created_at) as last_occurrence
    FROM system_errors
    WHERE created_at > NOW() - INTERVAL '${timeframe}'
    GROUP BY endpoint
    ORDER BY count DESC
    LIMIT $1
  `, [limit]);
  
  // Get error count by code
  const codeStats = await pool.query(`
    SELECT 
      code, 
      COUNT(*) as count
    FROM system_errors
    WHERE created_at > NOW() - INTERVAL '${timeframe}'
    GROUP BY code
    ORDER BY count DESC
    LIMIT $1
  `, [limit]);
  
  // Get most recent errors
  const recentErrors = await pool.query(`
    SELECT 
      id, code, message, status, endpoint, 
      request_id, created_at, user_id
    FROM system_errors
    ORDER BY created_at DESC
    LIMIT $1
  `, [limit]);
  
  return {
    endpointStats: endpointStats.rows,
    codeStats: codeStats.rows,
    recentErrors: recentErrors.rows,
    totalCount: parseInt((await pool.query(`
      SELECT COUNT(*) FROM system_errors
      WHERE created_at > NOW() - INTERVAL '${timeframe}'
    `)).rows[0].count)
  };
}

/**
 * Get error details from the database
 */
export async function getErrorDetails(pool, errorId) {
  const result = await pool.query(`
    SELECT * FROM system_errors WHERE id = $1
  `, [errorId]);
  
  return result.rows[0] || null;
}
