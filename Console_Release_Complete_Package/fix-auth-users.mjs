/**
 * Script to fix authentication issues by ensuring users have correct password hashes
 * and position_id values
 */

import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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

// Test password
const DEFAULT_PASSWORD = 'Agent123!';

async function fixAuthUsers() {
  console.log('=== Authentication Users Fix ===');
  
  // Connect to the database
  const pool = new Pool(pgConfig);
  const client = await pool.connect();
  
  try {
    console.log('Connected to PostgreSQL database');
    
    // Check if users table exists
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
      const fs = await import('fs');
      const sqlFilePath = path.join(__dirname, 'sql', 'create_users_table.sql');
      const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
      await client.query(sqlScript);
      
      console.log('Users table created successfully');
    }
    
    // Get all users
    const usersResult = await client.query('SELECT * FROM users');
    console.log(`Found ${usersResult.rows.length} users in the database`);
    
    if (usersResult.rows.length === 0) {
      console.log('No users found. Creating default users...');
      
      // Create admin user
      const adminHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      await client.query(`
        INSERT INTO users (email, password, full_name, role, is_active)
        VALUES ('admin@americancoveragecenter.com', $1, 'Admin User', 'admin', true)
      `, [adminHash]);
      
      // Create agent user
      const agentHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      await client.query(`
        INSERT INTO users (email, password, full_name, role, is_active)
        VALUES ('agent@example.com', $2, 'Agent User', 'agent', true)
      `, [agentHash]);
      
      console.log('Default users created successfully');
    } else {
      console.log('Updating existing users...');
      
      // Update each user's password hash
      for (const user of usersResult.rows) {
        console.log(`Processing user: ${user.email} (ID: ${user.id})`);
        
        // Generate a new hash for the default password
        const newHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
        
        // Update the user's password and ensure is_active is true
        await client.query(`
          UPDATE users 
          SET password = $1, is_active = true 
          WHERE id = $2
        `, [newHash, user.id]);
        
        console.log(`Updated password hash for user ${user.email}`);
      }
    }
    
    // Check if positions table exists
    const positionsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'positions'
      );
    `);
    
    if (positionsCheck.rows[0].exists) {
      console.log('Positions table exists. Checking if users have position_id...');
      
      // Check if users table has position_id column
      const positionIdCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
          AND column_name = 'position_id'
        );
      `);
      
      if (positionIdCheck.rows[0].exists) {
        console.log('position_id column exists in users table');
        
        // Get default positions
        const adminPositionResult = await client.query(`
          SELECT id FROM positions WHERE name = 'Admin' OR is_admin = true LIMIT 1
        `);
        
        const agentPositionResult = await client.query(`
          SELECT id FROM positions WHERE name = 'Agent' AND is_admin = false LIMIT 1
        `);
        
        const defaultPositionResult = await client.query(`
          SELECT id FROM positions WHERE name = 'Default' OR level = 1 LIMIT 1
        `);
        
        // Set position IDs based on user roles
        if (adminPositionResult.rows.length > 0) {
          const adminPositionId = adminPositionResult.rows[0].id;
          await client.query(`
            UPDATE users SET position_id = $1 WHERE role = 'admin' AND (position_id IS NULL OR position_id = 0)
          `, [adminPositionId]);
          console.log(`Updated admin users with position_id ${adminPositionId}`);
        }
        
        if (agentPositionResult.rows.length > 0) {
          const agentPositionId = agentPositionResult.rows[0].id;
          await client.query(`
            UPDATE users SET position_id = $1 WHERE role = 'agent' AND (position_id IS NULL OR position_id = 0)
          `, [agentPositionId]);
          console.log(`Updated agent users with position_id ${agentPositionId}`);
        }
        
        if (defaultPositionResult.rows.length > 0) {
          const defaultPositionId = defaultPositionResult.rows[0].id;
          await client.query(`
            UPDATE users SET position_id = $1 WHERE position_id IS NULL OR position_id = 0
          `, [defaultPositionId]);
          console.log(`Updated remaining users with default position_id ${defaultPositionId}`);
        }
      }
    }
    
    // Verify users
    const updatedUsers = await client.query(`
      SELECT u.id, u.email, u.role, u.is_active, u.position_id, p.name as position_name
      FROM users u
      LEFT JOIN positions p ON u.position_id = p.id
    `);
    
    console.log('\nVerified users:');
    updatedUsers.rows.forEach(user => {
      console.log(`- ${user.id}: ${user.email} (${user.role}) - Active: ${user.is_active} - Position: ${user.position_name || 'None'}`);
    });
    
    console.log('\nAuthentication users fix completed successfully');
  } catch (error) {
    console.error('Error fixing authentication users:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the fix
fixAuthUsers()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
