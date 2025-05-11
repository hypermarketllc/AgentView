/**
 * User Accounts API Handlers
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const pool = new Pool();

/**
 * Get all user accounts
 */
export async function getUserAccounts(req, res) {
  try {
    const result = await pool.query('SELECT * FROM user_accs ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting user accounts:', error);
    res.status(500).json({ error: 'Failed to get user accounts' });
  }
}

/**
 * Get a user account by ID
 */
export async function getUserAccountById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM user_accs WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting user account:', error);
    res.status(500).json({ error: 'Failed to get user account' });
  }
}

/**
 * Create a new user account
 */
export async function createUserAccount(req, res) {
  try {
    const { username, email, role, status } = req.body;
    
    if (!username || !email || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await pool.query(
      'INSERT INTO user_accs (id, username, email, role, status, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
      [uuidv4(), username, email, role, status || 'active']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user account:', error);
    res.status(500).json({ error: 'Failed to create user account' });
  }
}

/**
 * Update a user account
 */
export async function updateUserAccount(req, res) {
  try {
    const { id } = req.params;
    const { username, email, role, status } = req.body;
    
    if (!username || !email || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await pool.query(
      'UPDATE user_accs SET username = $1, email = $2, role = $3, status = $4 WHERE id = $5 RETURNING *',
      [username, email, role, status || 'active', id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user account:', error);
    res.status(500).json({ error: 'Failed to update user account' });
  }
}

/**
 * Delete a user account
 */
export async function deleteUserAccount(req, res) {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM user_accs WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found' });
    }
    
    res.json({ message: 'User account deleted successfully' });
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({ error: 'Failed to delete user account' });
  }
}
