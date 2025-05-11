/**
 * simple-login-fix.js
 * This script directly fixes the login route in server-docker-auth.js without database operations.
 */

import fs from 'fs';

function simpleLoginFix() {
  console.log('Starting simple login fix...');
  
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
    
    // Create a run script to start the server
    const runScriptPath = './run-fixed-login-server.js';
    console.log(`Creating run script at ${runScriptPath}...`);
    
    const runScriptContent = `/**
 * run-fixed-login-server.js
 * This script runs the server with the fixed login route.
 */

import { app, start, pool, setupApiRoutes, authenticateToken } from './server-docker-index.js';

console.log('Starting server with fixed login route...');

// Add middleware for logging requests
app.use((req, res, next) => {
  console.log(\`\${new Date().toISOString()} - \${req.method} \${req.url}\`);
  next();
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    details: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Set up API routes with authentication middleware
setupApiRoutes(app, pool, authenticateToken);

// Start the server
start();

console.log('Server started with fixed login route.');
console.log('You can log in with the following credentials:');
console.log('  Admin: admin@americancoveragecenter.com / Discord101!');
console.log('  Test Agent: agent@example.com / Agent123!');
`;
    
    fs.writeFileSync(runScriptPath, runScriptContent);
    
    console.log('\nSimple login fix complete!');
    console.log('You can now run the server with:');
    console.log('  node run-fixed-login-server.js');
    console.log('And log in with the following credentials:');
    console.log('  Admin: admin@americancoveragecenter.com / Discord101!');
    console.log('  Test Agent: agent@example.com / Agent123!');
    
    return true;
  } catch (error) {
    console.error('Error fixing login route:', error);
    return false;
  }
}

// Run the function if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const success = simpleLoginFix();
  
  if (success) {
    console.log('Successfully fixed login route.');
    process.exit(0);
  } else {
    console.error('Failed to fix login route.');
    process.exit(1);
  }
}

export { simpleLoginFix };
