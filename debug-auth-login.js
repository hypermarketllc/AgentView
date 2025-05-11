/**
 * debug-auth-login.js
 * This script debugs the authentication login process and fixes any issues.
 */

import { pool } from './server-docker-db.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;
const ADMIN_EMAIL = 'admin@americancoveragecenter.com';
const ADMIN_PASSWORD = 'Discord101!';
const TEST_AGENT_EMAIL = 'agent@example.com';
const TEST_AGENT_PASSWORD = 'Agent123!';

async function debugAuthLogin() {
  console.log('Debugging authentication login process...');
  
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
      console.error('auth_users table does not exist!');
      console.log('Creating auth_users table...');
      
      // Create auth_users table
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
    
    // Check admin user in users table
    console.log('\nChecking admin user in users table...');
    const adminUserResult = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [ADMIN_EMAIL]
    );
    
    if (adminUserResult.rows.length === 0) {
      console.error('Admin user not found in users table!');
      console.log('Creating admin user in users table...');
      
      // Get the admin position ID
      const positionResult = await client.query(
        'SELECT id FROM positions WHERE name = $1 OR level >= 5 ORDER BY level DESC LIMIT 1',
        ['Admin']
      );
      
      if (positionResult.rows.length === 0) {
        console.error('Admin position not found!');
        return false;
      }
      
      const positionId = positionResult.rows[0].id;
      
      // Generate a UUID for the admin user
      const { v4: uuidv4 } = await import('uuid');
      const adminId = uuidv4();
      
      // Insert admin user
      await client.query(
        `INSERT INTO users (id, email, full_name, position_id, is_active)
         VALUES ($1, $2, $3, $4, $5)`,
        [adminId, ADMIN_EMAIL, 'Admin User', positionId, true]
      );
      
      console.log('Admin user created in users table.');
    } else {
      console.log('Admin user found in users table.');
    }
    
    // Check admin user in auth_users table
    console.log('\nChecking admin user in auth_users table...');
    const adminAuthResult = await client.query(
      'SELECT * FROM auth_users WHERE email = $1',
      [ADMIN_EMAIL]
    );
    
    if (adminAuthResult.rows.length === 0) {
      console.error('Admin user not found in auth_users table!');
      console.log('Creating admin user in auth_users table...');
      
      // Get admin user ID from users table
      const adminUserResult = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [ADMIN_EMAIL]
      );
      
      if (adminUserResult.rows.length === 0) {
        console.error('Admin user not found in users table!');
        return false;
      }
      
      const adminId = adminUserResult.rows[0].id;
      
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
    
    if (agentUserResult.rows.length === 0) {
      console.error('Test agent user not found in users table!');
      console.log('Creating test agent user in users table...');
      
      // Get the agent position ID
      const positionResult = await client.query(
        'SELECT id FROM positions WHERE name = $1 OR level = 1 ORDER BY level ASC LIMIT 1',
        ['Agent']
      );
      
      if (positionResult.rows.length === 0) {
        console.error('Agent position not found!');
        return false;
      }
      
      const positionId = positionResult.rows[0].id;
      
      // Generate a UUID for the test agent user
      const { v4: uuidv4 } = await import('uuid');
      const agentId = uuidv4();
      
      // Insert test agent user
      await client.query(
        `INSERT INTO users (id, email, full_name, position_id, is_active)
         VALUES ($1, $2, $3, $4, $5)`,
        [agentId, TEST_AGENT_EMAIL, 'Test Agent', positionId, true]
      );
      
      console.log('Test agent user created in users table.');
    } else {
      console.log('Test agent user found in users table.');
    }
    
    // Check test agent user in auth_users table
    console.log('\nChecking test agent user in auth_users table...');
    const agentAuthResult = await client.query(
      'SELECT * FROM auth_users WHERE email = $1',
      [TEST_AGENT_EMAIL]
    );
    
    if (agentAuthResult.rows.length === 0) {
      console.error('Test agent user not found in auth_users table!');
      console.log('Creating test agent user in auth_users table...');
      
      // Get test agent user ID from users table
      const agentUserResult = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [TEST_AGENT_EMAIL]
      );
      
      if (agentUserResult.rows.length === 0) {
        console.error('Test agent user not found in users table!');
        return false;
      }
      
      const agentId = agentUserResult.rows[0].id;
      
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
    
    // Test login process for admin
    console.log('\nTesting login process for admin...');
    
    // Get admin user from auth_users table
    const adminAuthTestResult = await client.query(
      'SELECT * FROM auth_users WHERE email = $1',
      [ADMIN_EMAIL]
    );
    
    if (adminAuthTestResult.rows.length === 0) {
      console.error('Admin user not found in auth_users table!');
      return false;
    }
    
    const adminAuth = adminAuthTestResult.rows[0];
    
    // Get admin user details from users table
    const adminUserTestResult = await client.query(
      `SELECT u.*, p.name as position_name, p.level as position_level 
       FROM users u
       JOIN positions p ON u.position_id = p.id
       WHERE u.email = $1`,
      [ADMIN_EMAIL]
    );
    
    if (adminUserTestResult.rows.length === 0) {
      console.error('Admin user details not found in users table!');
      return false;
    }
    
    const adminUser = adminUserTestResult.rows[0];
    
    // Check password
    const adminPasswordMatch = await bcrypt.compare(ADMIN_PASSWORD, adminAuth.password_hash);
    
    if (!adminPasswordMatch) {
      console.error('Admin password does not match!');
      
      // Update admin password
      console.log('Updating admin password...');
      const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
      
      await client.query(
        `UPDATE auth_users SET password_hash = $1 WHERE email = $2`,
        [adminPasswordHash, ADMIN_EMAIL]
      );
      
      console.log('Admin password updated.');
    } else {
      console.log('Admin password matches.');
    }
    
    // Test login process for test agent
    console.log('\nTesting login process for test agent...');
    
    // Get test agent user from auth_users table
    const agentAuthTestResult = await client.query(
      'SELECT * FROM auth_users WHERE email = $1',
      [TEST_AGENT_EMAIL]
    );
    
    if (agentAuthTestResult.rows.length === 0) {
      console.error('Test agent user not found in auth_users table!');
      return false;
    }
    
    const agentAuth = agentAuthTestResult.rows[0];
    
    // Get test agent user details from users table
    const agentUserTestResult = await client.query(
      `SELECT u.*, p.name as position_name, p.level as position_level 
       FROM users u
       JOIN positions p ON u.position_id = p.id
       WHERE u.email = $1`,
      [TEST_AGENT_EMAIL]
    );
    
    if (agentUserTestResult.rows.length === 0) {
      console.error('Test agent user details not found in users table!');
      return false;
    }
    
    const agentUser = agentUserTestResult.rows[0];
    
    // Check password
    const agentPasswordMatch = await bcrypt.compare(TEST_AGENT_PASSWORD, agentAuth.password_hash);
    
    if (!agentPasswordMatch) {
      console.error('Test agent password does not match!');
      
      // Update test agent password
      console.log('Updating test agent password...');
      const agentPasswordHash = await bcrypt.hash(TEST_AGENT_PASSWORD, SALT_ROUNDS);
      
      await client.query(
        `UPDATE auth_users SET password_hash = $1 WHERE email = $2`,
        [agentPasswordHash, TEST_AGENT_EMAIL]
      );
      
      console.log('Test agent password updated.');
    } else {
      console.log('Test agent password matches.');
    }
    
    // Release the client
    client.release();
    
    console.log('\nAuthentication login process debugging complete.');
    console.log('Admin user and test agent user are set up correctly.');
    console.log('You can now log in with the following credentials:');
    console.log(`  Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    console.log(`  Test Agent: ${TEST_AGENT_EMAIL} / ${TEST_AGENT_PASSWORD}`);
    
    return true;
  } catch (error) {
    console.error('Error debugging authentication login process:', error);
    return false;
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the function if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  debugAuthLogin()
    .then(success => {
      if (success) {
        console.log('Successfully debugged authentication login process.');
        process.exit(0);
      } else {
        console.error('Failed to debug authentication login process.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

export { debugAuthLogin };
