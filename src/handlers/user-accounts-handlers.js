/**
 * User Accounts Handlers
 * Provides API endpoints for user accounts
 */

import { pool } from '../lib/postgres.js';
import { v4 as uuidv4 } from 'uuid';

// Get all user accounts
export async function getUserAccounts(req, res) {
  try {
    const result = await pool.query(`
      SELECT ua.*, u.email, u.full_name
      FROM user_accs ua
      JOIN users u ON ua.user_id = u.id
      ORDER BY u.full_name
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting user accounts:', error);
    res.status(500).json({ error: 'Failed to get user accounts' });
  }
}

// Get a user account by user ID
export async function getUserAccountByUserId(req, res) {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(`
      SELECT ua.*, u.email, u.full_name
      FROM user_accs ua
      JOIN users u ON ua.user_id = u.id
      WHERE ua.user_id = $1
    `, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting user account:', error);
    res.status(500).json({ error: 'Failed to get user account' });
  }
}

// Update a user account
export async function updateUserAccount(req, res) {
  try {
    const { userId } = req.params;
    const { theme, notification_preferences, dashboard_layout } = req.body;
    
    // Check if user account exists
    const checkResult = await pool.query('SELECT * FROM user_accs WHERE user_id = $1', [userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found' });
    }
    
    // Update the user account
    const updateFields = [];
    const values = [];
    let valueIndex = 1;
    
    if (theme !== undefined) {
      updateFields.push(`theme = $${valueIndex}`);
      values.push(theme);
      valueIndex++;
    }
    
    if (notification_preferences !== undefined) {
      updateFields.push(`notification_preferences = $${valueIndex}`);
      values.push(notification_preferences);
      valueIndex++;
    }
    
    if (dashboard_layout !== undefined) {
      updateFields.push(`dashboard_layout = $${valueIndex}`);
      values.push(dashboard_layout);
      valueIndex++;
    }
    
    // Add updated_at
    updateFields.push(`updated_at = $${valueIndex}`);
    values.push(new Date());
    valueIndex++;
    
    // Add user_id for WHERE clause
    values.push(userId);
    
    const result = await pool.query(`
      UPDATE user_accs
      SET ${updateFields.join(', ')}
      WHERE user_id = $${valueIndex}
      RETURNING *
    `, values);
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user account:', error);
    res.status(500).json({ error: 'Failed to update user account' });
  }
}
