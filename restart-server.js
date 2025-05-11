/**
 * restart-server.js
 * This script restarts the server to apply the changes
 */

import { exec, spawn } from 'child_process';
import chalk from 'chalk';

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

console.log(chalk.bold('=== Restarting Server ==='));

// Function to execute a command
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      
      resolve({ stdout, stderr });
    });
  });
}

// Function to restart the server
async function restartServer() {
  try {
    // Stop the current server
    logInfo('Stopping the current server...');
    
    try {
      await executeCommand('taskkill /F /IM node.exe');
      logSuccess('Stopped the current server');
    } catch (error) {
      logInfo('No server process to stop or could not stop the server');
    }
    
    // Start the server in detached mode
    logInfo('Starting the server in detached mode...');
    
    const serverProcess = spawn('node', ['run-fixed-server.js'], {
      detached: true,
      stdio: 'ignore'
    });
    
    // Unref the child process so the parent can exit
    serverProcess.unref();
    
    // Wait a moment to ensure the server has started
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    logSuccess('Started the server in detached mode');
    
    return true;
  } catch (error) {
    logError(`Error restarting the server: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  try {
    // Restart the server
    const success = await restartServer();
    
    // Print summary
    console.log(chalk.bold('\n=== Server Restart Summary ==='));
    console.log(`Restart: ${success ? chalk.green('SUCCESS') : chalk.red('FAILED')}`);
    
    if (success) {
      console.log(chalk.bold('\nServer has been restarted.'));
      console.log('The changes to the API methods have been applied.');
      console.log('You can now access the following API endpoints:');
      console.log('1. DELETE /crm/api/system/health-checks/:id - for deleting system health checks');
      console.log('2. POST /crm/api/system/health-checks - for inserting system health checks');
      console.log('3. GET /crm/api/user/accs - for getting user accounts');
      console.log('4. GET /crm/api/settings - for getting settings');
    } else {
      console.log(chalk.bold('\nFailed to restart the server. Please check the logs for details.'));
    }
  } catch (error) {
    logError(`Error in main function: ${error.message}`);
  }
}

// Run the main function
main();
