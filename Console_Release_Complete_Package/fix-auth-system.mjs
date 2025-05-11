/**
 * Comprehensive Authentication System Fix
 * This script fixes the authentication system by:
 * 1. Ensuring the users table exists with correct schema
 * 2. Creating default users if they don't exist
 * 3. Ensuring users have correct password hashes
 * 4. Ensuring users have valid position_id values
 */

import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// PostgreSQL connection configuration
const pgConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crm_db',
  user: process.env.POSTGRES_USER || 'crm_user',
  password: process.env.POSTGRES_PASSWORD || 'your_strong_password_here'
};

// Default password for users
const DEFAULT_PASSWORD = 'Agent123!';

console.log('=== Comprehensive Authentication System Fix ===');
console.log('PostgreSQL connection configuration:');
console.log(`Host: ${pgConfig.host}`);
console.log(`Port: ${pgConfig.port}`);
console.log(`Database: ${pgConfig.database}`);
console.log(`User: ${pgConfig.user}`);

async function fixAuthSystem() {
  // Create a new PostgreSQL connection pool
  const pool = new Pool(pgConfig);
  const client = await pool.connect();
  
  try {
    console.log('\nConnected to PostgreSQL database');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Step 1: Check if users table exists
    console.log('\nStep 1: Checking if users table exists...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('Users table does not exist. Creating it...');
      
      // Read and execute the SQL script to create users table
      const sqlFilePath = path.join(__dirname, 'sql', 'create_users_table.sql');
      const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
      await client.query(sqlScript);
      
      console.log('Users table created successfully');
    } else {
      console.log('Users table exists');
    }
    
    // Step 2: Check if positions table exists
    console.log('\nStep 2: Checking if positions table exists...');
    const positionsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'positions'
      );
    `);
    
    if (!positionsCheck.rows[0].exists) {
      console.log('Positions table does not exist. Creating it...');
      
      // Create the positions table
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
      
      console.log('Positions table created successfully');
    } else {
      console.log('Positions table exists');
    }
    
    // Step 3: Ensure position_id field exists in users table
    console.log('\nStep 3: Ensuring position_id field exists in users table...');
    const positionIdCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
        AND column_name = 'position_id'
      );
    `);
    
    if (!positionIdCheck.rows[0].exists) {
      console.log('Adding position_id field to users table...');
      
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN position_id INTEGER;
      `);
      
      console.log('position_id field added to users table');
    } else {
      console.log('position_id field already exists in users table');
    }
    
    // Step 4: Add default positions if they don't exist
    console.log('\nStep 4: Adding default positions...');
    
    // Check if positions already exist
    const existingPositions = await client.query(`
      SELECT COUNT(*) FROM positions;
    `);
    
    if (parseInt(existingPositions.rows[0].count) === 0) {
      console.log('No positions found. Adding default positions...');
      
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
      
      console.log('Default positions added successfully');
    } else {
      console.log(`Found ${existingPositions.rows[0].count} existing positions`);
    }
    
    // Step 5: Add default users if they don't exist
    console.log('\nStep 5: Adding default users...');
    
    // Check if users already exist
    const existingUsers = await client.query(`
      SELECT COUNT(*) FROM users;
    `);
    
    if (parseInt(existingUsers.rows[0].count) === 0) {
      console.log('No users found. Adding default users...');
      
      // Generate password hashes
      const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      
      // Insert default admin user
      await client.query(`
        INSERT INTO users (email, password, full_name, role, is_active, position_id)
        VALUES ('admin@americancoveragecenter.com', $1, 'Admin User', 'admin', true, 6);
      `, [passwordHash]);
      
      // Insert default agent user
      await client.query(`
        INSERT INTO users (email, password, full_name, role, is_active, position_id)
        VALUES ('agent@example.com', $1, 'Agent User', 'agent', true, 1);
      `, [passwordHash]);
      
      console.log('Default users added successfully');
    } else {
      console.log(`Found ${existingUsers.rows[0].count} existing users`);
      
      // Update existing users with correct password hash
      console.log('Updating existing users with correct password hash...');
      
      // Get all users
      const users = await client.query('SELECT id, email, role FROM users');
      
      // Update each user's password hash
      for (const user of users.rows) {
        const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
        
        await client.query(`
          UPDATE users 
          SET password = $1, is_active = true 
          WHERE id = $2
        `, [passwordHash, user.id]);
        
        console.log(`Updated password hash for user ${user.email}`);
      }
    }
    
    // Step 6: Ensure users have valid position_id values
    console.log('\nStep 6: Ensuring users have valid position_id values...');
    
    // Update admin users
    const adminResult = await client.query(`
      UPDATE users
      SET position_id = 6
      WHERE role = 'admin' AND (position_id IS NULL OR position_id != 6)
      RETURNING id;
    `);
    
    console.log(`Updated ${adminResult.rowCount} admin users with Admin position`);
    
    // Update agent users
    const agentResult = await client.query(`
      UPDATE users
      SET position_id = 1
      WHERE role = 'agent' AND (position_id IS NULL OR position_id != 1)
      RETURNING id;
    `);
    
    console.log(`Updated ${agentResult.rowCount} agent users with Agent position`);
    
    // Update any remaining users with null position_id
    const remainingResult = await client.query(`
      UPDATE users
      SET position_id = 1
      WHERE position_id IS NULL
      RETURNING id;
    `);
    
    console.log(`Updated ${remainingResult.rowCount} remaining users with default position`);
    
    // Step 7: Add foreign key constraint if it doesn't exist
    console.log('\nStep 7: Adding foreign key constraint...');
    
    // Check if the constraint already exists
    const constraintExists = await client.query(`
      SELECT COUNT(*) FROM information_schema.table_constraints
      WHERE constraint_name = 'users_position_id_fkey'
      AND table_name = 'users';
    `);
    
    if (parseInt(constraintExists.rows[0].count) > 0) {
      console.log('Foreign key constraint already exists');
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
        
        console.log('Foreign key constraint added to users table');
      } catch (error) {
        console.error(`Failed to add foreign key constraint: ${error.message}`);
        console.log('Continuing without foreign key constraint');
      }
    }
    
    // Step 8: Create user_positions view if it doesn't exist
    console.log('\nStep 8: Creating user_positions view...');
    
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
    
    console.log('user_positions view created successfully');
    
    // Step 9: Verify the fixes
    console.log('\nStep 9: Verifying fixes...');
    
    // Check that all users have a position_id
    const usersWithNullPosition = await client.query(`
      SELECT COUNT(*) FROM users WHERE position_id IS NULL;
    `);
    
    if (parseInt(usersWithNullPosition.rows[0].count) > 0) {
      console.log(`Warning: There are ${usersWithNullPosition.rows[0].count} users with null position_id`);
    } else {
      console.log('All users have a valid position_id');
    }
    
    // Check that positions table has records
    const positionCount = await client.query(`
      SELECT COUNT(*) FROM positions;
    `);
    
    console.log(`Positions table has ${positionCount.rows[0].count} records`);
    
    // Check that users table has records
    const userCount = await client.query(`
      SELECT COUNT(*) FROM users;
    `);
    
    console.log(`Users table has ${userCount.rows[0].count} records`);
    
    // Check that user_positions view works
    const viewTest = await client.query(`
      SELECT COUNT(*) FROM user_positions;
    `);
    
    console.log(`user_positions view has ${viewTest.rows[0].count} records`);
    
    // List all users
    const usersList = await client.query(`
      SELECT u.id, u.email, u.role, u.is_active, p.name AS position_name
      FROM users u
      LEFT JOIN positions p ON u.position_id = p.id
    `);
    
    console.log('\nUsers in the database:');
    usersList.rows.forEach(user => {
      console.log(`- ${user.id}: ${user.email} (${user.role}) - Active: ${user.is_active} - Position: ${user.position_name || 'None'}`);
    });
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('\nAuthentication system fix completed successfully');
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error fixing authentication system:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the fix
fixAuthSystem()
  .then(() => {
    console.log('\nScript completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
