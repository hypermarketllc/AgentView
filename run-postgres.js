/**
 * Simple cross-platform entry point for the PostgreSQL All-in-One Runner
 * 
 * This script simply executes the main run-postgres-all.mjs script.
 * It works on both Windows and Unix-like systems without requiring
 * separate .bat and .sh files.
 * 
 * Usage: node run-postgres.js
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting PostgreSQL All-in-One Runner...');

// Run the main script
const child = spawn('node', [path.join(__dirname, 'run-postgres-all.mjs')], {
  stdio: 'inherit',
  shell: true
});

// Handle process exit
child.on('close', (code) => {
  if (code !== 0) {
    console.error(`Process exited with code ${code}`);
    
    // Keep the console open on Windows
    if (process.platform === 'win32') {
      console.log('Press any key to exit...');
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', process.exit.bind(process, 0));
    }
  }
});

// Handle errors
child.on('error', (err) => {
  console.error('Failed to start process:', err);
  
  // Keep the console open on Windows
  if (process.platform === 'win32') {
    console.log('Press any key to exit...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', process.exit.bind(process, 0));
  }
});
