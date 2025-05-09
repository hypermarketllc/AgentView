/**
 * run-patched-server.js
 * 
 * Script to apply the robust patch and run the modular server
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

/**
 * Runs a command and returns a promise that resolves when the command completes
 * @param {string} command - The command to run
 * @param {Array<string>} args - The arguments to pass to the command
 * @returns {Promise<number>} - The exit code of the command
 */
function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`${colors.cyan}> ${command} ${args.join(' ')}${colors.reset}`);
    
    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    proc.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Main function to run the patched server
 */
async function main() {
  try {
    console.log(`${colors.green}${colors.bright}=== Running Patched Server ===${colors.reset}`);
    console.log(`${colors.yellow}1. Applying robust patch...${colors.reset}`);
    
    // Apply the robust patch
    await runCommand('node', ['apply-robust-patch.js']);
    
    console.log(`\n${colors.yellow}2. Starting modular server...${colors.reset}`);
    
    // Run the modular server
    await runCommand('node', ['server-docker-index.js']);
  } catch (err) {
    console.error(`${colors.red}${colors.bright}Error:${colors.reset} ${err.message}`);
    process.exit(1);
  }
}

// Run the main function
main();
