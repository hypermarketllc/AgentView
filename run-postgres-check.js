/**
 * run-postgres-check.js
 * 
 * A script to run PostgreSQL connection and authentication checks.
 * This script uses the module-loader utility to handle both ES modules and CommonJS environments.
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import * as moduleLoader from './src/lib/module-loader.js';

// Initialize dotenv
dotenv.config();

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Log environment information
console.log('===========================================');
console.log('PostgreSQL Check Runner');
console.log('===========================================');
console.log(`Module System: ${moduleLoader.isUsingESModules() ? 'ES Modules' : 'CommonJS'}`);
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`PostgreSQL Host: ${process.env.POSTGRES_HOST || 'localhost'}`);
console.log(`PostgreSQL Port: ${process.env.POSTGRES_PORT || '5432'}`);
console.log(`PostgreSQL Database: ${process.env.POSTGRES_DB || 'agentview'}`);
console.log('===========================================\n');

/**
 * Run the PostgreSQL connection check
 */
async function runConnectionCheck() {
  console.log('Running PostgreSQL connection check...');
  
  try {
    // Use dynamic import to load the check-postgres-connection module
    const checkModule = await import('./check-postgres-connection.js');
    
    // If the module exports a function, call it
    if (typeof checkModule.default === 'function') {
      await checkModule.default();
    }
    // Otherwise, the module should run automatically
    
    console.log('\nConnection check completed.');
  } catch (error) {
    console.error('\nError running connection check:', error.message);
    console.error(error);
  }
}

/**
 * Run the admin authentication check
 */
async function runAdminAuthCheck() {
  console.log('\nRunning admin authentication check...');
  
  try {
    // Use dynamic import to load the check-admin-auth module
    const authModule = await import('./check-admin-auth.js');
    
    // If the module exports a function, call it
    if (typeof authModule.default === 'function') {
      await authModule.default();
    }
    // Otherwise, the module should run automatically
    
    console.log('\nAuthentication check completed.');
  } catch (error) {
    console.error('\nError running authentication check:', error.message);
    console.error(error);
  }
}

/**
 * Main function to run all checks
 */
async function main() {
  const args = process.argv.slice(2);
  const runAll = args.includes('--all') || args.includes('-a');
  const runConnection = runAll || args.includes('--connection') || args.includes('-c');
  const runAuth = runAll || args.includes('--auth') || args.includes('-u');
  
  // If no specific checks are requested, run connection check by default
  if (!runConnection && !runAuth) {
    await runConnectionCheck();
  } else {
    if (runConnection) {
      await runConnectionCheck();
    }
    
    if (runAuth) {
      await runAdminAuthCheck();
    }
  }
  
  console.log('\n===========================================');
  console.log('All requested checks completed.');
  console.log('===========================================');
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
