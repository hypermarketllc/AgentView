/**
 * Settings Handlers
 * Provides API endpoints for application settings
 */

import { pool } from '../lib/postgres.js';
import { v4 as uuidv4 } from 'uuid';

// Get all settings
export async function getAllSettings(req, res) {
  try {
    const result = await pool.query('SELECT * FROM settings ORDER BY category, key');
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
}

// Get settings by category
export async function getSettingsByCategory(req, res) {
  try {
    const { category } = req.params;
    
    const result = await pool.query('SELECT * FROM settings WHERE category = $1 ORDER BY key', [category]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting settings by category:', error);
    res.status(500).json({ error: 'Failed to get settings by category' });
  }
}

// Get a setting by key and category
export async function getSettingByKeyAndCategory(req, res) {
  try {
    const { key, category } = req.params;
    
    const result = await pool.query('SELECT * FROM settings WHERE key = $1 AND category = $2', [key, category]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting setting:', error);
    res.status(500).json({ error: 'Failed to get setting' });
  }
}

// Create or update a setting
export async function upsertSetting(req, res) {
  try {
    const { key, value, category } = req.body;
    
    // Validate required fields
    if (!key || value === undefined || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if setting exists
    const checkResult = await pool.query('SELECT * FROM settings WHERE key = $1 AND category = $2', [key, category]);
    
    if (checkResult.rows.length === 0) {
      // Create new setting
      const id = uuidv4();
      const created_at = new Date();
      
      const result = await pool.query(
        'INSERT INTO settings (id, key, value, category, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $5) RETURNING *',
        [id, key, value, category, created_at]
      );
      
      return res.status(201).json(result.rows[0]);
    } else {
      // Update existing setting
      const updated_at = new Date();
      
      const result = await pool.query(
        'UPDATE settings SET value = $1, updated_at = $2 WHERE key = $3 AND category = $4 RETURNING *',
        [value, updated_at, key, category]
      );
      
      return res.json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error upserting setting:', error);
    res.status(500).json({ error: 'Failed to upsert setting' });
  }
}

// Delete a setting
export async function deleteSetting(req, res) {
  try {
    const { key, category } = req.params;
    
    const result = await pool.query('DELETE FROM settings WHERE key = $1 AND category = $2 RETURNING *', [key, category]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    res.json({ message: 'Setting deleted successfully', deleted: result.rows[0] });
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({ error: 'Failed to delete setting' });
  }
}
