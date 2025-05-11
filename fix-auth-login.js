/**
 * fix-auth-login.js
 * This script fixes the authentication login issues.
 */

import pg from 'pg';
import bcrypt from 'bcrypt';
import './fix-database-connection.js';
import { envUtils } from './robust-patch.js';

// Get database configuration
const dbConfig = envUtils.getDatabaseConfig();
console.log('Database configuration:', dbConfig);

// Create a new pool
const pool = new pg.Pool(dbConfig);

async function fixAuthLogin() {
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
      
      // Create auth_users table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS auth_users (
          id UUID PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      console.log('auth_users table created successfully.');
    } else {
      console.log('auth_users table already exists.');
    }
    
    // Check if admin user exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@americancoveragecenter.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Discord101!';
    
    console.log(`Checking for admin user with email: ${adminEmail}`);
    
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
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      
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
          `INSERT INTO auth_users (id, email, password_hash)
           VALUES ($1, $2, $3)`,
          [adminId, adminEmail, passwordHash]
        );
        
        // Commit transaction
        await pool.query('COMMIT');
        
        console.log('Admin user created successfully.');
      } catch (error) {
        // Rollback transaction
        await pool.query('ROLLBACK');
        console.error('Error creating admin user:', error);
        throw error;
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
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        
        // Insert into auth_users
        await pool.query(
          'INSERT INTO auth_users (id, email, password_hash) VALUES ($1, $2, $3)',
          [adminId, adminEmail, passwordHash]
        );
        
        console.log('Auth entry created for admin user.');
      } else {
        console.log('Auth entry already exists for admin user. Updating password...');
        
        // Hash the password
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        
        // Update auth_users
        await pool.query(
          'UPDATE auth_users SET password_hash = $1 WHERE id = $2',
          [passwordHash, adminId]
        );
        
        console.log('Admin user password updated successfully.');
      }
    }
    
    // Test login with admin credentials
    console.log('\nTesting login with admin credentials...');
    
    const userResult = await pool.query(
      'SELECT u.*, a.password_hash FROM users u JOIN auth_users a ON u.id = a.id WHERE u.email = $1',
      [adminEmail]
    );
    
    if (userResult.rows.length === 0) {
      console.error('Error: Admin user not found after creation/update.');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('User found:', { id: user.id, email: user.email });
    
    // Test password comparison
    try {
      const passwordMatch = await bcrypt.compare(adminPassword, user.password_hash);
      console.log('Password match result:', passwordMatch);
      
      if (passwordMatch) {
        console.log('Login test successful!');
      } else {
        console.error('Error: Password does not match.');
      }
    } catch (error) {
      console.error('Error comparing passwords:', error);
    }
    
    console.log('\nAuth login fix completed.');
  } catch (error) {
    console.error('Error fixing auth login:', error);
  } finally {
    await pool.end();
  }
}

// Run the fix
fixAuthLogin();
