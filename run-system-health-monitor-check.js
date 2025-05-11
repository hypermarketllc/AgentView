/**
 * run-system-health-monitor-check.js
 * This script runs the system health monitor check
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Promisify exec
const execPromise = promisify(exec);

// Path to system health monitor check script
const checkScriptPath = path.join(__dirname, 'system-health-monitor-check.js');

console.log('=== Running System Health Monitor Check ===');
console.log('Checking if node-fetch is installed...');

// Check if node-fetch is installed
async function checkAndInstallNodeFetch() {
  try {
    // Try to require node-fetch
    await import('node-fetch');
    console.log('node-fetch is already installed');
    return true;
  } catch (error) {
    // If node-fetch is not installed, install it
    console.log('node-fetch is not installed, installing...');
    try {
      await execPromise('npm install node-fetch');
      console.log('node-fetch installed successfully');
      return true;
    } catch (installError) {
      console.error('Error installing node-fetch:', installError);
      return false;
    }
  }
}

// Run the system health monitor check script
async function runCheck() {
  try {
    const { stdout, stderr } = await execPromise(`node ${checkScriptPath}`);
    console.log(stdout);
    if (stderr) {
      console.error('Errors:', stderr);
    }
    console.log('System health monitor check completed successfully!');
    return true;
  } catch (error) {
    console.error('Error running system health monitor check:', error);
    return false;
  }
}

// Main function
async function main() {
  // Check if node-fetch is installed
  const nodeFetchInstalled = await checkAndInstallNodeFetch();
  if (!nodeFetchInstalled) {
    console.error('Failed to install node-fetch. Aborting.');
    return;
  }
  
  // Run the system health monitor check
  await runCheck();
}

// Run the main function
main();
