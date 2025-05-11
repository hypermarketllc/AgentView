/**
 * debug-login.js
 * This script tests the login functionality by connecting to the database and checking auth_users table.
 */

import pg from 'pg';
import fs from 'fs';

// Database connection
const pool = new pg.Pool({
  host: 'localhost',
  port: 5433,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres',
  // Increase connection timeout
  connectionTimeoutMillis: 10000,
  // Increase query timeout
  statement_timeout: 10000
});

async function debugLogin() {
  console.log('Starting login debugging...');
  
  try {
    // Connect to the database
    console.log('Connecting to the database...');
    const client = await pool.connect();
    console.log('Connected to the database successfully.');
    
    // Check if auth_users table exists
    console.log('\nChecking if auth_users table exists...');
    const tableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'auth_users'
      );
    `);
    
    const tableExists = tableCheckResult.rows[0].exists;
    
    if (!tableExists) {
      console.log('auth_users table does not exist.');
    } else {
      console.log('auth_users table exists.');
      
      // Check users in auth_users table
      console.log('\nChecking users in auth_users table...');
      const usersResult = await client.query('SELECT * FROM auth_users');
      
      if (usersResult.rows.length === 0) {
        console.log('No users found in auth_users table.');
      } else {
        console.log(`Found ${usersResult.rows.length} users in auth_users table:`);
        usersResult.rows.forEach((user, index) => {
          console.log(`User ${index + 1}: ${user.email}`);
        });
      }
    }
    
    // Check if positions table exists
    console.log('\nChecking if positions table exists...');
    const positionsCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'positions'
      );
    `);
    
    const positionsExists = positionsCheckResult.rows[0].exists;
    
    if (!positionsExists) {
      console.log('positions table does not exist.');
    } else {
      console.log('positions table exists.');
      
      // Check positions in positions table
      console.log('\nChecking positions in positions table...');
      const positionsResult = await client.query('SELECT * FROM positions');
      
      if (positionsResult.rows.length === 0) {
        console.log('No positions found in positions table.');
      } else {
        console.log(`Found ${positionsResult.rows.length} positions in positions table:`);
        positionsResult.rows.forEach((position, index) => {
          console.log(`Position ${index + 1}: ${position.name} (Level: ${position.level})`);
        });
      }
    }
    
    // Check if users table exists
    console.log('\nChecking if users table exists...');
    const usersCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    const usersExists = usersCheckResult.rows[0].exists;
    
    if (!usersExists) {
      console.log('users table does not exist.');
    } else {
      console.log('users table exists.');
      
      // Check users in users table
      console.log('\nChecking users in users table...');
      const usersResult = await client.query('SELECT * FROM users');
      
      if (usersResult.rows.length === 0) {
        console.log('No users found in users table.');
      } else {
        console.log(`Found ${usersResult.rows.length} users in users table:`);
        usersResult.rows.forEach((user, index) => {
          console.log(`User ${index + 1}: ${user.email} (${user.full_name})`);
        });
      }
    }
    
    // Write debug info to file
    const debugInfo = {
      timestamp: new Date().toISOString(),
      tables: {
        auth_users: tableExists,
        positions: positionsExists,
        users: usersExists
      }
    };
    
    fs.writeFileSync('login-debug-info.json', JSON.stringify(debugInfo, null, 2));
    console.log('\nDebug info written to login-debug-info.json');
    
    // Release the client
    client.release();
    console.log('\nDatabase connection released.');
    
    return true;
  } catch (error) {
    console.error('Error debugging login:', error);
    
    // Write error to file
    const errorInfo = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack
      }
    };
    
    fs.writeFileSync('login-debug-error.json', JSON.stringify(errorInfo, null, 2));
    console.log('\nError info written to login-debug-error.json');
    
    return false;
  } finally {
    // Close the pool
    await pool.end();
    console.log('Database pool closed.');
  }
}

// Run the function
debugLogin()
  .then(success => {
    if (success) {
      console.log('Login debugging completed successfully.');
    } else {
      console.error('Login debugging failed.');
    }
  })
  .catch(error => {
    console.error('Unhandled error:', error);
  });
