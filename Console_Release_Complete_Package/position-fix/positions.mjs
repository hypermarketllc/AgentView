/**
 * Position-related operations for position fix
 * Handles creating and managing position data
 */

import { logInfo, logSuccess, logError } from './utils/logger.mjs';

/**
 * Create the positions table with all necessary fields
 * @param {import('pg').Pool} pool - PostgreSQL connection pool
 * @returns {Promise<void>}
 */
async function createPositionsTable(pool) {
  const client = await pool.connect();
  
  try {
    logInfo('Creating enhanced positions table...');
    
    // Drop existing positions table if it exists
    await client.query(`
      DROP TABLE IF EXISTS positions CASCADE
    `);
    
    // Create a more complete positions table
    await client.query(`
      CREATE TABLE positions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        level INTEGER NOT NULL DEFAULT 1,
        description TEXT,
        permissions JSONB DEFAULT '{}',
        is_admin BOOLEAN DEFAULT FALSE,
        can_manage_users BOOLEAN DEFAULT FALSE,
        can_manage_deals BOOLEAN DEFAULT FALSE,
        can_view_analytics BOOLEAN DEFAULT FALSE,
        can_manage_settings BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    logSuccess('Enhanced positions table created');
    
    // Add default positions with proper permissions
    await addDefaultPositions(pool);
  } catch (error) {
    logError(`Error creating positions table: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Add default positions with proper permissions
 * @param {import('pg').Pool} pool - PostgreSQL connection pool
 * @returns {Promise<void>}
 */
async function addDefaultPositions(pool) {
  const client = await pool.connect();
  
  try {
    logInfo('Adding default positions with permissions...');
    
    await client.query(`
      INSERT INTO positions (
        name, 
        level, 
        description, 
        is_admin, 
        can_manage_users, 
        can_manage_deals, 
        can_view_analytics, 
        can_manage_settings,
        permissions
      )
      VALUES
        (
          'Agent', 
          1, 
          'Regular agent with basic permissions', 
          FALSE, 
          FALSE, 
          TRUE, 
          FALSE, 
          FALSE,
          '{"dashboard": {"view": true}, "post-deal": {"view": true, "create": true, "edit": true}, "book": {"view": true}}'
        ),
        (
          'Senior Agent', 
          2, 
          'Senior agent with additional permissions', 
          FALSE, 
          FALSE, 
          TRUE, 
          TRUE, 
          FALSE,
          '{"dashboard": {"view": true}, "post-deal": {"view": true, "create": true, "edit": true, "delete": true}, "book": {"view": true, "create": true, "edit": true}, "analytics": {"view": true}}'
        ),
        (
          'Team Lead', 
          3, 
          'Team leader with management permissions', 
          FALSE, 
          TRUE, 
          TRUE, 
          TRUE, 
          FALSE,
          '{"dashboard": {"view": true}, "users": {"view": true}, "post-deal": {"view": true, "create": true, "edit": true, "delete": true}, "book": {"view": true, "create": true, "edit": true, "delete": true}, "analytics": {"view": true}}'
        ),
        (
          'Manager', 
          4, 
          'Manager with extended permissions', 
          FALSE, 
          TRUE, 
          TRUE, 
          TRUE, 
          TRUE,
          '{"dashboard": {"view": true}, "users": {"view": true, "create": true, "edit": true}, "post-deal": {"view": true, "create": true, "edit": true, "delete": true}, "book": {"view": true, "create": true, "edit": true, "delete": true}, "analytics": {"view": true}, "settings": {"view": true}}'
        ),
        (
          'Director', 
          5, 
          'Director with high-level permissions', 
          TRUE, 
          TRUE, 
          TRUE, 
          TRUE, 
          TRUE,
          '{"dashboard": {"view": true}, "users": {"view": true, "create": true, "edit": true, "delete": true}, "post-deal": {"view": true, "create": true, "edit": true, "delete": true}, "book": {"view": true, "create": true, "edit": true, "delete": true}, "analytics": {"view": true}, "settings": {"view": true, "edit": true}}'
        ),
        (
          'Admin', 
          6, 
          'Administrator with full system access', 
          TRUE, 
          TRUE, 
          TRUE, 
          TRUE, 
          TRUE,
          '{"dashboard": {"view": true}, "users": {"view": true, "create": true, "edit": true, "delete": true}, "post-deal": {"view": true, "create": true, "edit": true, "delete": true}, "book": {"view": true, "create": true, "edit": true, "delete": true}, "analytics": {"view": true, "create": true, "edit": true, "delete": true}, "settings": {"view": true, "create": true, "edit": true, "delete": true}, "configuration": {"view": true, "create": true, "edit": true, "delete": true}, "monitoring": {"view": true, "create": true, "edit": true, "delete": true}}'
        )
    `);
    
    logSuccess('Default positions with permissions added');
  } catch (error) {
    logError(`Error adding default positions: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get all positions from the database
 * @param {import('pg').Pool} pool - PostgreSQL connection pool
 * @returns {Promise<Array>} Array of position objects
 */
async function getAllPositions(pool) {
  const client = await pool.connect();
  
  try {
    logInfo('Fetching all positions...');
    
    const result = await client.query(`
      SELECT id, name, level, permissions FROM positions ORDER BY level
    `);
    
    logSuccess(`Retrieved ${result.rows.length} positions`);
    
    return result.rows;
  } catch (error) {
    logError(`Error fetching positions: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
}

export {
  createPositionsTable,
  addDefaultPositions,
  getAllPositions
};
