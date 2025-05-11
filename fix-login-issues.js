/**
 * fix-login-issues.js
 * This script runs all the fixes for the login issues in the correct order.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to run a script and wait for it to complete
function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`\n=== Running ${scriptPath} ===\n`);
    
    const process = spawn('node', [scriptPath], { stdio: 'inherit' });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log(`\n=== ${scriptPath} completed successfully ===\n`);
        resolve();
      } else {
        console.error(`\n=== ${scriptPath} failed with code ${code} ===\n`);
        reject(new Error(`Script ${scriptPath} failed with code ${code}`));
      }
    });
    
    process.on('error', (err) => {
      console.error(`\n=== Error running ${scriptPath}: ${err.message} ===\n`);
      reject(err);
    });
  });
}

// Main function to run all the fixes
async function fixLoginIssues() {
  try {
    console.log('\n=== Starting login issues fix ===\n');
    
    // 1. Run the sync-auth-users.js script
    await runScript(resolve(__dirname, 'sync-auth-users.js'));
    
    // 2. Run the fix-auth-login.js script
    await runScript(resolve(__dirname, 'fix-auth-login.js'));
    
    // 3. Start the server
    console.log('\n=== Starting the server ===\n');
    
    const serverProcess = spawn('node', [resolve(__dirname, 'run-fixed-auth-server.js')], { 
      stdio: 'inherit',
      detached: true
    });
    
    // Wait for the server to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 4. Run the test-login-health.js script
    await runScript(resolve(__dirname, 'test-login-health.js'));
    
    // 5. Kill the server process
    if (serverProcess.pid) {
      console.log('\n=== Stopping the server ===\n');
      try {
        // On Windows, we need to use a different approach
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', serverProcess.pid, '/f', '/t']);
        } else {
          process.kill(serverProcess.pid);
        }
      } catch (error) {
        console.error('Error stopping server:', error.message);
        // Continue anyway since we're done with the tests
      }
    }
    
    console.log('\n=== Login issues fix completed successfully ===\n');
    console.log('The following fixes have been applied:');
    console.log('1. Created and populated the auth_users table');
    console.log('2. Fixed the admin login');
    console.log('3. Added login health check to the system health monitoring');
    console.log('\nYou can now run the server with:');
    console.log('node run-fixed-auth-server.js');
    
  } catch (error) {
    console.error('\n=== Error fixing login issues ===\n', error);
  }
}

// Run the fixes
fixLoginIssues();
