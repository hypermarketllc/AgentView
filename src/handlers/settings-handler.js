/**
 * settings-handler.js
 * 
 * This file provides handlers for settings API endpoints.
 */

import pg from 'pg';

// Create a PostgreSQL client
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Get all settings
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
export async function getAllSettings(req, res) {
  try {
    const client = await pool.connect();
    
    try {
      const result = await client.query('SELECT * FROM settings ORDER BY category, key');
      
      res.status(200).json({
        success: true,
        data: result.rows
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error getting settings:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error getting settings',
      error: error.message
    });
  }
}

/**
 * Get settings by category
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
export async function getSettingsByCategory(req, res) {
  try {
    const { category } = req.params;
    
    const client = await pool.connect();
    
    try {
      const result = await client.query('SELECT * FROM settings WHERE category = $1 ORDER BY key', [category]);
      
      res.status(200).json({
        success: true,
        data: result.rows
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error getting settings by category:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error getting settings by category',
      error: error.message
    });
  }
}

/**
 * Get a setting by key
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
export async function getSettingByKey(req, res) {
  try {
    const { category, key } = req.params;
    
    const client = await pool.connect();
    
    try {
      const result = await client.query('SELECT * FROM settings WHERE category = $1 AND key = $2', [category, key]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Setting with category ${category} and key ${key} not found`
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
    console.error('Error getting setting by key:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error getting setting by key',
      error: error.message
    });
  }
}

/**
 * Create a setting
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
export async function createSetting(req, res) {
  try {
    const { key, value, category } = req.body;
    
    // Validate required fields
    if (!key || !value || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: key, value, category'
      });
    }
    
    const created_at = new Date();
    const updated_at = created_at;
    
    const client = await pool.connect();
    
    try {
      // Check if the setting already exists
      const checkResult = await client.query('SELECT * FROM settings WHERE category = $1 AND key = $2', [category, key]);
      
      if (checkResult.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: `Setting with category ${category} and key ${key} already exists`
        });
      }
      
      // Create the setting
      const result = await client.query(
        'INSERT INTO settings (key, value, category, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [key, value, category, created_at, updated_at]
      );
      
      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Setting created successfully'
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating setting:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error creating setting',
      error: error.message
    });
  }
}

/**
 * Update a setting
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
export async function updateSetting(req, res) {
  try {
    const { id } = req.params;
    const { value } = req.body;
    
    // Validate required fields
    if (!value) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: value'
      });
    }
    
    const updated_at = new Date();
    
    const client = await pool.connect();
    
    try {
      // Check if the setting exists
      const checkResult = await client.query('SELECT * FROM settings WHERE id = $1', [id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Setting with ID ${id} not found`
        });
      }
      
      // Update the setting
      const result = await client.query(
        'UPDATE settings SET value = $1, updated_at = $2 WHERE id = $3 RETURNING *',
        [value, updated_at, id]
      );
      
      res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'Setting updated successfully'
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating setting:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error updating setting',
      error: error.message
    });
  }
}

/**
 * Delete a setting
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
export async function deleteSetting(req, res) {
  try {
    const { id } = req.params;
    
    const client = await pool.connect();
    
    try {
      // Check if the setting exists
      const checkResult = await client.query('SELECT * FROM settings WHERE id = $1', [id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: `Setting with ID ${id} not found`
        });
      }
      
      // Delete the setting
      await client.query('DELETE FROM settings WHERE id = $1', [id]);
      
      res.status(200).json({
        success: true,
        message: `Setting with ID ${id} deleted successfully`
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting setting:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error deleting setting',
      error: error.message
    });
  }
}
