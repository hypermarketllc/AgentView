/**
 * ensure-auth-users-table.js
 * This script ensures the auth_users table exists and is properly populated.
 * It creates the table if it doesn't exist and adds entries for any users in the users table
 * that don't have corresponding entries in the auth_users table.
 */

import { pool } from './server-docker-db.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'ChangeMe123!'; // Default password for users without a password

async function ensureAuthUsersTable() {
  console.log('Ensuring auth_users table exists and is properly populated...');
  
  try {
    // Start a transaction
    await pool.query('BEGIN');
    
    // Check if auth_users table exists
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
        CREATE TABLE auth_users (
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
    
    // Get all users from the users table
    const usersResult = await pool.query('SELECT id, email FROM users');
    const users = usersResult.rows;
    
    console.log(`Found ${users.length} users in the users table.`);
    
    // Get all users from the auth_users table
    const authUsersResult = await pool.query('SELECT id, email FROM auth_users');
    const authUsers = authUsersResult.rows;
    
    console.log(`Found ${authUsers.length} users in the auth_users table.`);
    
    // Find users that don't have entries in the auth_users table
    const authUserIds = authUsers.map(user => user.id);
    const missingUsers = users.filter(user => !authUserIds.includes(user.id));
    
    console.log(`Found ${missingUsers.length} users without entries in the auth_users table.`);
    
    if (missingUsers.length > 0) {
      console.log('Adding missing users to the auth_users table...');
      
      // Hash the default password
      const defaultPasswordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);
      
      // Add missing users to the auth_users table
      for (const user of missingUsers) {
        console.log(`Adding user ${user.email} to auth_users table...`);
        
        await pool.query(
          `INSERT INTO auth_users (id, email, password_hash)
           VALUES ($1, $2, $3)`,
          [user.id, user.email, defaultPasswordHash]
        );
      }
      
      console.log('All missing users added to the auth_users table.');
    }
    
    // Commit the transaction
    await pool.query('COMMIT');
    
    console.log('auth_users table is now properly set up and populated.');
    
    // Special handling for admin user
    const adminEmail = 'admin@americancoveragecenter.com';
    const adminPassword = 'Discord101!';
    
    console.log(`Ensuring admin user (${adminEmail}) exists with correct password...`);
    
    // Check if admin user exists in auth_users
    const adminAuthResult = await pool.query(
      'SELECT * FROM auth_users WHERE email = $1',
      [adminEmail]
    );
    
    if (adminAuthResult.rows.length > 0) {
      // Update admin password
      const adminPasswordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);
      
      await pool.query(
        `UPDATE auth_users SET password_hash = $1 WHERE email = $2`,
        [adminPasswordHash, adminEmail]
      );
      
      console.log('Admin user password updated.');
    } else {
      // Check if admin exists in users table
      const adminUserResult = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [adminEmail]
      );
      
      if (adminUserResult.rows.length > 0) {
        const admin = adminUserResult.rows[0];
        const adminPasswordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);
        
        // Add admin to auth_users
        await pool.query(
          `INSERT INTO auth_users (id, email, password_hash)
           VALUES ($1, $2, $3)`,
          [admin.id, adminEmail, adminPasswordHash]
        );
        
        console.log('Admin user added to auth_users table.');
      } else {
        console.log('Admin user not found in users table. Skipping.');
      }
    }
    
    console.log('Auth users table setup complete.');
    
    return true;
  } catch (error) {
    // Rollback the transaction on error
    await pool.query('ROLLBACK');
    
    console.error('Error ensuring auth_users table:', error);
    return false;
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the function if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  ensureAuthUsersTable()
    .then(success => {
      if (success) {
        console.log('Successfully ensured auth_users table exists and is properly populated.');
        process.exit(0);
      } else {
        console.error('Failed to ensure auth_users table.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

export { ensureAuthUsersTable };
