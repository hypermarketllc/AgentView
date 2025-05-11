/**
 * User Handlers
 * Handlers for user endpoints
 */

import { pool } from '../lib/postgres';

/**
 * Get user accounts
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export async function getUserAccs(req, res) {
  try {
    const result = await pool.query('SELECT * FROM user_accs ORDER BY created_at DESC');
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting user accounts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
