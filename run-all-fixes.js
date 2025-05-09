/**
 * run-all-fixes.js
 * 
 * This script runs all the fixes for the missing API methods and data display issues.
 * It runs the following scripts in sequence:
 * 1. implement-missing-api-methods.js - Creates the missing API methods
 * 2. update-api-registry.js - Updates the API registry with the new endpoints
 * 3. update-handlers.js - Updates the handlers with the new functions
 * 4. system-health-monitor-data-display.js - Checks if data is being displayed correctly
 */

import { spawn } from 'child_process';
import chalk from 'chalk';

console.log(chalk.bold('=== Running All Fixes ==='));

// Function to run a script and wait for it to complete
function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    console.log(chalk.blue(`\nRunning ${scriptName}...`));
    
    const process = spawn('node', [scriptName], {
      stdio: 'inherit'
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green(`✅ ${scriptName} completed successfully`));
        resolve();
      } else {
        console.error(chalk.red(`❌ ${scriptName} failed with code ${code}`));
        reject(new Error(`Script ${scriptName} failed with code ${code}`));
      }
    });
  });
}

// Run all scripts in sequence
async function runAllScripts() {
  try {
    // Step 1: Implement missing API methods
    await runScript('implement-missing-api-methods.js');
    
    // Step 2: Update API registry
    await runScript('update-api-registry.js');
    
    // Step 3: Update handlers
    await runScript('update-handlers.js');
    
    // Step 4: Run system health monitor data display check
    await runScript('system-health-monitor-data-display.js');
    
    console.log(chalk.bold('\n=== All Fixes Completed Successfully ==='));
    console.log(chalk.green('✅ All missing API methods have been implemented'));
    console.log(chalk.green('✅ API registry has been updated with new endpoints'));
    console.log(chalk.green('✅ Handlers have been updated with new functions'));
    console.log(chalk.green('✅ System health monitor has been updated to check data display'));
    console.log(chalk.blue('\nTo apply these changes, restart the server.'));
  } catch (error) {
    console.error(chalk.red(`\n❌ Error running fixes: ${error.message}`));
    process.exit(1);
  }
}

// Run all scripts
runAllScripts();
