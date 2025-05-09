/**
 * run-complete-fix.js
 * 
 * This script runs all the fixes in sequence to address the issues with missing API methods,
 * database tables, and frontend data display.
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

// Helper function to run a script
async function runScript(script, description) {
  logInfo(`Running ${script}: ${description}`);
  try {
    const { stdout, stderr } = await execPromise(`node ${script}`);
    if (stderr) {
      logError(`Error running ${script}: ${stderr}`);
      return false;
    }
    logSuccess(`Successfully ran ${script}`);
    return true;
  } catch (error) {
    logError(`Error running ${script}: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log(chalk.bold('=== Running Complete Fix ==='));
  
  // Step 1: Fix API methods
  logInfo('Step 1: Fixing API methods');
  await runScript('implement-missing-api-methods.js', 'Implementing missing API methods');
  await runScript('update-api-registry.js', 'Updating API registry');
  await runScript('update-handlers.js', 'Updating handlers');
  
  // Step 2: Fix database connection and structure
  logInfo('Step 2: Fixing database connection and structure');
  await runScript('fix-database-connection.js', 'Fixing database connection');
  await runScript('fix-remaining-issues.js', 'Fixing remaining issues');
  
  // Step 3: Update frontend components
  logInfo('Step 3: Updating frontend components');
  await runScript('update-frontend-components.js', 'Updating frontend components');
  await runScript('fix-user-settings-rendering.js', 'Fixing UserSettings rendering');
  
  // Step 4: Add sample data to user_accs table
  logInfo('Step 4: Adding sample data to user_accs table');
  await runScript('fix-user-accs-data.js', 'Adding sample data to user_accs table');
  
  // Step 5: Fix authentication endpoints
  logInfo('Step 5: Fixing authentication endpoints');
  await runScript('fix-auth-endpoints.js', 'Fixing authentication endpoints');
  
  // Step 6: Run system health monitor
  logInfo('Step 6: Running system health monitor');
  await runScript('run-system-health-monitor-data-display.js', 'Running system health monitor');
  
  console.log(chalk.bold('\n=== Complete Fix Complete ==='));
  logInfo('All fixes have been applied.');
  logInfo('To verify, run the system health monitor again:');
  logInfo('node run-system-health-monitor-data-display.js');
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
