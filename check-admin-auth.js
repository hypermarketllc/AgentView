// Script to check and fix admin authentication
import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current file directory (ES modules equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const { Pool } = pg;
const SALT_ROUNDS = 10;

// Create a connection pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'crm_db',
  user: process.env.POSTGRES_USER || 'crm_user',
  password: process.env.POSTGRES_PASSWORD || 'your_strong_password_here'
});

async function checkAndFixAdminAuth() {
  try {
    console.log('Checking admin authentication...');
    
    // Check if admin@americancoveragecenter.com exists in users table
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      ['admin@americancoveragecenter.com']
    );
    
    if (userResult.rows.length === 0) {
      console.error('Error: admin@americancoveragecenter.com not found in users table');
      return;
    }
    
    const userId = userResult.rows[0].id;
    console.log(`Found admin user with ID: ${userId}`);
    
    // Check if admin exists in auth_users table
    const authResult = await pool.query(
      'SELECT * FROM auth_users WHERE email = $1',
      ['admin@americancoveragecenter.com']
    );
    
    if (authResult.rows.length === 0) {
      console.log('Admin not found in auth_users table. Creating entry...');
      
      // Hash the password
      const password = 'Discord101!';
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      
      // Insert into auth_users
      await pool.query(
        'INSERT INTO auth_users (id, email, password_hash) VALUES ($1, $2, $3)',
        [userId, 'admin@americancoveragecenter.com', passwordHash]
      );
      
      console.log('Admin auth entry created successfully');
    } else {
      console.log('Admin found in auth_users table. Updating password...');
      
      // Update password hash
      const password = 'Discord101!';
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      
      await pool.query(
        'UPDATE auth_users SET password_hash = $1 WHERE email = $2',
        [passwordHash, 'admin@americancoveragecenter.com']
      );
      
      console.log('Admin password updated successfully');
    }
    
    // Verify the auth_users entry
    const verifyResult = await pool.query(
      'SELECT * FROM auth_users WHERE email = $1',
      ['admin@americancoveragecenter.com']
    );
    
    if (verifyResult.rows.length > 0) {
      console.log('Verification successful. Admin auth entry exists.');
      console.log('Auth user details:', verifyResult.rows[0]);
    } else {
      console.error('Verification failed. Admin auth entry not found after update.');
    }
  } catch (error) {
    console.error('Error checking/fixing admin auth:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the function
checkAndFixAdminAuth();
