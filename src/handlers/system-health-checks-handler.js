/**
 * system-health-checks-handler.js
 * 
 * This file provides handlers for system health checks API endpoints.
 */

import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';

// Create a PostgreSQL client
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Get all system health checks
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
export async function getAllSystemHealthChecks(req, res) {
  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query('SELECT * FROM system_health_checks ORDER BY created_at DESC');
      
      res.status(200).json({
        success: true,
        data: result.rows
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error getting system health checks:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error getting system health checks',
      error: error.message
    });
  }
}

/**
 * Get a system health check by ID
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
export async function getSystemHealthCheckById(req, res) {
  try {
    const { id } = req.params;
    
    const client = await pool.connect();
    
    try {
      const result = await client.query('SELECT * FROM system_health_checks WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `System health check with ID ${id} not found`
        });
      }
      
      res.status(200).json({
        success: true,
        data: result.rows[0]
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error getting system health check:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error getting system health check',
      error: error.message
    });
  }
}

/**
 * Create a system health check
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
export async function createSystemHealthCheck(req, res) {
  try {
    const { endpoint, category, status, response_time, status_code } = req.body;
    
    // Validate required fields
    if (!endpoint || !category || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: endpoint, category, status'
      });
    }
    
    const id = uuidv4();
    const created_at = new Date();
    
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'INSERT INTO system_health_checks (id, endpoint, category, status, response_time, status_code, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [id, endpoint, category, status, response_time || 0, status_code || 200, created_at]
      );
      
      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'System health check created successfully'
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating system health check:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error creating system health check',
      error: error.message
    });
  }
}

/**
 * Delete a system health check
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
export async function deleteSystemHealthCheck(req, res) {
  try {
    const { id } = req.params;
    
    const client = await pool.connect();
    
    try {
      // Check if the system health check exists
      const checkResult = await client.query('SELECT * FROM system_health_checks WHERE id = $1', [id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `System health check with ID ${id} not found`
        });
      }
      
      // Delete the system health check
      await client.query('DELETE FROM system_health_checks WHERE id = $1', [id]);
      
      res.status(200).json({
        success: true,
        message: `System health check with ID ${id} deleted successfully`
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting system health check:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error deleting system health check',
      error: error.message
    });
  }
}
