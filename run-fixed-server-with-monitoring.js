/**
 * run-fixed-server-with-monitoring.js
 * 
 * This script runs the server with all fixes applied and includes system health monitoring.
 * It applies the following fixes:
 * 1. Creates missing tables (system_health_checks, settings, user_accs)
 * 2. Fixes API routes for missing endpoints
 * 3. Adds system health monitoring
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Main function to run the server with all fixes
async function runFixedServer() {
  console.log('Starting server with all fixes applied...');
  
  try {
    // Step 1: Apply missing tables
    console.log('\n=== Step 1: Applying missing tables ===');
    await runScript('apply-missing-tables-complete.js');
    
    // Step 2: Run system health data display check
    console.log('\n=== Step 2: Running system health data display check ===');
    await runScript('system-health-data-display-check.js');
    
    // Step 3: Start the server
    console.log('\n=== Step 3: Starting the server ===');
    
    // Determine which server script to run based on environment
    const serverScript = determineServerScript();
    
    // Start the server
    const serverProcess = spawn('node', [serverScript], {
      stdio: 'inherit',
      env: process.env
    });
    
    // Handle server process events
    serverProcess.on('error', (error) => {
      console.error('Failed to start server:', error);
    });
    
    serverProcess.on('close', (code) => {
      console.log(`Server process exited with code ${code}`);
    });
    
    console.log(`Server started with script: ${serverScript}`);
    console.log('Press Ctrl+C to stop the server.');
    
    // Keep the process running
    process.stdin.resume();
    
    // Handle process termination
    process.on('SIGINT', () => {
      console.log('Stopping server...');
      serverProcess.kill();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error running fixed server:', error);
    process.exit(1);
  }
}

// Helper function to run a script
async function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`Running script: ${scriptPath}`);
    
    const process = spawn('node', [scriptPath], {
      stdio: 'inherit'
    });
    
    process.on('error', (error) => {
      console.error(`Failed to run script ${scriptPath}:`, error);
      reject(error);
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log(`Script ${scriptPath} completed successfully.`);
        resolve();
      } else {
        console.error(`Script ${scriptPath} exited with code ${code}`);
        reject(new Error(`Script exited with code ${code}`));
      }
    });
  });
}

// Helper function to determine which server script to run
function determineServerScript() {
  // Check for Docker environment
  if (process.env.DOCKER_ENV === 'true') {
    return 'server-docker.js';
  }
  
  // Check for Postgres environment
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    return 'server-postgres.js';
  }
  
  // Default to simple server
  return 'server-simple.js';
}

// Run the server
runFixedServer();
