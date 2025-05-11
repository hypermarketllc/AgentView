/**
 * System Health Checks API Handlers
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool();

/**
 * Get all system health checks
 */
export async function getSystemHealthChecks(req, res) {
  try {
    const result = await pool.query('SELECT * FROM system_health_checks ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting system health checks:', error);
    res.status(500).json({ error: 'Failed to get system health checks' });
  }
}

/**
 * Get a system health check by ID
 */
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

/**
 * Create a new system health check
 */
export async function createSystemHealthCheck(req, res) {
  try {
    const { component, status, message, endpoint, category } = req.body;
    
    if (!component || !status || !endpoint || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate status
    if (status !== 'PASS' && status !== 'FAIL') {
      return res.status(400).json({ error: 'Status must be either PASS or FAIL' });
    }
    
    const result = await pool.query(
      'INSERT INTO system_health_checks (id, component, status, message, endpoint, category, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *',
      [uuidv4(), component, status, message, endpoint, category]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating system health check:', error);
    res.status(500).json({ error: 'Failed to create system health check' });
  }
}

/**
 * Update a system health check
 */
export async function updateSystemHealthCheck(req, res) {
  try {
    const { id } = req.params;
    const { component, status, message, endpoint, category } = req.body;
    
    if (!component || !status || !endpoint || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate status
    if (status !== 'PASS' && status !== 'FAIL') {
      return res.status(400).json({ error: 'Status must be either PASS or FAIL' });
    }
    
    const result = await pool.query(
      'UPDATE system_health_checks SET component = $1, status = $2, message = $3, endpoint = $4, category = $5 WHERE id = $6 RETURNING *',
      [component, status, message, endpoint, category, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'System health check not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating system health check:', error);
    res.status(500).json({ error: 'Failed to update system health check' });
  }
}

/**
 * Delete a system health check
 */
export async function deleteSystemHealthCheck(req, res) {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM system_health_checks WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'System health check not found' });
    }
    
    res.json({ message: 'System health check deleted successfully' });
  } catch (error) {
    console.error('Error deleting system health check:', error);
    res.status(500).json({ error: 'Failed to delete system health check' });
  }
}
