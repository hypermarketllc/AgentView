/**
 * sync-auth-users.js
 * This script ensures the auth_users table exists and contains entries for all users.
 */

import pg from 'pg';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get database configuration
const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'postgres',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
};

console.log('Database configuration:', dbConfig);

// Create a new pool
const pool = new pg.Pool(dbConfig);

// Default password for users without a password
const DEFAULT_PASSWORD = 'ChangeMe123!';
const SALT_ROUNDS = 10;

async function syncAuthUsers() {
  try {
    console.log('Connecting to database...');
    await pool.query('SELECT NOW()');
    console.log('Connected to database successfully.');
    
    // Check if auth_users table exists
    console.log('Checking if auth_users table exists...');
    const tableCheckResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'auth_users'
      );
    `);
    
    const tableExists = tableCheckResult.rows[0].exists;
    
    if (!tableExists) {
      console.log('auth_users table does not exist. Creating it...');
      
      // Read the SQL file to create the auth_users table
      const createTableSQL = fs.readFileSync(
        path.resolve('supabase-export/create_auth_tables.sql'),
        'utf8'
      );
      
      // Execute the SQL
      await pool.query(createTableSQL);
      console.log('auth_users table created successfully.');
    } else {
      console.log('auth_users table already exists.');
    }
    
    // Get all users from the users table
    console.log('Getting all users from the users table...');
    const usersResult = await pool.query('SELECT id, email FROM users');
    
    if (usersResult.rows.length === 0) {
      console.log('No users found in the users table.');
      return;
    }
    
    console.log(`Found ${usersResult.rows.length} users in the users table.`);
    
    // For each user, check if they have an entry in the auth_users table
    for (const user of usersResult.rows) {
      console.log(`Checking auth entry for user: ${user.email}`);
      
      const authUserResult = await pool.query(
        'SELECT * FROM auth_users WHERE id = $1',
        [user.id]
      );
      
      if (authUserResult.rows.length === 0) {
        console.log(`No auth entry found for user: ${user.email}. Creating one...`);
        
        // Hash the default password
        const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
        
        // Insert into auth_users
        await pool.query(
          'INSERT INTO auth_users (id, email, password_hash) VALUES ($1, $2, $3)',
          [user.id, user.email, passwordHash]
        );
        
        console.log(`Auth entry created for user: ${user.email}`);
      } else {
        console.log(`Auth entry already exists for user: ${user.email}`);
      }
    }
    
    console.log('\nAuth users sync completed successfully.');
    
    // Check if admin user exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@americancoveragecenter.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Discord101!';
    
    console.log(`\nChecking for admin user with email: ${adminEmail}`);
    
    const adminResult = await pool.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
    
    if (adminResult.rows.length === 0) {
      console.log('Admin user not found. Creating admin user...');
      
      // Get admin position ID
      const positionResult = await pool.query('SELECT id FROM positions WHERE name = $1', ['Admin']);
      let adminPositionId;
      
      if (positionResult.rows.length === 0) {
        console.log('Admin position not found. Creating admin position...');
        const newPositionResult = await pool.query(
          'INSERT INTO positions (id, name, level) VALUES (uuid_generate_v4(), $1, $2) RETURNING id',
          ['Admin', 3]
        );
        adminPositionId = newPositionResult.rows[0].id;
      } else {
        adminPositionId = positionResult.rows[0].id;
      }
      
      // Hash the password
      const passwordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);
      
      // Generate user ID
      const userId = await pool.query('SELECT uuid_generate_v4() as id');
      const adminId = userId.rows[0].id;
      
      // Begin transaction
      await pool.query('BEGIN');
      
      try {
        // Create admin user
        await pool.query(
          `INSERT INTO users (id, email, full_name, position_id, is_active)
           VALUES ($1, $2, $3, $4, $5)`,
          [adminId, adminEmail, 'Admin User', adminPositionId, true]
        );
        
        // Create auth entry for admin
        await pool.query(
          'INSERT INTO auth_users (id, email, password_hash) VALUES ($1, $2, $3)',
          [adminId, adminEmail, passwordHash]
        );
        
        // Commit transaction
        await pool.query('COMMIT');
        
        console.log('Admin user created successfully.');
      } catch (error) {
        // Rollback transaction
        await pool.query('ROLLBACK');
        console.error('Error creating admin user:', error);
      }
    } else {
      console.log('Admin user found. Checking auth entry...');
      
      const adminId = adminResult.rows[0].id;
      
      const authAdminResult = await pool.query(
        'SELECT * FROM auth_users WHERE id = $1',
        [adminId]
      );
      
      if (authAdminResult.rows.length === 0) {
        console.log('No auth entry found for admin user. Creating one...');
        
        // Hash the password
        const passwordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);
        
        // Insert into auth_users
        await pool.query(
          'INSERT INTO auth_users (id, email, password_hash) VALUES ($1, $2, $3)',
          [adminId, adminEmail, passwordHash]
        );
        
        console.log('Auth entry created for admin user.');
      } else {
        console.log('Auth entry already exists for admin user. Updating password...');
        
        // Hash the password
        const passwordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);
        
        // Update auth_users
        await pool.query(
          'UPDATE auth_users SET password_hash = $1 WHERE id = $2',
          [passwordHash, adminId]
        );
        
        console.log('Admin user password updated successfully.');
      }
    }
    
    console.log('\nAdmin user check completed successfully.');
    
  } catch (error) {
    console.error('Error syncing auth users:', error);
  } finally {
    await pool.end();
  }
}

// Run the sync
syncAuthUsers();
