/**
 * apply-unique-constraint.js
 * This script applies the unique constraint to the system_health_checks table
 */

import pg from 'pg';
import dotenv from 'dotenv';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

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

console.log(chalk.bold('=== Applying Unique Constraint to System Health Checks Table ==='));

// PostgreSQL connection
const { Pool } = pg;
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'agentview',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

// Function to apply the unique constraint
async function applyUniqueConstraint() {
  try {
    // Connect to the database
    await pool.connect();
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'add-unique-constraint.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    logInfo('Applying unique constraint to system_health_checks table...');
    await pool.query(sql);
    
    logSuccess('Applied unique constraint to system_health_checks table');
    
    return true;
  } catch (error) {
    logError(`Error applying unique constraint: ${error.message}`);
    return false;
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Main function
async function main() {
  try {
    // Apply the unique constraint
    const success = await applyUniqueConstraint();
    
    // Print summary
    console.log(chalk.bold('\n=== Unique Constraint Application Summary ==='));
    console.log(`Application: ${success ? chalk.green('SUCCESS') : chalk.red('FAILED')}`);
    
    if (success) {
      console.log(chalk.bold('\nUnique constraint has been applied to the system_health_checks table.'));
      console.log('The component column now has a unique constraint, which allows the ON CONFLICT clause to work properly.');
    } else {
      console.log(chalk.bold('\nFailed to apply unique constraint. Please check the logs for details.'));
    }
  } catch (error) {
    logError(`Error in main function: ${error.message}`);
  }
}

// Run the main function
main();
