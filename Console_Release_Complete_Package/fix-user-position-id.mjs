/**
 * Fix user position_id field and position relationships
 * This script:
 * 1. Adds the position_id field to the users table if it doesn't exist
 * 2. Creates a complete positions table with all necessary fields
 * 3. Establishes proper foreign key relationships
 * 4. Populates positions with default data
 * 5. Updates users with valid position references
 */

import { Pool } from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

// PostgreSQL connection configuration
const pgConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crm_db',
  user: process.env.POSTGRES_USER || 'crm_user',
  password: process.env.POSTGRES_PASSWORD || 'your_strong_password_here'
};

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Log a message with color
 * @param {string} message - Message to log
 * @param {string} color - Color to use
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Log a section header
 * @param {string} title - Section title
 */
function logSection(title) {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log('='.repeat(80));
}

/**
 * Log a success message
 * @param {string} message - Success message
 */
function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

/**
 * Log an error message
 * @param {string} message - Error message
 */
function logError(message) {
  log(`❌ ${message}`, colors.red);
}

/**
 * Log a warning message
 * @param {string} message - Warning message
 */
function logWarning(message) {
  log(`⚠️ ${message}`, colors.yellow);
}

/**
 * Log an info message
 * @param {string} message - Info message
 */
function logInfo(message) {
  log(`ℹ️ ${message}`, colors.blue);
}

/**
 * Check if the position_id field exists in the users table
 * @param {Pool} pool - PostgreSQL connection pool
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
 * @param {Pool} pool - PostgreSQL connection pool
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
 * @param {Pool} pool - PostgreSQL connection pool
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
 * Create the positions table with all necessary fields
 * @param {Pool} pool - PostgreSQL connection pool
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
    logError(`Error creating positions table: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Update users with appropriate positions based on their role
 * @param {Pool} pool - PostgreSQL connection pool
 * @returns {Promise<void>}
 */
async function updateUsersWithPositions(pool) {
  const client = await pool.connect();
  
  try {
    logInfo('Updating users with appropriate positions...');
    
    // Get all positions
    const positionsResult = await client.query(`
      SELECT id, name, level FROM positions ORDER BY level
    `);
    
    if (positionsResult.rows.length === 0) {
      throw new Error('No positions found');
    }
    
    const positions = positionsResult.rows;
    
    // Find position IDs for different roles
    const agentPosition = positions.find(p => p.name === 'Agent');
    const adminPosition = positions.find(p => p.name === 'Admin');
    
    if (!agentPosition || !adminPosition) {
      throw new Error('Required positions not found');
    }
    
    // Update admin users
    const updateAdminResult = await client.query(`
      UPDATE users
      SET position_id = $1
      WHERE role = 'admin' AND (position_id IS NULL OR position_id != $1)
      RETURNING id, email, role
    `, [adminPosition.id]);
    
    logSuccess(`Updated ${updateAdminResult.rows.length} admin users with Admin position`);
    
    // Log the updated admin users
    if (updateAdminResult.rows.length > 0) {
      logInfo('Updated admin users:');
      
      updateAdminResult.rows.forEach(user => {
        console.log(`- ${user.id}: ${user.email} (${user.role})`);
      });
    }
    
    // Update agent users
    const updateAgentResult = await client.query(`
      UPDATE users
      SET position_id = $1
      WHERE role = 'agent' AND (position_id IS NULL OR position_id != $1)
      RETURNING id, email, role
    `, [agentPosition.id]);
    
    logSuccess(`Updated ${updateAgentResult.rows.length} agent users with Agent position`);
    
    // Log the updated agent users
    if (updateAgentResult.rows.length > 0) {
      logInfo('Updated agent users:');
      
      updateAgentResult.rows.forEach(user => {
        console.log(`- ${user.id}: ${user.email} (${user.role})`);
      });
    }
    
    // Update any remaining users without a position
    const updateRemainingResult = await client.query(`
      UPDATE users
      SET position_id = $1
      WHERE position_id IS NULL
      RETURNING id, email, role
    `, [agentPosition.id]);
    
    logSuccess(`Updated ${updateRemainingResult.rows.length} remaining users with default position`);
    
    // Log the updated remaining users
    if (updateRemainingResult.rows.length > 0) {
      logInfo('Updated remaining users:');
      
      updateRemainingResult.rows.forEach(user => {
        console.log(`- ${user.id}: ${user.email} (${user.role})`);
      });
    }
  } catch (error) {
    logError(`Error updating users with positions: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Add foreign key constraint to ensure data integrity
 * @param {Pool} pool - PostgreSQL connection pool
 * @returns {Promise<void>}
 */
async function addForeignKeyConstraint(pool) {
  const client = await pool.connect();
  
  try {
    logInfo('Adding foreign key constraint to users table...');
    
    // First, ensure all users have a valid position_id
    await updateUsersWithPositions(pool);
    
    // Then add the foreign key constraint
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
 * @param {Pool} pool - PostgreSQL connection pool
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

/**
 * Main function
 */
async function main() {
  logSection('Enhanced User Position Fix');
  
  const pool = new Pool(pgConfig);
  
  try {
    logInfo('Connecting to PostgreSQL database...');
    logInfo(`Host: ${pgConfig.host}`);
    logInfo(`Port: ${pgConfig.port}`);
    logInfo(`Database: ${pgConfig.database}`);
    logInfo(`User: ${pgConfig.user}`);
    
    // Test the connection
    await pool.query('SELECT NOW()');
    logSuccess('Connected to PostgreSQL database');
    
    // Check if the position_id field exists
    const positionIdExists = await checkPositionIdField(pool);
    
    if (!positionIdExists) {
      // Add the position_id field
      await addPositionIdField(pool);
    }
    
    // Create the enhanced positions table
    await createPositionsTable(pool);
    
    // Update users with appropriate positions
    await updateUsersWithPositions(pool);
    
    // Add foreign key constraint
    await addForeignKeyConstraint(pool);
    
    // Create user_positions view
    await createUserPositionView(pool);
    
    logSection('Enhanced User Position Fix Completed Successfully');
  } catch (error) {
    logError(`Error: ${error.message}`);
    process.exit(1);
  } finally {
    await pool.end();
    logInfo('Database connection closed');
  }
}

// Run the main function
main();
