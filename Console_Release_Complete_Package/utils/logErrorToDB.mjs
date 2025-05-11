/**
 * logErrorToDB.js
 * Utility for logging errors to the database
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create a connection pool
const pool = new Pool({
  host: process.env.DOCKER_ENV === 'true' ? 'db' : (process.env.POSTGRES_HOST || 'localhost'),
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crm_db',
  user: process.env.POSTGRES_USER || 'crm_user',
  password: process.env.POSTGRES_PASSWORD || 'your_strong_password_here'
});

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log file path
const logFilePath = path.join(logsDir, 'error_log.json');

// Initialize log file if it doesn't exist
if (!fs.existsSync(logFilePath)) {
  fs.writeFileSync(logFilePath, JSON.stringify({ errors: [] }));
}

/**
 * Log an error to the database
 * @param {Pool} pool - PostgreSQL connection pool
 * @param {Object} errorData - Error data to log
 * @returns {Promise<Object>} - The logged error
 */
export default async function logErrorToDB(pool, errorData) {
  const { 
    error_message, 
    error_stack, 
    error_type = 'Server Error', 
    request_path, 
    request_method, 
    request_ip, 
    request_user_agent, 
    timestamp = new Date() 
  } = errorData;
  
  // Log to file as backup
  logToFile({
    error_type,
    message: error_message,
    details: {
      path: request_path,
      method: request_method,
      ip: request_ip,
      user_agent: request_user_agent
    },
    stack_trace: error_stack,
    created_at: timestamp.toISOString()
  });
  
  // Check if error logging is enabled
  if (process.env.ERROR_LOGGING_ENABLED !== 'true') {
    console.log('Error logging to DB is disabled');
    return errorData;
  }
  
  let client;
  try {
    client = await pool.connect();
    
    // Insert error into database
    const result = await client.query(
      `INSERT INTO system_errors 
       (error_type, message, details, stack_trace) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [
        error_type, 
        error_message, 
        JSON.stringify({
          path: request_path,
          method: request_method,
          ip: request_ip,
          user_agent: request_user_agent
        }), 
        error_stack
      ]
    );
    
    console.log(`Error logged to database: ${error_type} - ${error_message}`);
    return result.rows[0];
  } catch (dbError) {
    console.error('Failed to log error to database:', dbError);
    return errorData;
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * Log an error to a file
 * @param {Object} error - Error object to log
 */
function logToFile(error) {
  try {
    // Read existing log file
    const logData = JSON.parse(fs.readFileSync(logFilePath, 'utf8'));
    
    // Add new error
    logData.errors.push(error);
    
    // Write updated log back to file
    fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2));
    
    console.log(`Error logged to file: ${error.error_type} - ${error.message}`);
  } catch (fileError) {
    console.error('Failed to log error to file:', fileError);
  }
}

/**
 * Get recent errors from the database
 * @param {number} limit - Maximum number of errors to return
 * @param {boolean} includeResolved - Whether to include resolved errors
 * @returns {Promise<Array>} - Array of errors
 */
export async function getRecentErrors(limit = 100, includeResolved = false) {
  let client;
  try {
    client = await pool.connect();
    
    // Query to get recent errors
    const query = includeResolved
      ? 'SELECT * FROM system_errors ORDER BY created_at DESC LIMIT $1'
      : 'SELECT * FROM system_errors WHERE resolved = false ORDER BY created_at DESC LIMIT $1';
    
    const result = await client.query(query, [limit]);
    return result.rows;
  } catch (dbError) {
    console.error('Failed to get recent errors from database:', dbError);
    
    // Fallback to file if database query fails
    try {
      const logData = JSON.parse(fs.readFileSync(logFilePath, 'utf8'));
      return logData.errors
        .filter(error => includeResolved || !error.resolved)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, limit);
    } catch (fileError) {
      console.error('Failed to read errors from file:', fileError);
      return [];
    }
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * Mark an error as resolved
 * @param {number} id - ID of the error to mark as resolved
 * @param {string} resolvedBy - User who resolved the error
 * @param {string} notes - Resolution notes
 * @returns {Promise<Object>} - The updated error
 */
export async function markErrorResolved(id, resolvedBy, notes = '') {
  let client;
  try {
    client = await pool.connect();
    
    // Update error in database
    const result = await client.query(
      `UPDATE system_errors 
       SET resolved = true, resolved_at = NOW(), resolved_by = $1, resolution_notes = $2 
       WHERE id = $3 
       RETURNING *`,
      [resolvedBy, notes, id]
    );
    
    if (result.rows.length === 0) {
      throw new Error(`Error with ID ${id} not found`);
    }
    
    console.log(`Error ${id} marked as resolved by ${resolvedBy}`);
    return result.rows[0];
  } catch (dbError) {
    console.error('Failed to mark error as resolved:', dbError);
    throw dbError;
  } finally {
    if (client) {
      client.release();
    }
  }
}
