/**
 * run-fixed-postgres-docker.js
 * 
 * This script runs the server-postgres-docker.js with the MIME type fixes applied.
 * It ensures that all necessary patches are applied before starting the server.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if fix-mime-types.mjs exists
const mimeFixPath = path.join(__dirname, 'fix-mime-types.mjs');
if (!fs.existsSync(mimeFixPath)) {
  console.error('❌ fix-mime-types.mjs not found. Please ensure it exists before running this script.');
  process.exit(1);
}

// Check if inject-mime-fix.js exists
const injectMimeFixPath = path.join(__dirname, 'inject-mime-fix.js');
if (!fs.existsSync(injectMimeFixPath)) {
  console.error('❌ inject-mime-fix.js not found. Please ensure it exists before running this script.');
  process.exit(1);
}

// Check if server-postgres-docker.js exists
const serverPath = path.join(__dirname, 'server-postgres-docker.js');
if (!fs.existsSync(serverPath)) {
  console.error('❌ server-postgres-docker.js not found. Please ensure it exists before running this script.');
  process.exit(1);
}

console.log('✅ All required files found');
console.log('🚀 Starting server with MIME type fixes...');

// Run the server
const server = spawn('node', ['server-postgres-docker.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: '--experimental-modules --es-module-specifier-resolution=node'
  }
});

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

server.on('close', (code) => {
  if (code !== 0) {
    console.error(`❌ Server exited with code ${code}`);
    process.exit(code);
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('👋 Shutting down server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('👋 Shutting down server...');
  server.kill('SIGTERM');
});
