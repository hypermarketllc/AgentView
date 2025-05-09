/**
 * fix-database-connection.js
 * 
 * This script updates the database connection details in the .env file
 * to fix the database connection issues in the system health monitor.
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import dotenv from 'dotenv';

// Helper function to log success
function logSuccess(message) {
  console.log(chalk.green('✅ ' + message));
}

// Helper function to log error
function logError(message) {
  console.error(chalk.red('❌ ' + message));
}

// Helper function to log info
function logInfo(message) {
  console.log(chalk.blue('ℹ️ ' + message));
}

// Helper function to log warning
function logWarning(message) {
  console.log(chalk.yellow('⚠️ ' + message));
}

// Update the .env file with the correct database connection details
function updateEnvFile() {
  logInfo('Updating .env file with correct database connection details...');
  
  try {
    // Check if the .env file exists
    const envPath = path.join('.env');
    
    if (!fs.existsSync(envPath)) {
      logWarning('.env file does not exist, creating it...');
      fs.writeFileSync(envPath, '');
    }
    
    // Read the current content
    const currentContent = fs.readFileSync(envPath, 'utf8');
    
    // Parse the current content
    const env = dotenv.parse(currentContent);
    
    // Update the database connection details
    env.DATABASE_URL = env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';
    env.POSTGRES_URL = env.POSTGRES_URL || 'postgres://postgres:postgres@localhost:5432/postgres';
    
    // Convert the env object back to a string
    let newContent = '';
    for (const [key, value] of Object.entries(env)) {
      newContent += `${key}=${value}\n`;
    }
    
    // Write the updated content back to the .env file
    fs.writeFileSync(envPath, newContent);
    
    logSuccess('Updated .env file with correct database connection details');
    return true;
  } catch (error) {
    logError(`Error updating .env file: ${error.message}`);
    return false;
  }
}

// Update the system-health-monitor-data-display.js file to use the correct database connection details
function updateSystemHealthMonitor() {
  logInfo('Updating system-health-monitor-data-display.js to use correct database connection details...');
  
  try {
    // Check if the file exists
    const monitorPath = path.join('system-health-monitor-data-display.js');
    
    if (!fs.existsSync(monitorPath)) {
      logError(`File not found: ${monitorPath}`);
      return false;
    }
    
    // Read the current content
    const currentContent = fs.readFileSync(monitorPath, 'utf8');
    
    // Update the database connection details
    const updatedContent = currentContent.replace(
      /const pool = new Pool\(\{([^}]+)\}\);/,
      `const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgres://postgres:postgres@localhost:5432/postgres',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});`
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(monitorPath, updatedContent);
    
    logSuccess('Updated system-health-monitor-data-display.js with correct database connection details');
    return true;
  } catch (error) {
    logError(`Error updating system-health-monitor-data-display.js: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log(chalk.bold('=== Fixing Database Connection ==='));
  
  // Update the .env file
  updateEnvFile();
  
  // Update the system health monitor
  updateSystemHealthMonitor();
  
  console.log(chalk.bold('\n=== Database Connection Fix Complete ==='));
  logInfo('The database connection details have been updated.');
  logInfo('To apply these changes, run the system health monitor again:');
  logInfo('node run-system-health-monitor-data-display.js');
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
