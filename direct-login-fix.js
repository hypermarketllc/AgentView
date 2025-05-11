/**
 * direct-login-fix.js
 * This script directly fixes the login functionality by ensuring the auth_users table exists
 * and fixing the login route in server-docker-auth.js.
 */

import fs from 'fs';
import bcrypt from 'bcrypt';
import { pool } from './server-docker-db.js';

const SALT_ROUNDS = 10;
const ADMIN_EMAIL = 'admin@americancoveragecenter.com';
const ADMIN_PASSWORD = 'Discord101!';
const TEST_AGENT_EMAIL = 'agent@example.com';
const TEST_AGENT_PASSWORD = 'Agent123!';

async function directLoginFix() {
  console.log('Starting direct login fix...');
  
  try {
    // Step 1: Ensure auth_users table exists and is properly populated
    console.log('\n=== STEP 1: Ensuring auth_users table ===');
    const tableSuccess = await ensureAuthUsersTable();
    
    if (!tableSuccess) {
      console.error('Failed to ensure auth_users table. Aborting.');
      return false;
    }
    
    // Step 2: Fix the login route in server-docker-auth.js
    console.log('\n=== STEP 2: Fixing login route ===');
    const loginRouteSuccess = fixLoginRoute();
    
    if (!loginRouteSuccess) {
      console.error('Failed to fix login route. Aborting.');
      return false;
    }
    
    console.log('\nDirect login fix complete!');
    console.log('You can now run the server with:');
    console.log('  node server-docker-index.js');
    console.log('And log in with the following credentials:');
    console.log(`  Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    console.log(`  Test Agent: ${TEST_AGENT_EMAIL} / ${TEST_AGENT_PASSWORD}`);
    
    return true;
  } catch (error) {
    console.error('Error during direct login fix:', error);
    return false;
  }
}

async function ensureAuthUsersTable() {
  console.log('Ensuring auth_users table exists and is properly populated...');
  
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
    
    // Release the client
    client.release();
    
    console.log('\nAuth users table setup complete.');
    
    return true;
  } catch (error) {
    console.error('Error ensuring auth_users table:', error);
    return false;
  }
}

function fixLoginRoute() {
  console.log('Fixing login route in server-docker-auth.js...');
  
  try {
    // Create backup of the target file
    const targetFile = './server-docker-auth.js';
    const backupPath = `${targetFile}.backup`;
    
    if (!fs.existsSync(backupPath)) {
      console.log(`Creating backup at ${backupPath}...`);
      fs.copyFileSync(targetFile, backupPath);
    }
    
    // Read the file content
    console.log(`Reading ${targetFile}...`);
    const content = fs.readFileSync(targetFile, 'utf8');
    
    // Create a completely new login route implementation
    const newLoginRoute = `
// Login route
app.post('/crm/api/auth/login', async (req, res) => {
  try {
    console.log('Login attempt received:', req.body);
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Get user from auth_users table
    const authUserResult = await pool.query(
      'SELECT * FROM auth_users WHERE email = $1',
      [email]
    );
    
    if (authUserResult.rows.length === 0) {
      console.log('User not found in auth_users table:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const authUser = authUserResult.rows[0];
    
    // Check password
    try {
      const passwordMatch = await bcrypt.compare(password, authUser.password_hash);
      
      if (!passwordMatch) {
        console.log('Password does not match for user:', email);
        return res.status(401).json({ error: 'Invalid email or password' });
      }
    } catch (passwordError) {
      console.error('Error comparing passwords:', passwordError);
      return res.status(500).json({ error: 'Login failed', details: 'Error verifying password' });
    }
    
    // Get user details from users table
    const userResult = await pool.query(
      \`SELECT u.*, p.name as position_name, p.level as position_level 
       FROM users u
       JOIN positions p ON u.position_id = p.id
       WHERE u.email = $1\`,
      [email]
    );
    
    if (userResult.rows.length === 0) {
      console.error('User found in auth_users but not in users table:', email);
      return res.status(500).json({ error: 'User account incomplete' });
    }
    
    const user = userResult.rows[0];
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        position: user.position_name,
        level: user.position_level
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('Login successful for user:', email);
    
    // Return user info and token
    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        position: user.position_name,
        level: user.position_level,
        isActive: user.is_active
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});`;
    
    // Replace the existing login route with the new implementation
    const routePattern = /\/\/ Login route[\s\S]*?app\.post\('\/crm\/api\/auth\/login'[\s\S]*?\}\);/;
    const patchedContent = content.replace(routePattern, newLoginRoute);
    
    // Write the patched content back to the file
    console.log(`Writing patched content to ${targetFile}...`);
    fs.writeFileSync(targetFile, patchedContent);
    
    console.log('Login route fixed successfully.');
    return true;
  } catch (error) {
    console.error('Error fixing login route:', error);
    return false;
  }
}

// Run the function if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  directLoginFix()
    .then(success => {
      if (success) {
        console.log('Successfully fixed login functionality.');
        process.exit(0);
      } else {
        console.error('Failed to fix login functionality.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

export { directLoginFix };
