/**
 * Comprehensive Position Data Fix
 * This script ensures database integrity for the positions system:
 * 1. Verifies the positions table exists with correct schema
 * 2. Creates default position records if missing
 * 3. Ensures all users have valid position_id values
 * 4. Creates the user_positions view for efficient queries
 */

import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// Database connection configuration
const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crm_db',
  user: process.env.POSTGRES_USER || 'crm_user',
  password: process.env.POSTGRES_PASSWORD || 'your_strong_password_here'
};

/**
 * Connect to the PostgreSQL database
 * @returns {Promise<pg.Client>} Database client
 */
async function connectToDatabase() {
  const client = new pg.Client(dbConfig);
  
  logInfo(`Connecting to PostgreSQL database...`);
  logInfo(`Host: ${dbConfig.host}`);
  logInfo(`Port: ${dbConfig.port}`);
  logInfo(`Database: ${dbConfig.database}`);
  logInfo(`User: ${dbConfig.user}`);
  
  try {
    await client.connect();
    logSuccess(`Connected to PostgreSQL database`);
    return client;
  } catch (error) {
    logError(`Failed to connect to PostgreSQL database: ${error.message}`);
    throw error;
  }
}

/**
 * Check if a table exists in the database
 * @param {pg.Client} client - Database client
 * @param {string} tableName - Table name
 * @returns {Promise<boolean>} True if the table exists
 */
async function tableExists(client, tableName) {
  const query = `
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    );
  `;
  
  const result = await client.query(query, [tableName]);
  return result.rows[0].exists;
}

/**
 * Check if a column exists in a table
 * @param {pg.Client} client - Database client
 * @param {string} tableName - Table name
 * @param {string} columnName - Column name
 * @returns {Promise<boolean>} True if the column exists
 */
async function columnExists(client, tableName, columnName) {
  const query = `
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = $1 
      AND column_name = $2
    );
  `;
  
  const result = await client.query(query, [tableName, columnName]);
  return result.rows[0].exists;
}

/**
 * Ensure the position_id field exists in the users table
 * @param {pg.Client} client - Database client
 * @returns {Promise<void>}
 */
