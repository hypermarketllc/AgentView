/**
 * run-system-health-monitor-data-display.js
 * 
 * This script runs the system health monitor data display check.
 * It checks if data is being displayed correctly in each section of the application.
 */

import { spawn } from 'child_process';
import chalk from 'chalk';

console.log(chalk.bold('=== Running System Health Monitor - Data Display Check ==='));

// Run the system health monitor data display check
const monitor = spawn('node', ['system-health-monitor-data-display.js'], {
  stdio: 'inherit'
});

// Handle process exit
monitor.on('close', (code) => {
  if (code === 0) {
    console.log(chalk.green('\n✅ System health monitor data display check completed successfully'));
  } else {
    console.error(chalk.red(`\n❌ System health monitor data display check failed with code ${code}`));
  }
});
