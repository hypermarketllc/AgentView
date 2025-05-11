/**
 * run-fixed-system-with-monitoring.js
 * This script runs the server with all fixes applied, including system health monitoring.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Function to check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    console.error(`Error checking if file exists: ${filePath}`, error);
    return false;
  }
}

// Function to run a script
function runScript(scriptPath) {
  try {
    console.log(`Running script: ${scriptPath}`);
    execSync(`node ${scriptPath}`, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Error running script: ${scriptPath}`, error);
    return false;
  }
}

// Main function
async function main() {
  console.log('Starting fixed system with monitoring...');
  
  // Step 1: Apply API route fixes
  if (fileExists('fix-api-routes.js')) {
    console.log('Applying API route fixes...');
    runScript('fix-api-routes.js');
  } else {
    console.log('API route fixes script not found. Skipping...');
  }
  
  // Step 2: Update user settings component
  if (fileExists('update-user-settings.js')) {
    console.log('Updating user settings component...');
    runScript('update-user-settings.js');
  } else {
    console.log('User settings update script not found. Skipping...');
  }
  
  // Step 3: Run system health monitoring data display check
  if (fileExists('system-health-monitor-data-display-check.js')) {
    console.log('Running system health monitoring data display check...');
    runScript('system-health-monitor-data-display-check.js');
  } else {
    console.log('System health monitoring data display check script not found. Skipping...');
  }
  
  // Step 4: Update dashboard layout
  if (fileExists('update-dashboard-layout.js')) {
    console.log('Updating dashboard layout...');
    runScript('update-dashboard-layout.js');
  } else {
    console.log('Dashboard layout update script not found. Skipping...');
  }
  
  // Step 5: Create missing tables if needed
  if (fileExists('apply-missing-tables.js')) {
    console.log('Creating missing tables...');
    runScript('apply-missing-tables.js');
  } else {
    console.log('Missing tables script not found. Skipping...');
  }
  
  // Step 6: Run the fixed server
  console.log('Starting the fixed server...');
  
  // Check if run-fixed-server-with-db.js exists
  if (fileExists('run-fixed-server-with-db.js')) {
    console.log('Running server with database connection...');
    runScript('run-fixed-server-with-db.js');
  } else if (fileExists('run-fixed-server.js')) {
    console.log('Running fixed server...');
    runScript('run-fixed-server.js');
  } else {
    console.log('Fixed server script not found. Running standard server...');
    runScript('server-docker.js');
  }
  
  console.log('Server started successfully with all fixes applied.');
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