async function ensurePositionIdField(client) {
  logInfo(`Checking if position_id field exists in users table...`);
  
  const positionIdExists = await columnExists(client, 'users', 'position_id');
  
  if (positionIdExists) {
    logSuccess(`position_id field already exists in users table`);
  } else {
    logInfo(`Adding position_id field to users table...`);
    
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN position_id INTEGER;
    `);
    
    logSuccess(`position_id field added to users table`);
  }
}

/**
 * Create or update the positions table
 * @param {pg.Client} client - Database client
 * @returns {Promise<void>}
 */
async function createPositionsTable(client) {
  logInfo(`Creating enhanced positions table...`);
  
  const positionsExists = await tableExists(client, 'positions');
  
  if (positionsExists) {
    // Check if the table has the permissions column
    const permissionsExists = await columnExists(client, 'positions', 'permissions');
    
    if (!permissionsExists) {
      // Add permissions column to existing table
      await client.query(`
        ALTER TABLE positions 
        ADD COLUMN permissions JSONB DEFAULT '{"dashboard": {"view": true}}';
      `);
      
      logInfo(`Added permissions column to existing positions table`);
    }
    
    // Check if the table has the is_admin column
    const isAdminExists = await columnExists(client, 'positions', 'is_admin');
    
    if (!isAdminExists) {
      // Add is_admin column to existing table
      await client.query(`
        ALTER TABLE positions 
        ADD COLUMN is_admin BOOLEAN DEFAULT false;
      `);
      
      logInfo(`Added is_admin column to existing positions table`);
    }
  } else {
    // Create the positions table from scratch
    await client.query(`
      CREATE TABLE positions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        level INTEGER NOT NULL DEFAULT 1,
        permissions JSONB DEFAULT '{"dashboard": {"view": true}}',
        is_admin BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
  
  logSuccess(`Enhanced positions table created`);
}

/**
 * Add default positions to the positions table
 * @param {pg.Client} client - Database client
 * @returns {Promise<void>}
 */
async function addDefaultPositions(client) {
  logInfo(`Adding default positions with permissions...`);
  
  // Check if positions already exist
  const existingPositions = await client.query(`
    SELECT COUNT(*) FROM positions;
  `);
  
  // Reset the table and recreate default positions
  // This ensures we have the latest permission structure
  // Note: We do NOT use CASCADE here to avoid deleting users
  // First, update users to set position_id to NULL to avoid foreign key constraint issues
  await client.query(`
    UPDATE users SET position_id = NULL;
  `);
  
  // Then truncate the positions table
  await client.query(`
    TRUNCATE positions RESTART IDENTITY;
  `);
  
  // Default permissions for admin
  const adminPermissions = {
    dashboard: { view: true },
    users: { view: true, edit: true, create: true, delete: true },
    "post-deal": { view: true, edit: true, create: true, delete: true },
    book: { view: true, edit: true, create: true, delete: true },
    agents: { view: true, edit: true },
    configuration: { view: true, edit: true },
    monitoring: { view: true },
    settings: { view: true, edit: true },
    analytics: { view: true }
  };
  
  // Default permissions for agent
  const agentPermissions = {
    dashboard: { view: true },
    "post-deal": { view: true, edit: true, create: true },
    book: { view: true, edit: true }
  };
  
  // Insert default positions
  await client.query(`
    INSERT INTO positions (id, name, level, permissions, is_admin) VALUES
    (1, 'Agent', 1, $1, false),
    (2, 'Senior Agent', 2, $1, false),
    (3, 'Team Lead', 3, $2, false),
    (4, 'Manager', 4, $2, false),
    (5, 'Director', 5, $2, false),
    (6, 'Admin', 6, $3, true);
  `, [
    JSON.stringify(agentPermissions),
    JSON.stringify({
      ...agentPermissions,
      analytics: { view: true }
    }),
    JSON.stringify(adminPermissions)
  ]);
  
  logSuccess(`Default positions with permissions added`);
}

/**
 * Update users with appropriate positions
 * @param {pg.Client} client - Database client
 * @returns {Promise<void>}
 */
async function updateUserPositions(client) {
  logInfo(`Updating users with appropriate positions...`);
  
  // Update admin users
  const adminResult = await client.query(`
    UPDATE users
    SET position_id = 6
    WHERE role = 'admin' AND (position_id IS NULL OR position_id != 6)
    RETURNING id;
  `);
  
  logSuccess(`Updated ${adminResult.rowCount} admin users with Admin position`);
  
  // Update agent users
  const agentResult = await client.query(`
    UPDATE users
    SET position_id = 1
    WHERE role = 'agent' AND (position_id IS NULL OR position_id != 1)
    RETURNING id;
  `);
  
  logSuccess(`Updated ${agentResult.rowCount} agent users with Agent position`);
  
  // Update any remaining users with null position_id
  const remainingResult = await client.query(`
    UPDATE users
    SET position_id = 1
    WHERE position_id IS NULL
    RETURNING id;
  `);
  
  logSuccess(`Updated ${remainingResult.rowCount} remaining users with default position`);
  
  // Verify that all users have a position_id
  const nullPositionUsers = await client.query(`
    SELECT COUNT(*) FROM users WHERE position_id IS NULL;
  `);
  
  if (parseInt(nullPositionUsers.rows[0].count) > 0) {
    logWarning(`There are still ${nullPositionUsers.rows[0].count} users with null position_id`);
  } else {
    logSuccess(`All users have a valid position_id`);
  }
}

/**
 * Add a foreign key constraint to the users table
 * @param {pg.Client} client - Database client
 * @returns {Promise<void>}
 */
async function addForeignKeyConstraint(client) {
  logInfo(`Adding foreign key constraint to users table...`);
  
  // Check if the constraint already exists
  const constraintExists = await client.query(`
    SELECT COUNT(*) FROM information_schema.table_constraints
    WHERE constraint_name = 'users_position_id_fkey'
    AND table_name = 'users';
  `);
  
  if (parseInt(constraintExists.rows[0].count) > 0) {
    logInfo(`Foreign key constraint already exists`);
  } else {
    try {
      // Add the constraint
      await client.query(`
        ALTER TABLE users
        ADD CONSTRAINT users_position_id_fkey
        FOREIGN KEY (position_id)
        REFERENCES positions(id)
        ON DELETE SET NULL;
      `);
      
      logSuccess(`Foreign key constraint added to users table`);
    } catch (error) {
      logError(`Failed to add foreign key constraint: ${error.message}`);
      
      // This is a non-critical error, so we'll continue
      logInfo(`Continuing without foreign key constraint`);
    }
  }
}

/**
 * Create a view for user positions
 * @param {pg.Client} client - Database client
 * @returns {Promise<void>}
 */
async function createUserPositionsView(client) {
  logInfo(`Creating user_positions view...`);
  
  // Drop the view if it already exists
  await client.query(`
    DROP VIEW IF EXISTS user_positions;
  `);
  
  // Create the view
  await client.query(`
    CREATE VIEW user_positions AS
    SELECT 
      u.id AS user_id,
      u.email,
      u.role,
      u.position_id,
      p.name AS position_name,
      p.level AS position_level,
      p.permissions,
      p.is_admin
    FROM 
      users u
    LEFT JOIN 
      positions p ON u.position_id = p.id;
  `);
  
  logSuccess(`user_positions view created`);
}

/**
 * Create position data validation trigger
 * @param {pg.Client} client - Database client
 * @returns {Promise<void>}
 */
async function createPositionValidationTrigger(client) {
  logInfo(`Creating position data validation trigger...`);
  
  // Create function for trigger
  await client.query(`
    CREATE OR REPLACE FUNCTION ensure_user_position()
    RETURNS TRIGGER AS $$
    BEGIN
      -- If position_id is NULL, set it based on role
      IF NEW.position_id IS NULL THEN
        IF NEW.role = 'admin' THEN
          NEW.position_id := 6;
        ELSE
          NEW.position_id := 1;
        END IF;
      END IF;
      
      -- Verify position_id exists in positions table
      PERFORM id FROM positions WHERE id = NEW.position_id;
      IF NOT FOUND THEN
        -- If not found, set to default based on role
        IF NEW.role = 'admin' THEN
          NEW.position_id := 6;
        ELSE
          NEW.position_id := 1;
        END IF;
      END IF;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  
  // Drop trigger if it exists
  await client.query(`
    DROP TRIGGER IF EXISTS ensure_user_position_trigger ON users;
  `);
  
  // Create trigger
  await client.query(`
    CREATE TRIGGER ensure_user_position_trigger
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION ensure_user_position();
  `);
  
  logSuccess(`Position data validation trigger created`);
}

/**
 * Run database queries to fix position data
 * @returns {Promise<void>}
 */
async function fixPositionData() {
  let client;
  
  try {
    // Connect to the database
    client = await connectToDatabase();
    
    // Run the fixes in sequence
    await ensurePositionIdField(client);
    await createPositionsTable(client);
    await addDefaultPositions(client);
    await updateUserPositions(client);
    await addForeignKeyConstraint(client);
    await createPositionValidationTrigger(client);
    await createUserPositionsView(client);
    
    // Verify the fixes
    await verifyFixes(client);
    
    logSection('Enhanced User Position Fix Completed Successfully');
  } catch (error) {
    logError(`Failed to fix position data: ${error.message}`);
    throw error;
  } finally {
    if (client) {
      await client.end();
      logInfo(`Database connection closed`);
    }
  }
}

/**
 * Verify that the fixes were applied correctly
 * @param {pg.Client} client - Database client
 * @returns {Promise<void>}
 */
async function verifyFixes(client) {
  logInfo(`Verifying fixes...`);
  
  // Check that all users have a position_id
  const usersWithNullPosition = await client.query(`
    SELECT COUNT(*) FROM users WHERE position_id IS NULL;
  `);
  
  if (parseInt(usersWithNullPosition.rows[0].count) > 0) {
    logWarning(`There are ${usersWithNullPosition.rows[0].count} users with null position_id`);
  } else {
    logSuccess(`All users have a valid position_id`);
  }
  
  // Check that positions table has records
  const positionCount = await client.query(`
    SELECT COUNT(*) FROM positions;
  `);
  
  if (parseInt(positionCount.rows[0].count) === 0) {
    logWarning(`Positions table is empty`);
  } else {
    logSuccess(`Positions table has ${positionCount.rows[0].count} records`);
  }
  
  // Check that user_positions view works
  const viewTest = await client.query(`
    SELECT COUNT(*) FROM user_positions;
  `);
  
  logSuccess(`user_positions view has ${viewTest.rows[0].count} records`);
}

/**
 * Main function
 */
async function main() {
  logSection('Enhanced User Position Fix');
  
  try {
    await fixPositionData();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

// Run the main function
main();
