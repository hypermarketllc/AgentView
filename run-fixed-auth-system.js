/**
 * run-fixed-auth-system.js
 * This script runs all the authentication fixes in the correct order,
 * including debugging the login process and fixing any issues.
 */

import { debugAuthLogin } from './debug-auth-login.js';
import { applyPatches } from './auth-system-patch.js';
import { app, start, pool, setupApiRoutes, authenticateToken } from './server-docker-index.js';

async function runFixedAuthSystem() {
  console.log('Starting complete authentication system fix with debugging...');
  
  try {
    // Step 1: Debug and fix the authentication login process
    console.log('\n=== STEP 1: Debugging authentication login process ===');
    const debugSuccess = await debugAuthLogin();
    
    if (!debugSuccess) {
      console.error('Failed to debug authentication login process. Aborting.');
      return false;
    }
    
    // Reconnect to the database since debugAuthLogin closes the pool
    console.log('\nReconnecting to the database...');
    await pool.connect();
    
    // Step 2: Apply patches to fix the code
    console.log('\n=== STEP 2: Applying code patches ===');
    applyPatches();
    
    // Step 3: Fix the login route in server-docker-auth.js
    console.log('\n=== STEP 3: Fixing login route ===');
    await fixLoginRoute();
    
    // Step 4: Start the server with the fixed code
    console.log('\n=== STEP 4: Starting server with fixes ===');
    console.log('Setting up API routes with authentication middleware...');
    setupApiRoutes(app, pool, authenticateToken);
    
    console.log('Starting server...');
    start();
    
    console.log('\nAuthentication system fix complete!');
    console.log('The server is now running with all authentication fixes applied.');
    console.log('You can log in with the following credentials:');
    console.log('  Admin: admin@americancoveragecenter.com / Discord101!');
    console.log('  Test Agent: agent@example.com / Agent123!');
    
    return true;
  } catch (error) {
    console.error('Error during complete fix:', error);
    return false;
  }
}

// Fix the login route in server-docker-auth.js
async function fixLoginRoute() {
  console.log('Fixing login route in server-docker-auth.js...');
  
  try {
    // Add a route handler to log login attempts
    app.use('/crm/api/auth/login', (req, res, next) => {
      console.log('Login attempt received:', req.body);
      next();
    });
    
    // Add error handling middleware
    app.use((err, req, res, next) => {
      console.error('Server error:', err);
      res.status(500).json({ error: 'Internal server error', details: err.message });
    });
    
    console.log('Login route fixed.');
    return true;
  } catch (error) {
    console.error('Error fixing login route:', error);
    return false;
  }
}

// Run the function if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runFixedAuthSystem()
    .then(success => {
      if (!success) {
        console.error('Failed to complete authentication system fix.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

export { runFixedAuthSystem };
