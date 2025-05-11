/**
 * add-auth-users.js
 * This script adds test users to the auth_users table.
 */

import pg from 'pg';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const SALT_ROUNDS = 10;
const ADMIN_EMAIL = 'admin@americancoveragecenter.com';
const ADMIN_PASSWORD = 'Discord101!';
const TEST_AGENT_EMAIL = 'agent@example.com';
const TEST_AGENT_PASSWORD = 'Agent123!';

// Database connection
const pool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres',
  // Increase connection timeout
  connectionTimeoutMillis: 10000,
  // Increase query timeout
  statement_timeout: 10000
});

async function addAuthUsers() {
  console.log('Starting to add auth users...');
  
  try {
    // Connect to the database
    console.log('Connecting to the database...');
    const client = await pool.connect();
    
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
      console.log('auth_users table does not exist. Creating it...');
      
      await client.query(`
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
      console.log('auth_users table exists.');
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
      console.log('positions table does not exist. Creating it...');
      
      await client.query(`
        CREATE TABLE positions (
          id UUID PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          level INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      console.log('positions table created successfully.');
      
      // Add default positions
      console.log('Adding default positions...');
      
      const adminPositionId = uuidv4();
      const agentPositionId = uuidv4();
      
      await client.query(`
        INSERT INTO positions (id, name, level)
        VALUES 
          ($1, 'Admin', 5),
          ($2, 'Agent', 1);
      `, [adminPositionId, agentPositionId]);
      
      console.log('Default positions added successfully.');
    } else {
      console.log('positions table exists.');
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
      console.log('users table does not exist. Creating it...');
      
      await client.query(`
        CREATE TABLE users (
          id UUID PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          full_name VARCHAR(255) NOT NULL,
          position_id UUID NOT NULL REFERENCES positions(id),
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      console.log('users table created successfully.');
    } else {
      console.log('users table exists.');
    }
    
    // Get admin position ID
    console.log('\nGetting admin position ID...');
    const adminPositionResult = await client.query(
      'SELECT id FROM positions WHERE name = $1 OR level >= 5 ORDER BY level DESC LIMIT 1',
      ['Admin']
    );
    
    if (adminPositionResult.rows.length === 0) {
      console.error('Admin position not found!');
      
      // Create admin position
      console.log('Creating admin position...');
      const adminPositionId = uuidv4();
      
      await client.query(
        'INSERT INTO positions (id, name, level) VALUES ($1, $2, $3)',
        [adminPositionId, 'Admin', 5]
      );
      
      console.log('Admin position created successfully.');
    }
    
    const adminPositionId = adminPositionResult.rows.length > 0 
      ? adminPositionResult.rows[0].id 
      : (await client.query('SELECT id FROM positions WHERE name = $1', ['Admin'])).rows[0].id;
    
    // Get agent position ID
    console.log('\nGetting agent position ID...');
    const agentPositionResult = await client.query(
      'SELECT id FROM positions WHERE name = $1 OR level = 1 ORDER BY level ASC LIMIT 1',
      ['Agent']
    );
    
    if (agentPositionResult.rows.length === 0) {
      console.error('Agent position not found!');
      
      // Create agent position
      console.log('Creating agent position...');
      const agentPositionId = uuidv4();
      
      await client.query(
        'INSERT INTO positions (id, name, level) VALUES ($1, $2, $3)',
        [agentPositionId, 'Agent', 1]
      );
      
      console.log('Agent position created successfully.');
    }
    
    const agentPositionId = agentPositionResult.rows.length > 0 
      ? agentPositionResult.rows[0].id 
      : (await client.query('SELECT id FROM positions WHERE name = $1', ['Agent'])).rows[0].id;
    
    // Check admin user in users table
    console.log('\nChecking admin user in users table...');
    const adminUserResult = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [ADMIN_EMAIL]
    );
    
    let adminId;
    
    if (adminUserResult.rows.length === 0) {
      console.log('Admin user not found in users table. Creating admin user...');
      
      // Generate a UUID for the admin user
      adminId = uuidv4();
      
      // Insert admin user
      await client.query(
        `INSERT INTO users (id, email, full_name, position_id, is_active)
         VALUES ($1, $2, $3, $4, $5)`,
        [adminId, ADMIN_EMAIL, 'Admin User', adminPositionId, true]
      );
      
      console.log('Admin user created in users table.');
    } else {
      console.log('Admin user found in users table.');
      adminId = adminUserResult.rows[0].id;
    }
    
    // Check admin user in auth_users table
    console.log('\nChecking admin user in auth_users table...');
    const adminAuthResult = await client.query(
      'SELECT * FROM auth_users WHERE email = $1',
      [ADMIN_EMAIL]
    );
    
    if (adminAuthResult.rows.length === 0) {
      console.log('Admin user not found in auth_users table. Creating admin user...');
      
      // Hash admin password
      const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
      
      // Insert admin user into auth_users
      await client.query(
        `INSERT INTO auth_users (id, email, password_hash)
         VALUES ($1, $2, $3)`,
        [adminId, ADMIN_EMAIL, adminPasswordHash]
      );
      
      console.log('Admin user created in auth_users table.');
    } else {
      console.log('Admin user found in auth_users table.');
      
      // Update admin password
      console.log('Updating admin password...');
      const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
      
      await client.query(
        `UPDATE auth_users SET password_hash = $1 WHERE email = $2`,
        [adminPasswordHash, ADMIN_EMAIL]
      );
      
      console.log('Admin password updated.');
    }
    
    // Check test agent user in users table
    console.log('\nChecking test agent user in users table...');
    const agentUserResult = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [TEST_AGENT_EMAIL]
    );
    
    let agentId;
    
    if (agentUserResult.rows.length === 0) {
      console.log('Test agent user not found in users table. Creating test agent user...');
      
      // Generate a UUID for the test agent user
      agentId = uuidv4();
      
      // Insert test agent user
      await client.query(
        `INSERT INTO users (id, email, full_name, position_id, is_active)
         VALUES ($1, $2, $3, $4, $5)`,
        [agentId, TEST_AGENT_EMAIL, 'Test Agent', agentPositionId, true]
      );
      
      console.log('Test agent user created in users table.');
    } else {
      console.log('Test agent user found in users table.');
      agentId = agentUserResult.rows[0].id;
    }
    
    // Check test agent user in auth_users table
    console.log('\nChecking test agent user in auth_users table...');
    const agentAuthResult = await client.query(
      'SELECT * FROM auth_users WHERE email = $1',
      [TEST_AGENT_EMAIL]
    );
    
    if (agentAuthResult.rows.length === 0) {
      console.log('Test agent user not found in auth_users table. Creating test agent user...');
      
      // Hash test agent password
      const agentPasswordHash = await bcrypt.hash(TEST_AGENT_PASSWORD, SALT_ROUNDS);
      
      // Insert test agent user into auth_users
      await client.query(
        `INSERT INTO auth_users (id, email, password_hash)
         VALUES ($1, $2, $3)`,
        [agentId, TEST_AGENT_EMAIL, agentPasswordHash]
      );
      
      console.log('Test agent user created in auth_users table.');
    } else {
      console.log('Test agent user found in auth_users table.');
      
      // Update test agent password
      console.log('Updating test agent password...');
      const agentPasswordHash = await bcrypt.hash(TEST_AGENT_PASSWORD, SALT_ROUNDS);
      
      await client.query(
        `UPDATE auth_users SET password_hash = $1 WHERE email = $2`,
        [agentPasswordHash, TEST_AGENT_EMAIL]
      );
      
      console.log('Test agent password updated.');
    }
    
    // Release the client
    client.release();
    
    console.log('\nAuth users added successfully.');
    console.log('You can now log in with the following credentials:');
    console.log(`  Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    console.log(`  Test Agent: ${TEST_AGENT_EMAIL} / ${TEST_AGENT_PASSWORD}`);
    
    return true;
  } catch (error) {
    console.error('Error adding auth users:', error);
    return false;
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the function if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  addAuthUsers()
    .then(success => {
      if (success) {
        console.log('Successfully added auth users.');
        process.exit(0);
      } else {
        console.error('Failed to add auth users.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

export { addAuthUsers };
