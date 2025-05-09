/**
 * fix-database-and-run.js
 * 
 * This script fixes database issues and runs the application.
 * It ensures all required tables exist and have data before starting the app.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting database fix and application runner...');
console.log('=============================================');

// Step 1: Apply database fixes
console.log('\n1. Applying database fixes...');
try {
  execSync('node apply-database-fixes.js', { stdio: 'inherit' });
} catch (error) {
  console.error('Error applying database fixes:', error.message);
  process.exit(1);
}

// Step 2: Run the application
console.log('\n2. Starting the application...');
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

console.log('\n✅ Application has been started with database fixes applied.');
console.log('You can access the application at: http://localhost:3000/crm');
console.log('Login with:');
console.log('  Email: admin@americancoveragecenter.com');
console.log('  Password: admin123');
