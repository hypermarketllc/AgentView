/**
 * Script to run the fixed authentication server
 * This script first applies the users table and then starts the server
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting fixed authentication server...');

// Function to run a script and wait for it to complete
async function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`Running script: ${scriptPath}`);
    
    const process = spawn('node', [scriptPath], {
      stdio: 'inherit',
      shell: true
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log(`Script ${scriptPath} completed successfully`);
        resolve();
      } else {
        console.error(`Script ${scriptPath} failed with code ${code}`);
        reject(new Error(`Script exited with code ${code}`));
      }
    });
    
    process.on('error', (err) => {
      console.error(`Failed to start script ${scriptPath}:`, err);
      reject(err);
    });
  });
}

// Main function to run the scripts in sequence
async function main() {
  try {
    // Apply comprehensive authentication system fix
    console.log('Step 1: Applying comprehensive authentication system fix...');
    await runScript(join(__dirname, 'fix-auth-system.mjs'));
    
    // Apply frontend token handling fix
    console.log('Step 2: Applying frontend token handling fix...');
    await runScript(join(__dirname, 'fix-frontend-token.mjs'));
    
    // Apply auth provider fix
    console.log('Step 3: Applying auth provider fix...');
    await runScript(join(__dirname, 'auth-modules/auth-provider-main.mjs'));
    
    // Fix frontend position_id null reference with enhanced version
    console.log('Step 4: Applying enhanced frontend position_id fix...');
    await runScript(join(__dirname, 'fix-frontend-position-id-enhanced.mjs'));
    
    // Apply user object structure normalizer
    console.log('Step 5: Applying user object structure normalizer...');
    await runScript(join(__dirname, 'fix-user-object-structure.mjs'));
    
    // Then, start the server
    console.log('Step 6: Starting authentication server...');
    await runScript(join(__dirname, 'run_server_with_auth.mjs'));
    
  } catch (error) {
    console.error('Error running scripts:', error);
    process.exit(1);
  }
}

// Run the main function
main();
