/**
 * System Status Handlers
 * Provides API endpoints for system health checks
 */

import { pool } from '../lib/postgres.js';
import { v4 as uuidv4 } from 'uuid';

// Get all system health checks
export async function getSystemHealthChecks(req, res) {
  try {
    const result = await pool.query('SELECT * FROM system_health_checks ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting system health checks:', error);
    res.status(500).json({ error: 'Failed to get system health checks' });
  }
}

// Get a single system health check by ID
export async function getSystemHealthCheckById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM system_health_checks WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'System health check not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting system health check:', error);
    res.status(500).json({ error: 'Failed to get system health check' });
  }
}

// Create a new system health check
export async function createSystemHealthCheck(req, res) {
  try {
    const { endpoint, category, status, response_time, status_code, error_message, response_data, component, message } = req.body;
    
    // Validate required fields
    if (!endpoint || !category || !status || !component) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate status
    if (status !== 'PASS' && status !== 'FAIL') {
      return res.status(400).json({ error: 'Status must be either PASS or FAIL' });
    }
    
    const id = uuidv4();
    const created_at = new Date();
    
    const result = await pool.query(
      `INSERT INTO system_health_checks 
       (id, endpoint, category, status, response_time, status_code, error_message, response_data, created_at, component, message) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING *`,
      [id, endpoint, category, status, response_time, status_code, error_message, response_data, created_at, component, message]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating system health check:', error);
    res.status(500).json({ error: 'Failed to create system health check' });
  }
}

// Delete a system health check
export async function deleteSystemHealthCheck(req, res) {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM system_health_checks WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'System health check not found' });
    }
    
    res.json({ message: 'System health check deleted successfully', deleted: result.rows[0] });
  } catch (error) {
    console.error('Error deleting system health check:', error);
    res.status(500).json({ error: 'Failed to delete system health check' });
  }
}
