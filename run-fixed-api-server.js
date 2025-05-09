/**
 * run-fixed-api-server.js
 * 
 * This script runs the fixed API server that properly implements
 * the missing API routes for user settings and system settings.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Start the fixed API server
 */
function startFixedServer() {
  console.log('Starting fixed API server...');
  
  // Use the fixed server script
  const serverScript = 'server-docker-fixed.js';
  
  if (!fs.existsSync(serverScript)) {
    console.error(`Error: Fixed server script ${serverScript} not found`);
    process.exit(1);
  }
  
  console.log(`Using fixed server script: ${serverScript}`);
  
  // Start the server process
  const serverProcess = spawn('node', [serverScript], {
    stdio: 'inherit',
    shell: true
  });
  
  serverProcess.on('error', (error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
  
  serverProcess.on('exit', (code) => {
    console.log(`Server process exited with code ${code}`);
    process.exit(code);
  });
  
  console.log('Fixed API server is running. Press Ctrl+C to stop.');
}

// Start the server
console.log('=== Starting Fixed API Server ===\n');
startFixedServer();
