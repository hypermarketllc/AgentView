/**
 * run-app-with-tables.js
 * 
 * A script to run the application after applying the required tables.
 * This will first check if the required tables exist, create them if they don't,
 * and then start the application.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting application with required tables...');

// First, check if the required tables exist
console.log('\n1. Checking for required tables...');
try {
  execSync('node check-missing-tables.js', { stdio: 'inherit' });
} catch (error) {
  console.error('Error checking for required tables:', error.message);
  process.exit(1);
}

// Apply the required tables
console.log('\n2. Applying required tables...');
try {
  execSync('node apply-required-tables.js', { stdio: 'inherit' });
} catch (error) {
  console.error('Error applying required tables:', error.message);
  process.exit(1);
}

// Start the application
console.log('\n3. Starting the application...');
try {
  // Check if run-postgres.js exists
  if (fs.existsSync(path.join(__dirname, 'run-postgres.js'))) {
    execSync('node run-postgres.js', { stdio: 'inherit' });
  } else if (fs.existsSync(path.join(__dirname, 'run-postgres-app.js'))) {
    execSync('node run-postgres-app.js', { stdio: 'inherit' });
  } else {
    console.log('No specific PostgreSQL app runner found. Using default server...');
    execSync('node server-postgres.js', { stdio: 'inherit' });
  }
} catch (error) {
  console.error('Error starting the application:', error.message);
  process.exit(1);
}
