/**
 * check-and-fix-duplicates.js
 * This script checks for duplicate component values in the system_health_checks table and fixes them
 */

import pg from 'pg';
import dotenv from 'dotenv';
import chalk from 'chalk';

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

console.log(chalk.bold('=== Checking and Fixing Duplicate Component Values ==='));

// PostgreSQL connection
const { Pool } = pg;
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'agentview',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

// Function to check for duplicate component values
async function checkAndFixDuplicates() {
  try {
    // Connect to the database
    await pool.connect();
    
    // Check if the system_health_checks table exists
    const tableExistsResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_health_checks'
      );
    `);
    
    if (!tableExistsResult.rows[0].exists) {
      logError('system_health_checks table does not exist');
      return false;
    }
    
    // Check for duplicate component values
    logInfo('Checking for duplicate component values...');
    
    const duplicatesResult = await pool.query(`
      SELECT component, COUNT(*) as count
      FROM system_health_checks
      GROUP BY component
      HAVING COUNT(*) > 1;
    `);
    
    if (duplicatesResult.rows.length === 0) {
      logSuccess('No duplicate component values found');
      return true;
    }
    
    logInfo(`Found ${duplicatesResult.rows.length} components with duplicate values`);
    
    // Fix duplicate component values
    logInfo('Fixing duplicate component values...');
    
    for (const row of duplicatesResult.rows) {
      const component = row.component;
      
      logInfo(`Fixing duplicates for component: ${component}`);
      
      // Get all rows for this component
      const rowsResult = await pool.query(`
        SELECT id, component, status, message, endpoint, category, created_at
        FROM system_health_checks
        WHERE component = $1
        ORDER BY created_at DESC;
      `, [component]);
      
      // Keep the most recent row and delete the others
      const rows = rowsResult.rows;
      const mostRecentRow = rows[0];
      
      logInfo(`Keeping most recent row with id: ${mostRecentRow.id}`);
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        
        logInfo(`Deleting duplicate row with id: ${row.id}`);
        
        await pool.query(`
          DELETE FROM system_health_checks
          WHERE id = $1;
        `, [row.id]);
      }
    }
    
    logSuccess('Fixed all duplicate component values');
    
    return true;
  } catch (error) {
    logError(`Error checking and fixing duplicates: ${error.message}`);
    return false;
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Main function
async function main() {
  try {
    // Check and fix duplicate component values
    const success = await checkAndFixDuplicates();
    
    // Print summary
    console.log(chalk.bold('\n=== Duplicate Component Values Check and Fix Summary ==='));
    console.log(`Check and Fix: ${success ? chalk.green('SUCCESS') : chalk.red('FAILED')}`);
    
    if (success) {
      console.log(chalk.bold('\nDuplicate component values have been checked and fixed.'));
      console.log('You can now apply the unique constraint to the component column.');
    } else {
      console.log(chalk.bold('\nFailed to check and fix duplicate component values. Please check the logs for details.'));
    }
  } catch (error) {
    logError(`Error in main function: ${error.message}`);
  }
}

// Run the main function
main();
