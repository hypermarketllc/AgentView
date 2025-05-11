/**
 * Run server with position fix
 * This script applies the position fix and then starts the authentication server
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Log a message with color
 * @param {string} message - Message to log
 * @param {string} color - Color to use
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Log a section header
 * @param {string} title - Section title
 */
function logSection(title) {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log('='.repeat(80));
}

/**
 * Run a script and wait for it to complete
 * @param {string} scriptPath - Path to the script
 * @returns {Promise<boolean>} True if the script completed successfully
 */
function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    log(`Running script: ${scriptPath}`, colors.blue);
    
    const process = spawn('node', [scriptPath], {
      stdio: 'inherit',
      shell: true
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        log(`Script ${scriptPath} completed successfully`, colors.green);
        resolve(true);
      } else {
        log(`Script ${scriptPath} failed with code ${code}`, colors.red);
        resolve(false);
      }
    });
    
    process.on('error', (err) => {
      log(`Error running script ${scriptPath}: ${err.message}`, colors.red);
      reject(err);
    });
  });
}

/**
 * Main function
 */
async function main() {
  logSection('Starting server with position fix');
  
  try {
    // Step 1: Apply position fix
    log('Step 1: Applying position fix...', colors.yellow);
    
    const positionFixPath = join(__dirname, 'position-fix', 'main.mjs');
    
    if (!existsSync(positionFixPath)) {
      throw new Error(`Position fix script not found at ${positionFixPath}`);
    }
    
    const positionFixSuccess = await runScript(positionFixPath);
    
    if (!positionFixSuccess) {
      throw new Error('Position fix failed');
    }
    
    // Step 2: Start authentication server
    log('Step 2: Starting authentication server...', colors.yellow);
    
    const authServerPath = join(__dirname, 'run_fixed_auth_server.mjs');
    
    if (!existsSync(authServerPath)) {
      throw new Error(`Authentication server script not found at ${authServerPath}`);
    }
    
    await runScript(authServerPath);
    
  } catch (error) {
    log(`Error: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Run the main function
main();
