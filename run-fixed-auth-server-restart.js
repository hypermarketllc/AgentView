/**
 * run-fixed-auth-server-restart.js
 * 
 * This script restarts the server with the fixed authentication endpoints.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execPromise = promisify(exec);

// Helper function to log success
function logSuccess(message) {
  console.log(chalk.green('✅ ' + message));
}

// Helper function to log error
function logError(message) {
  console.error(chalk.red('❌ ' + message));
}

// Helper function to log info
function logInfo(message) {
  console.log(chalk.blue('ℹ️ ' + message));
}

// Main function
async function main() {
  console.log(chalk.bold('=== Restarting Server with Fixed Authentication ==='));
  
  // Stop any running servers
  logInfo('Stopping any running servers...');
  try {
    await execPromise('taskkill /F /IM node.exe');
    logSuccess('Stopped all running Node.js processes');
  } catch (error) {
    // It's okay if there are no processes to kill
    logInfo('No Node.js processes were running');
  }
  
  // Start the server
  logInfo('Starting the server with fixed authentication...');
  try {
    const serverProcess = exec('node server-docker.js');
    
    serverProcess.stdout.on('data', (data) => {
      console.log(data);
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.error(data);
    });
    
    // Wait for the server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(chalk.bold('\n=== Server Started with Fixed Authentication ==='));
    logInfo('The server is now running with the fixed authentication endpoints.');
    logInfo('You can now log in with:');
    logInfo('Email: admin@americancoveragecenter.com');
    logInfo('Password: Admin123!');
    logInfo('To stop the server, press Ctrl+C');
    
    // Keep the script running
    process.stdin.resume();
  } catch (error) {
    logError(`Error starting server: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
