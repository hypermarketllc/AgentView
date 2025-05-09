/**
 * run-system-health-monitor.js
 * 
 * This script runs the system health monitor to check if data is being
 * properly displayed in each section of the application.
 */

import { spawn } from 'child_process';

console.log('Starting system health monitor...');

// Start the system health monitor process
const monitorProcess = spawn('node', ['system-health-monitor.js'], {
  stdio: 'inherit',
  shell: true
});

monitorProcess.on('error', (error) => {
  console.error('Failed to start system health monitor:', error);
  process.exit(1);
});

monitorProcess.on('close', (code) => {
  console.log(`System health monitor process exited with code ${code}`);
  process.exit(code);
});

// Handle termination signals
process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down system health monitor...');
  monitorProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down system health monitor...');
  monitorProcess.kill('SIGTERM');
});
