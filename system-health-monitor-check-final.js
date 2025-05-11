/**
 * system-health-monitor-check-final.js
 * This script checks if all the fixes have been applied correctly
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

console.log(chalk.bold('=== Running System Health Monitoring Checks ==='));

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

// Function to check if required tables exist
async function checkRequiredTables() {
  logInfo('Checking if required tables exist...');
  
  const tables = ['system_health_checks', 'user_accs', 'settings'];
  const results = {};
  
  for (const table of tables) {
    const exists = await tableExists(table);
    results[table] = exists;
    
    if (exists) {
      logSuccess(`${table} table exists`);
    } else {
      logError(`${table} table does not exist`);
    }
  }
  
  return results;
}

// Function to check if API methods exist
async function checkApiMethods() {
  logInfo('Checking if API methods exist...');
  
  try {
    // Check if server-docker-routes.js exists
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const routesFilePath = path.join(__dirname, 'server-docker-routes.js');
    
    if (!fs.existsSync(routesFilePath)) {
      logError('server-docker-routes.js not found');
      return false;
    }
    
    // Read the file
    const routesContent = fs.readFileSync(routesFilePath, 'utf8');
    
    // Check if the file has the required API methods
    const hasSystemHealthChecksApi = routesContent.includes('app.get(`/crm/api/system/health-checks`');
    const hasSettingsApi = routesContent.includes('app.get(`/crm/api/settings`');
    const hasUserSettingsApi = routesContent.includes('app.get(`/crm/api/user/settings`') || 
                              fs.existsSync(path.join(__dirname, 'server-docker-auth.js')) && 
                              fs.readFileSync(path.join(__dirname, 'server-docker-auth.js'), 'utf8').includes('app.get(`/crm/api/user/settings`');
    
    if (hasSystemHealthChecksApi) {
      logSuccess('system_health_checks API methods exist');
    } else {
      logError('system_health_checks API methods do not exist');
    }
    
    if (hasSettingsApi) {
      logSuccess('settings API methods exist');
    } else {
      logError('settings API methods do not exist');
    }
    
    if (hasUserSettingsApi) {
      logSuccess('user_accs API methods exist');
    } else {
      logError('user_accs API methods do not exist');
    }
    
    return hasSystemHealthChecksApi && hasSettingsApi && hasUserSettingsApi;
  } catch (error) {
    logError(`Error checking API methods: ${error.message}`);
    return false;
  }
}

// Function to check if user settings rendering is fixed
async function checkUserSettingsRendering() {
  logInfo('Checking if user settings rendering is fixed...');
  
  try {
    // Check if UserSettings.tsx exists
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const userSettingsPath = path.join(__dirname, 'src', 'components', 'UserSettings.tsx');
    
    if (!fs.existsSync(userSettingsPath)) {
      logError('UserSettings.tsx not found');
      return false;
    }
    
    // Read the file
    const userSettingsContent = fs.readFileSync(userSettingsPath, 'utf8');
    
    // Check if the file has the user_account rendering
    const hasUserAccountRendering = userSettingsContent.includes('user_account') && 
                                   userSettingsContent.includes('display_name');
    
    if (hasUserAccountRendering) {
      logSuccess('User settings rendering is fixed');
    } else {
      logError('User settings rendering is not fixed');
    }
    
    return hasUserAccountRendering;
  } catch (error) {
    logError(`Error checking user settings rendering: ${error.message}`);
    return false;
  }
}

// Function to check if system health monitoring is set up
async function checkSystemHealthMonitoring() {
  logInfo('Checking if system health monitoring is set up...');
  
  try {
    // Check if system_health_checks table has data
    const result = await pool.query(`
      SELECT COUNT(*) FROM system_health_checks
    `);
    
    const count = parseInt(result.rows[0].count);
    
    if (count > 0) {
      logSuccess(`System health monitoring is set up with ${count} checks`);
    } else {
      logError('System health monitoring is not set up');
    }
    
    return count > 0;
  } catch (error) {
    logError(`Error checking system health monitoring: ${error.message}`);
    return false;
  }
}

// Function to check if data display monitoring is set up
async function checkDataDisplayMonitoring() {
  logInfo('Checking if data display monitoring is set up...');
  
  try {
    // Check if system_health_checks table has data display checks
    const result = await pool.query(`
      SELECT COUNT(*) FROM system_health_checks
      WHERE component IN ('UserSettings', 'SystemMonitoring', 'UserAccounts', 'Settings')
    `);
    
    const count = parseInt(result.rows[0].count);
    
    if (count > 0) {
      logSuccess(`Data display monitoring is set up with ${count} checks`);
    } else {
      logError('Data display monitoring is not set up');
    }
    
    return count > 0;
  } catch (error) {
    logError(`Error checking data display monitoring: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  try {
    // Connect to the database
    await pool.connect();
    
    // Run the checks
    const tablesExist = await checkRequiredTables();
    const apiMethodsExist = await checkApiMethods();
    const userSettingsRenderingFixed = await checkUserSettingsRendering();
    const systemHealthMonitoringSetUp = await checkSystemHealthMonitoring();
    const dataDisplayMonitoringSetUp = await checkDataDisplayMonitoring();
    
    // Print summary
    console.log(chalk.bold('\n=== System Health Monitoring Checks Summary ==='));
    console.log(`Required Tables: ${Object.values(tablesExist).every(Boolean) ? chalk.green('PASS') : chalk.red('FAIL')}`);
    console.log(`API Methods: ${apiMethodsExist ? chalk.green('PASS') : chalk.red('FAIL')}`);
    console.log(`User Settings Rendering: ${userSettingsRenderingFixed ? chalk.green('PASS') : chalk.red('FAIL')}`);
    console.log(`System Health Monitoring: ${systemHealthMonitoringSetUp ? chalk.green('PASS') : chalk.red('FAIL')}`);
    console.log(`Data Display Monitoring: ${dataDisplayMonitoringSetUp ? chalk.green('PASS') : chalk.red('FAIL')}`);
    
    if (Object.values(tablesExist).every(Boolean) && apiMethodsExist && userSettingsRenderingFixed && systemHealthMonitoringSetUp && dataDisplayMonitoringSetUp) {
      console.log(chalk.bold('\nAll checks passed! The system is ready to use.'));
    } else {
      console.log(chalk.bold('\nSome checks failed. Please fix the issues and run this script again.'));
    }
  } catch (error) {
    logError(`Error running system health monitoring checks: ${error.message}`);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the main function
main();
