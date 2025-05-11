/**
 * fix-login-complete.js
 * This script provides a complete solution for fixing the login issue.
 * It adds test users to the auth_users table and runs the server with the fixed login route.
 */

import { addAuthUsers } from './add-auth-users.js';
import { start } from './run-fixed-login-server.js';

async function fixLoginComplete() {
  console.log('Starting complete login fix...');
  
  try {
    // Step 1: Add auth users
    console.log('\n=== STEP 1: Adding auth users ===');
    const authUsersAdded = await addAuthUsers();
    
    if (!authUsersAdded) {
      console.error('Failed to add auth users. Aborting.');
      return false;
    }
    
    console.log('Auth users added successfully.');
    
    // Step 2: Start the server with the fixed login route
    console.log('\n=== STEP 2: Starting server with fixed login route ===');
    const server = await start();
    
    if (!server) {
      console.error('Failed to start server. Aborting.');
      return false;
    }
    
    console.log('\nLogin fix complete!');
    console.log('Server is running with the fixed login route.');
    console.log('You can log in with the following credentials:');
    console.log('  Admin: admin@americancoveragecenter.com / Discord101!');
    console.log('  Test Agent: agent@example.com / Agent123!');
    
    return true;
  } catch (error) {
    console.error('Error fixing login:', error);
    return false;
  }
}

// Run the function if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  fixLoginComplete()
    .then(success => {
      if (!success) {
        console.error('Failed to fix login.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

export { fixLoginComplete };
