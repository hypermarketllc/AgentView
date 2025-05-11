/**
 * fix-system-health-checks-table.js
 * This script fixes the system_health_checks table structure
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

console.log(chalk.bold('=== Fixing System Health Checks Table ==='));

// PostgreSQL connection
const { Pool } = pg;
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'agentview',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

// Function to check if a table exists
async function tableExists(tableName) {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    );
  `, [tableName]);
  
  return result.rows[0].exists;
}

// Function to check if a column exists in a table
async function columnExists(tableName, columnName) {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = $1
      AND column_name = $2
    );
  `, [tableName, columnName]);
  
  return result.rows[0].exists;
}

// Function to fix the system_health_checks table
async function fixSystemHealthChecksTable() {
  try {
    // Check if the system_health_checks table exists
    const tableExistsResult = await tableExists('system_health_checks');
    
    if (!tableExistsResult) {
      logInfo('system_health_checks table does not exist, creating it...');
      
      // Create the table
      await pool.query(`
        CREATE TABLE system_health_checks (
          id UUID PRIMARY KEY,
          component VARCHAR(255) NOT NULL,
          status VARCHAR(50) NOT NULL,
          message TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
      `);
      
      logSuccess('system_health_checks table created successfully');
      return true;
    }
    
    // Check if the component column exists
    const componentColumnExists = await columnExists('system_health_checks', 'component');
    
    if (!componentColumnExists) {
      logInfo('component column does not exist in system_health_checks table, adding it...');
      
      // Add the component column
      await pool.query(`
        ALTER TABLE system_health_checks
        ADD COLUMN component VARCHAR(255) NOT NULL DEFAULT 'System';
      `);
      
      logSuccess('component column added to system_health_checks table');
    } else {
      logInfo('component column already exists in system_health_checks table');
    }
    
    // Check if the status column exists
    const statusColumnExists = await columnExists('system_health_checks', 'status');
    
    if (!statusColumnExists) {
      logInfo('status column does not exist in system_health_checks table, adding it...');
      
      // Add the status column
      await pool.query(`
        ALTER TABLE system_health_checks
        ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'OK';
      `);
      
      logSuccess('status column added to system_health_checks table');
    } else {
      logInfo('status column already exists in system_health_checks table');
    }
    
    // Check if the message column exists
    const messageColumnExists = await columnExists('system_health_checks', 'message');
    
    if (!messageColumnExists) {
      logInfo('message column does not exist in system_health_checks table, adding it...');
      
      // Add the message column
      await pool.query(`
        ALTER TABLE system_health_checks
        ADD COLUMN message TEXT;
      `);
      
      logSuccess('message column added to system_health_checks table');
    } else {
      logInfo('message column already exists in system_health_checks table');
    }
    
    // Check if the created_at column exists
    const createdAtColumnExists = await columnExists('system_health_checks', 'created_at');
    
    if (!createdAtColumnExists) {
      logInfo('created_at column does not exist in system_health_checks table, adding it...');
      
      // Add the created_at column
      await pool.query(`
        ALTER TABLE system_health_checks
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
      `);
      
      logSuccess('created_at column added to system_health_checks table');
    } else {
      logInfo('created_at column already exists in system_health_checks table');
    }
    
    return true;
  } catch (error) {
    logError(`Error fixing system_health_checks table: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  try {
    // Connect to the database
    await pool.connect();
    
    // Fix the system_health_checks table
    const tableFixed = await fixSystemHealthChecksTable();
    
    // Print summary
    console.log(chalk.bold('\n=== System Health Checks Table Fix Summary ==='));
    console.log(`System Health Checks Table Fixed: ${tableFixed ? chalk.green('SUCCESS') : chalk.red('FAILED')}`);
    
    if (tableFixed) {
      console.log(chalk.bold('\nSystem health checks table has been fixed successfully!'));
      console.log(chalk.bold('\nYou can now run the system health monitor data display script:'));
      console.log(chalk.cyan('node run-system-health-monitor-data-display.js'));
    } else {
      console.log(chalk.bold('\nFailed to fix the system health checks table. Please check the logs for details.'));
    }
  } catch (error) {
    logError(`Error fixing system health checks table: ${error.message}`);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the main function
main();
