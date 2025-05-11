/**
 * Database schema operations for position fix
 * Handles checking and creating tables and fields
 */

import { logInfo, logSuccess, logWarning, logError } from './utils/logger.mjs';

/**
 * Check if the position_id field exists in the users table
 * @param {import('pg').Pool} pool - PostgreSQL connection pool
 * @returns {Promise<boolean>} True if the field exists
 */
async function checkPositionIdField(pool) {
  const client = await pool.connect();
  
  try {
    logInfo('Checking if position_id field exists in users table...');
    
    const result = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name = 'position_id'
    `);
    
    const exists = result.rows.length > 0;
    
    if (exists) {
      logSuccess('position_id field already exists in users table');
    } else {
      logWarning('position_id field does not exist in users table');
    }
    
    return exists;
  } catch (error) {
    logError(`Error checking position_id field: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Add the position_id field to the users table
 * @param {import('pg').Pool} pool - PostgreSQL connection pool
 * @returns {Promise<void>}
 */
async function addPositionIdField(pool) {
  const client = await pool.connect();
  
  try {
    logInfo('Adding position_id field to users table...');
    
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS position_id INTEGER
    `);
    
    logSuccess('position_id field added to users table');
  } catch (error) {
    logError(`Error adding position_id field: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Check if the positions table exists
 * @param {import('pg').Pool} pool - PostgreSQL connection pool
 * @returns {Promise<boolean>} True if the table exists
 */
async function checkPositionsTable(pool) {
  const client = await pool.connect();
  
  try {
    logInfo('Checking if positions table exists...');
    
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'positions'
    `);
    
    const exists = result.rows.length > 0;
    
    if (exists) {
      logSuccess('positions table exists');
    } else {
      logWarning('positions table does not exist');
    }
    
    return exists;
  } catch (error) {
    logError(`Error checking positions table: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Add foreign key constraint to ensure data integrity
 * @param {import('pg').Pool} pool - PostgreSQL connection pool
 * @returns {Promise<void>}
 */
async function addForeignKeyConstraint(pool) {
  const client = await pool.connect();
  
  try {
    logInfo('Adding foreign key constraint to users table...');
    
    // Add the foreign key constraint
    await client.query(`
      ALTER TABLE users
      ADD CONSTRAINT fk_user_position
      FOREIGN KEY (position_id)
      REFERENCES positions(id)
      ON DELETE SET NULL
      ON UPDATE CASCADE
    `);
    
    logSuccess('Foreign key constraint added to users table');
  } catch (error) {
    // If the constraint already exists, that's fine
    if (error.message.includes('already exists')) {
      logWarning('Foreign key constraint already exists');
    } else {
      logError(`Error adding foreign key constraint: ${error.message}`);
      throw error;
    }
  } finally {
    client.release();
  }
}

/**
 * Create a view to join users with their positions
 * @param {import('pg').Pool} pool - PostgreSQL connection pool
 * @returns {Promise<void>}
 */
async function createUserPositionView(pool) {
  const client = await pool.connect();
  
  try {
    logInfo('Creating user_positions view...');
    
    // Drop the view if it exists
    await client.query(`
      DROP VIEW IF EXISTS user_positions
    `);
    
    // Create the view
    await client.query(`
      CREATE VIEW user_positions AS
      SELECT 
        u.id,
        u.email,
        u.role,
        u.position_id,
        p.name AS position_name,
        p.level AS position_level,
        p.permissions,
        p.is_admin,
        p.can_manage_users,
        p.can_manage_deals,
        p.can_view_analytics,
        p.can_manage_settings
      FROM 
        users u
      LEFT JOIN 
        positions p ON u.position_id = p.id
    `);
    
    logSuccess('user_positions view created');
  } catch (error) {
    logError(`Error creating user_positions view: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
}

export {
  checkPositionIdField,
  addPositionIdField,
  checkPositionsTable,
  addForeignKeyConstraint,
  createUserPositionView
};
