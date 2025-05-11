/**
 * Run Fixed API Server
 * Runs the fixed server with API routes for system health checks, user accounts, and settings
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== Running Fixed API Server ===');

// Start the server
const serverProcess = spawn('node', ['server-docker-fixed.js'], {
  stdio: 'inherit',
  cwd: __dirname
});

serverProcess.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

serverProcess.on('error', (err) => {
  console.error('Failed to start server process:', err);
});
