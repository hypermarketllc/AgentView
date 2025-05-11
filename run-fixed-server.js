/**
 * run-fixed-server.js
 * This script runs the server with all fixes applied
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(chalk.bold('=== Running Fixed Server ==='));

// Run the server
const server = spawn('node', ['server-docker.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: '3000',
    NODE_ENV: 'development'
  }
});

server.on('error', (error) => {
  console.error(chalk.red(`Server error: ${error.message}`));
});

server.on('close', (code) => {
  console.log(chalk.blue(`Server process exited with code ${code}`));
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log(chalk.yellow('Stopping server...'));
  server.kill('SIGINT');
  process.exit(0);
});

console.log(chalk.green('Server is running on http://localhost:3000/crm'));
console.log(chalk.blue('Press Ctrl+C to stop the server'));
