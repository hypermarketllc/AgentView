/**
 * User Settings Handlers
 * 
 * This module provides handlers for user settings API endpoints.
 */

import { pool } from '../lib/postgres.js';
import { handleError } from '../lib/error-handler.js';

/**
 * Get user settings for the authenticated user
 */
export async function getUserSettings(req, res) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = await pool.query(
      'SELECT * FROM user_accs WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      // Create default settings if none exist
      const defaultSettings = {
        theme: 'light',
        notification_preferences: { email: true, sms: false, push: true },
        dashboard_layout: { layout: 'default', widgets: ['deals', 'notifications'] }
      };
      
      const insertResult = await pool.query(
        `INSERT INTO user_accs 
         (id, user_id, theme, notification_preferences, dashboard_layout, created_at, updated_at)
         VALUES 
         (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
         RETURNING *`,
        [userId, defaultSettings.theme, defaultSettings.notification_preferences, defaultSettings.dashboard_layout]
      );
      
      return res.json(insertResult.rows[0]);
    }
    
    return res.json(result.rows[0]);
  } catch (error) {
    return handleError(error, req, res);
  }
}

/**
 * Update user settings for the authenticated user
 */
export async function updateUserSettings(req, res) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { theme, notification_preferences, dashboard_layout } = req.body;
    
    // Check if user settings exist
    const checkResult = await pool.query(
      'SELECT id FROM user_accs WHERE user_id = $1',
      [userId]
    );
    
    if (checkResult.rows.length === 0) {
      // Create new settings
      const insertResult = await pool.query(
        `INSERT INTO user_accs 
         (id, user_id, theme, notification_preferences, dashboard_layout, created_at, updated_at)
         VALUES 
         (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
         RETURNING *`,
        [userId, theme, notification_preferences, dashboard_layout]
      );
      
      return res.json(insertResult.rows[0]);
    } else {
      // Update existing settings
      const updateResult = await pool.query(
        `UPDATE user_accs 
         SET theme = COALESCE($1, theme),
             notification_preferences = COALESCE($2, notification_preferences),
             dashboard_layout = COALESCE($3, dashboard_layout),
             updated_at = NOW()
         WHERE user_id = $4
         RETURNING *`,
        [theme, notification_preferences, dashboard_layout, userId]
      );
      
      return res.json(updateResult.rows[0]);
    }
  } catch (error) {
    return handleError(error, req, res);
  }
}

/**
 * Delete user settings for the authenticated user
 */
export async function deleteUserSettings(req, res) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    await pool.query(
      'DELETE FROM user_accs WHERE user_id = $1',
      [userId]
    );
    
    return res.json({ success: true, message: 'User settings deleted successfully' });
  } catch (error) {
    return handleError(error, req, res);
  }
}
