/**
 * run-complete-auth-fix.js
 * This script runs all the authentication fixes in the correct order.
 */

import { ensureAuthUsersTable } from './ensure-auth-users-table.js';
import { applyPatches } from './auth-system-patch.js';
import { app, start, pool, setupApiRoutes, authenticateToken } from './server-docker-index.js';

async function runCompleteFix() {
  console.log('Starting complete authentication system fix...');
  
  try {
    // Step 1: Ensure auth_users table exists and is properly populated
    console.log('\n=== STEP 1: Ensuring auth_users table ===');
    const tableSuccess = await ensureAuthUsersTable();
    
    if (!tableSuccess) {
      console.error('Failed to ensure auth_users table. Aborting.');
      return false;
    }
    
    // Reconnect to the database since ensureAuthUsersTable closes the pool
    console.log('\nReconnecting to the database...');
    await pool.connect();
    
    // Step 2: Apply patches to fix the code
    console.log('\n=== STEP 2: Applying code patches ===');
    applyPatches();
    
    // Step 3: Start the server with the fixed code
    console.log('\n=== STEP 3: Starting server with fixes ===');
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

// Run the function if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runCompleteFix()
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

export { runCompleteFix };
