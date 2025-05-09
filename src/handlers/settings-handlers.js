/**
 * Settings Handlers
 * 
 * This module provides handlers for system settings API endpoints.
 */

import { pool } from '../lib/postgres.js';
import { handleError } from '../lib/error-handler.js';

/**
 * Get all system settings
 */
export async function getSettings(req, res) {
  try {
    // Check if user has admin permissions
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin permissions required' });
    }
    
    const result = await pool.query('SELECT * FROM settings');
    return res.json(result.rows);
  } catch (error) {
    return handleError(error, req, res);
  }
}

/**
 * Get a specific system setting by key
 */
export async function getSettingByKey(req, res) {
  try {
    const { key } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM settings WHERE key = $1',
      [key]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    return res.json(result.rows[0]);
  } catch (error) {
    return handleError(error, req, res);
  }
}

/**
 * Update a system setting
 */
export async function updateSetting(req, res) {
  try {
    // Check if user has admin permissions
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin permissions required' });
    }
    
    const { key } = req.params;
    const { value, description } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }
    
    // Check if setting exists
    const checkResult = await pool.query(
      'SELECT * FROM settings WHERE key = $1',
      [key]
    );
    
    if (checkResult.rows.length === 0) {
      // Create new setting
      const insertResult = await pool.query(
        `INSERT INTO settings 
         (id, key, value, description, created_at, updated_at)
         VALUES 
         (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
         RETURNING *`,
        [key, value, description]
      );
      
      return res.json(insertResult.rows[0]);
    } else {
      // Update existing setting
      const updateResult = await pool.query(
        `UPDATE settings 
         SET value = $1,
             description = COALESCE($2, description),
             updated_at = NOW()
         WHERE key = $3
         RETURNING *`,
        [value, description, key]
      );
      
      return res.json(updateResult.rows[0]);
    }
  } catch (error) {
    return handleError(error, req, res);
  }
}

/**
 * Create a new system setting
 */
export async function createSetting(req, res) {
  try {
    // Check if user has admin permissions
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin permissions required' });
    }
    
    const { key, value, description } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Key and value are required' });
    }
    
    // Check if setting already exists
    const checkResult = await pool.query(
      'SELECT * FROM settings WHERE key = $1',
      [key]
    );
    
    if (checkResult.rows.length > 0) {
      return res.status(409).json({ error: 'Setting already exists' });
    }
    
    // Create new setting
    const insertResult = await pool.query(
      `INSERT INTO settings 
       (id, key, value, description, created_at, updated_at)
       VALUES 
       (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
       RETURNING *`,
      [key, value, description]
    );
    
    return res.status(201).json(insertResult.rows[0]);
  } catch (error) {
    return handleError(error, req, res);
  }
}

/**
 * Delete a system setting
 */
export async function deleteSetting(req, res) {
  try {
    // Check if user has admin permissions
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin permissions required' });
    }
    
    const { key } = req.params;
    
    const result = await pool.query(
      'DELETE FROM settings WHERE key = $1 RETURNING *',
      [key]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    return res.json({ success: true, message: 'Setting deleted successfully' });
  } catch (error) {
    return handleError(error, req, res);
  }
}
