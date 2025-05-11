/**
 * fix-login-route.js
 * This script directly fixes the login route in server-docker-auth.js.
 */

import fs from 'fs';
import { app } from './server-docker-index.js';

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
    
    // Fix the login route
    console.log('Patching login route...');
    
    // Replace the login route implementation
    let patchedContent = content.replace(
      /app\.post\('\/crm\/api\/auth\/login', async \(req, res\) => \{[\s\S]*?try \{[\s\S]*?const \{ email, password \} = req\.body;[\s\S]*?\/\/ Get user from auth_users table[\s\S]*?const authUserResult[\s\S]*?if \(authUserResult\.rows\.length === 0\) \{[\s\S]*?return res\.status\(401\)\.json\(\{ error: 'Invalid email or password' \}\);[\s\S]*?\}/,
      `app.post('/crm/api/auth/login', async (req, res) => {
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
      }`
    );
    
    // Add error handling for password comparison
    patchedContent = patchedContent.replace(
      /\/\/ Check password[\s\S]*?const passwordMatch = await bcrypt\.compare\(password, authUser\.password_hash\);[\s\S]*?if \(!passwordMatch\) \{[\s\S]*?return res\.status\(401\)\.json\(\{ error: 'Invalid email or password' \}\);[\s\S]*?\}/,
      `// Check password
      try {
        const passwordMatch = await bcrypt.compare(password, authUser.password_hash);
        
        if (!passwordMatch) {
          console.log('Password does not match for user:', email);
          return res.status(401).json({ error: 'Invalid email or password' });
        }
      } catch (passwordError) {
        console.error('Error comparing passwords:', passwordError);
        return res.status(500).json({ error: 'Login failed', details: 'Error verifying password' });
      }`
    );
    
    // Add better error handling
    patchedContent = patchedContent.replace(
      /\} catch \(error\) \{[\s\S]*?console\.error\('Login error:', error\);[\s\S]*?res\.status\(500\)\.json\(\{ error: 'Login failed' \}\);[\s\S]*?\}\);/,
      `} catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        error: 'Login failed', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });`
    );
    
    // Write the patched content back to the file
    console.log(`Writing patched content to ${targetFile}...`);
    fs.writeFileSync(targetFile, patchedContent);
    
    // Add middleware for logging and error handling
    console.log('Adding middleware for logging and error handling...');
    
    // Add a route handler to log login attempts
    app.use('/crm/api/auth/login', (req, res, next) => {
      console.log('Login middleware triggered for:', req.body);
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
    
    console.log('Login route fixed successfully.');
    return true;
  } catch (error) {
    console.error('Error fixing login route:', error);
    return false;
  }
}

// Run the function if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const success = fixLoginRoute();
  
  if (success) {
    console.log('Successfully fixed login route.');
    process.exit(0);
  } else {
    console.error('Failed to fix login route.');
    process.exit(1);
  }
}

export { fixLoginRoute };
