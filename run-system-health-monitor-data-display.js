/**
 * run-system-health-monitor-data-display.js
 * This script runs the system health monitor data display script
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(chalk.bold('=== Running System Health Monitor Data Display ==='));

// Run the script
const child = spawn('node', ['system-health-monitor-data-display.js'], {
  stdio: 'inherit',
  env: {
    ...process.env
  }
});

child.on('error', (error) => {
  console.error(chalk.red(`Error running system-health-monitor-data-display.js: ${error.message}`));
  process.exit(1);
});

child.on('close', (code) => {
  if (code === 0) {
    console.log(chalk.green('✅ System health monitor data display script completed successfully'));
  } else {
    console.error(chalk.red(`❌ System health monitor data display script failed with code ${code}`));
  }
});
