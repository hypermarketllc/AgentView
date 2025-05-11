/**
 * system-health-monitor-check-data-display.js
 * This script checks if data is being displayed correctly in each section
 */

import pg from 'pg';
import dotenv from 'dotenv';
import chalk from 'chalk';
import fetch from 'node-fetch';

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

console.log(chalk.bold('=== System Health Monitor: Data Display Check ==='));

// PostgreSQL connection
const { Pool } = pg;
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'agentview',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

// Base URL for API requests
const API_BASE_URL = 'http://localhost:3000/crm/api';

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

// Function to check if data is being displayed correctly in each section
async function checkDataDisplay() {
  try {
    // Connect to the database
    await pool.connect();
    
    // Check if the tables exist
    const systemHealthChecksExists = await tableExists('system_health_checks');
    const userAccsExists = await tableExists('user_accs');
    const settingsExists = await tableExists('settings');
    
    if (!systemHealthChecksExists) {
      logError('system_health_checks table does not exist');
      return false;
    }
    
    if (!userAccsExists) {
      logError('user_accs table does not exist');
      return false;
    }
    
    if (!settingsExists) {
      logError('settings table does not exist');
      return false;
    }
    
    // Check if data is being displayed correctly in each section
    logInfo('Checking if data is being displayed correctly in each section...');
    
    // Check UserSettings section
    logInfo('Checking UserSettings section...');
    try {
      const userSettingsResponse = await fetch(`${API_BASE_URL}/user/settings`);
      const userSettingsData = await userSettingsResponse.json();
      
      if (userSettingsResponse.ok && userSettingsData && Array.isArray(userSettingsData)) {
        logSuccess('UserSettings data is being displayed correctly');
        
        // Update system health check for UserSettings
        await pool.query(`
          INSERT INTO system_health_checks (id, component, status, message, endpoint, category, created_at)
          VALUES (uuid_generate_v4(), 'UserSettings', 'PASS', 'UserSettings data is being displayed correctly', '/crm/api/user/settings', 'System', NOW())
          ON CONFLICT (component) DO UPDATE
          SET status = 'PASS',
              message = 'UserSettings data is being displayed correctly',
              created_at = NOW()
        `);
      } else {
        logError('UserSettings data is not being displayed correctly');
        
        // Update system health check for UserSettings
        await pool.query(`
          INSERT INTO system_health_checks (id, component, status, message, endpoint, category, created_at)
          VALUES (uuid_generate_v4(), 'UserSettings', 'FAIL', 'UserSettings data is not being displayed correctly', '/crm/api/user/settings', 'System', NOW())
          ON CONFLICT (component) DO UPDATE
          SET status = 'FAIL',
              message = 'UserSettings data is not being displayed correctly',
              created_at = NOW()
        `);
      }
    } catch (error) {
      logError(`Error checking UserSettings section: ${error.message}`);
      
      // Update system health check for UserSettings
      await pool.query(`
        INSERT INTO system_health_checks (id, component, status, message, endpoint, category, created_at)
        VALUES (uuid_generate_v4(), 'UserSettings', 'FAIL', $1, '/crm/api/user/settings', 'System', NOW())
        ON CONFLICT (component) DO UPDATE
        SET status = 'FAIL',
            message = $1,
            created_at = NOW()
      `, [`Error checking UserSettings section: ${error.message}`]);
    }
    
    // Check SystemMonitoring section
    logInfo('Checking SystemMonitoring section...');
    try {
      const systemMonitoringResponse = await fetch(`${API_BASE_URL}/system/health-checks`);
      const systemMonitoringData = await systemMonitoringResponse.json();
      
      if (systemMonitoringResponse.ok && systemMonitoringData && Array.isArray(systemMonitoringData)) {
        logSuccess('SystemMonitoring data is being displayed correctly');
        
        // Update system health check for SystemMonitoring
        await pool.query(`
          INSERT INTO system_health_checks (id, component, status, message, endpoint, category, created_at)
          VALUES (uuid_generate_v4(), 'SystemMonitoring', 'PASS', 'SystemMonitoring data is being displayed correctly', '/crm/api/system/health-checks', 'System', NOW())
          ON CONFLICT (component) DO UPDATE
          SET status = 'PASS',
              message = 'SystemMonitoring data is being displayed correctly',
              created_at = NOW()
        `);
      } else {
        logError('SystemMonitoring data is not being displayed correctly');
        
        // Update system health check for SystemMonitoring
        await pool.query(`
          INSERT INTO system_health_checks (id, component, status, message, endpoint, category, created_at)
          VALUES (uuid_generate_v4(), 'SystemMonitoring', 'FAIL', 'SystemMonitoring data is not being displayed correctly', '/crm/api/system/health-checks', 'System', NOW())
          ON CONFLICT (component) DO UPDATE
          SET status = 'FAIL',
              message = 'SystemMonitoring data is not being displayed correctly',
              created_at = NOW()
        `);
      }
    } catch (error) {
      logError(`Error checking SystemMonitoring section: ${error.message}`);
      
      // Update system health check for SystemMonitoring
      await pool.query(`
        INSERT INTO system_health_checks (id, component, status, message, endpoint, category, created_at)
        VALUES (uuid_generate_v4(), 'SystemMonitoring', 'FAIL', $1, '/crm/api/system/health-checks', 'System', NOW())
        ON CONFLICT (component) DO UPDATE
        SET status = 'FAIL',
            message = $1,
            created_at = NOW()
      `, [`Error checking SystemMonitoring section: ${error.message}`]);
    }
    
    // Check UserAccounts section
    logInfo('Checking UserAccounts section...');
    try {
      const userAccountsResponse = await fetch(`${API_BASE_URL}/user/accs`);
      const userAccountsData = await userAccountsResponse.json();
      
      if (userAccountsResponse.ok && userAccountsData && Array.isArray(userAccountsData)) {
        logSuccess('UserAccounts data is being displayed correctly');
        
        // Update system health check for UserAccounts
        await pool.query(`
          INSERT INTO system_health_checks (id, component, status, message, endpoint, category, created_at)
          VALUES (uuid_generate_v4(), 'UserAccounts', 'PASS', 'UserAccounts data is being displayed correctly', '/crm/api/user/accs', 'System', NOW())
          ON CONFLICT (component) DO UPDATE
          SET status = 'PASS',
              message = 'UserAccounts data is being displayed correctly',
              created_at = NOW()
        `);
      } else {
        logError('UserAccounts data is not being displayed correctly');
        
        // Update system health check for UserAccounts
        await pool.query(`
          INSERT INTO system_health_checks (id, component, status, message, endpoint, category, created_at)
          VALUES (uuid_generate_v4(), 'UserAccounts', 'FAIL', 'UserAccounts data is not being displayed correctly', '/crm/api/user/accs', 'System', NOW())
          ON CONFLICT (component) DO UPDATE
          SET status = 'FAIL',
              message = 'UserAccounts data is not being displayed correctly',
              created_at = NOW()
        `);
      }
    } catch (error) {
      logError(`Error checking UserAccounts section: ${error.message}`);
      
      // Update system health check for UserAccounts
      await pool.query(`
        INSERT INTO system_health_checks (id, component, status, message, endpoint, category, created_at)
        VALUES (uuid_generate_v4(), 'UserAccounts', 'FAIL', $1, '/crm/api/user/accs', 'System', NOW())
        ON CONFLICT (component) DO UPDATE
        SET status = 'FAIL',
            message = $1,
            created_at = NOW()
      `, [`Error checking UserAccounts section: ${error.message}`]);
    }
    
    // Check Settings section
    logInfo('Checking Settings section...');
    try {
      const settingsResponse = await fetch(`${API_BASE_URL}/settings`);
      const settingsData = await settingsResponse.json();
      
      if (settingsResponse.ok && settingsData && Array.isArray(settingsData)) {
        logSuccess('Settings data is being displayed correctly');
        
        // Update system health check for Settings
        await pool.query(`
          INSERT INTO system_health_checks (id, component, status, message, endpoint, category, created_at)
          VALUES (uuid_generate_v4(), 'Settings', 'PASS', 'Settings data is being displayed correctly', '/crm/api/settings', 'System', NOW())
          ON CONFLICT (component) DO UPDATE
          SET status = 'PASS',
              message = 'Settings data is being displayed correctly',
              created_at = NOW()
        `);
      } else {
        logError('Settings data is not being displayed correctly');
        
        // Update system health check for Settings
        await pool.query(`
          INSERT INTO system_health_checks (id, component, status, message, endpoint, category, created_at)
          VALUES (uuid_generate_v4(), 'Settings', 'FAIL', 'Settings data is not being displayed correctly', '/crm/api/settings', 'System', NOW())
          ON CONFLICT (component) DO UPDATE
          SET status = 'FAIL',
              message = 'Settings data is not being displayed correctly',
              created_at = NOW()
        `);
      }
    } catch (error) {
      logError(`Error checking Settings section: ${error.message}`);
      
      // Update system health check for Settings
      await pool.query(`
        INSERT INTO system_health_checks (id, component, status, message, endpoint, category, created_at)
        VALUES (uuid_generate_v4(), 'Settings', 'FAIL', $1, '/crm/api/settings', 'System', NOW())
        ON CONFLICT (component) DO UPDATE
        SET status = 'FAIL',
            message = $1,
            created_at = NOW()
      `, [`Error checking Settings section: ${error.message}`]);
    }
    
    return true;
  } catch (error) {
    logError(`Error checking data display: ${error.message}`);
    return false;
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Main function
async function main() {
  try {
    // Check if data is being displayed correctly in each section
    const success = await checkDataDisplay();
    
    // Print summary
    console.log(chalk.bold('\n=== System Health Monitor: Data Display Check Summary ==='));
    console.log(`Check: ${success ? chalk.green('SUCCESS') : chalk.red('FAILED')}`);
    
    if (success) {
      console.log(chalk.bold('\nSystem health monitor has checked if data is being displayed correctly in each section.'));
      console.log('The results have been recorded in the system_health_checks table.');
    } else {
      console.log(chalk.bold('\nFailed to check if data is being displayed correctly in each section. Please check the logs for details.'));
    }
  } catch (error) {
    logError(`Error in main function: ${error.message}`);
  }
}

// Run the main function
main();
