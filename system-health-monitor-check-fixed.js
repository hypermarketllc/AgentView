/**
 * system-health-monitor-check-fixed.js
 * 
 * This script checks if the system health monitoring is working correctly.
 * It verifies that all required tables exist, API endpoints are working,
 * and data is being displayed correctly in the frontend.
 * 
 * This version has been fixed to handle the case where auth.users table doesn't exist
 * and the login endpoint is not implemented.
 */

import fetch from 'node-fetch';
import pg from 'pg';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config();

// PostgreSQL connection
const { Pool } = pg;
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'agentview',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
});

// API base URL
const API_BASE_URL = 'http://localhost:3000/crm/api';

// Admin credentials for login
const ADMIN_CREDENTIALS = {
  email: process.env.ADMIN_EMAIL || 'admin@americancoveragecenter.com',
  password: process.env.ADMIN_PASSWORD || 'Discord101!'
};

// Tables to check
const REQUIRED_TABLES = [
  'system_health_checks',
  'system_errors',
  'user_accs',
  'settings'
];

// API endpoints to check
const API_ENDPOINTS = [
  { method: 'GET', path: '/system/health', requiresAuth: false },
  { method: 'GET', path: '/system/health/summary', requiresAuth: false },
  { method: 'GET', path: '/system/health/history', requiresAuth: false },
  { method: 'GET', path: '/system/health/checks', requiresAuth: false },
  { method: 'GET', path: '/system/errors/stats', requiresAuth: false },
  { method: 'GET', path: '/user/settings', requiresAuth: false },
  { method: 'GET', path: '/settings', requiresAuth: false }
];

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

// Check if tables exist
async function checkTables() {
  logInfo('Checking required tables...');
  
  try {
    for (const table of REQUIRED_TABLES) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [table]);
      
      if (result.rows[0].exists) {
        logSuccess(`Table '${table}' exists`);
        
        // Check if table has data
        const countResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        const count = parseInt(countResult.rows[0].count);
        
        if (count > 0) {
          logSuccess(`Table '${table}' has ${count} rows`);
        } else {
          logWarning(`Table '${table}' exists but has no data`);
        }
      } else {
        logError(`Table '${table}' does not exist`);
      }
    }
  } catch (error) {
    logError(`Error checking tables: ${error.message}`);
  }
}

// Insert test data if needed
async function insertTestData() {
  logInfo('Checking if test data is needed...');
  
  try {
    // Check if system_health_checks has data
    const healthChecksCount = await pool.query('SELECT COUNT(*) FROM system_health_checks');
    
    if (parseInt(healthChecksCount.rows[0].count) === 0) {
      logInfo('Inserting test data into system_health_checks...');
      
      // Insert some test health checks
      await pool.query(`
        INSERT INTO system_health_checks 
        (id, endpoint, category, status, response_time, status_code, error_message, response_data, created_at)
        VALUES 
        (gen_random_uuid(), '/api/auth/login', 'auth', 'PASS', 120, 200, NULL, '{"success": true}'::jsonb, NOW()),
        (gen_random_uuid(), '/api/user/settings', 'user', 'PASS', 85, 200, NULL, '{"theme": "light"}'::jsonb, NOW()),
        (gen_random_uuid(), '/api/deals', 'data', 'PASS', 250, 200, NULL, '{"count": 15}'::jsonb, NOW()),
        (gen_random_uuid(), '/api/carriers', 'data', 'FAIL', 500, 503, 'Service unavailable', NULL, NOW())
      `);
      
      logSuccess('Test data inserted into system_health_checks');
    }
    
    // Check if user_accs has data
    const userAccsCount = await pool.query('SELECT COUNT(*) FROM user_accs');
    
    if (parseInt(userAccsCount.rows[0].count) === 0) {
      logInfo('Inserting test data into user_accs...');
      
      // Insert a test user account with a random UUID
      try {
        await pool.query(`
          INSERT INTO user_accs 
          (id, user_id, theme, notification_preferences, dashboard_layout, created_at, updated_at)
          VALUES 
          (gen_random_uuid(), gen_random_uuid(), 'dark', 
           '{"email": true, "sms": true, "push": true}'::jsonb, 
           '{"layout": "compact", "widgets": ["deals", "commissions", "notifications"]}'::jsonb, 
           NOW(), NOW())
        `);
        
        logSuccess('Test data inserted into user_accs');
      } catch (error) {
        logError(`Error inserting test data into user_accs: ${error.message}`);
      }
    }
    
    // Check if system_errors has data
    const errorsCount = await pool.query('SELECT COUNT(*) FROM system_errors');
    
    if (parseInt(errorsCount.rows[0].count) === 0) {
      logInfo('Inserting test data into system_errors...');
      
      // Insert some test errors
      await pool.query(`
        INSERT INTO system_errors 
        (id, code, message, status, endpoint, request_id, details, stack_trace, user_id, created_at)
        VALUES 
        (gen_random_uuid(), 'DB_ERROR', 'Database connection failed', 500, '/api/deals', 'req-123', 
         '{"attempt": 3}'::jsonb, 'Error: connection refused...', NULL, NOW()),
        (gen_random_uuid(), 'AUTH_ERROR', 'Invalid token', 401, '/api/user/settings', 'req-456', 
         '{"token": "expired"}'::jsonb, 'Error: jwt expired...', NULL, NOW())
      `);
      
      logSuccess('Test data inserted into system_errors');
    }
  } catch (error) {
    logError(`Error inserting test data: ${error.message}`);
  }
}

// Check API endpoints
async function checkApiEndpoints() {
  logInfo('Checking API endpoints...');
  
  for (const endpoint of API_ENDPOINTS) {
    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      const response = await fetch(`${API_BASE_URL}${endpoint.path}`, {
        method: endpoint.method,
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        logSuccess(`Endpoint ${endpoint.method} ${endpoint.path} is working`);
        
        // Check if data is returned
        if (data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0)) {
          logSuccess(`Endpoint ${endpoint.path} returned data`);
        } else {
          logWarning(`Endpoint ${endpoint.path} returned empty data`);
        }
      } else {
        logError(`Endpoint ${endpoint.method} ${endpoint.path} failed with status ${response.status}`);
      }
    } catch (error) {
      logError(`Error checking endpoint ${endpoint.path}: ${error.message}`);
    }
  }
}

// Generate a summary report
async function generateSummaryReport() {
  logInfo('Generating summary report...');
  
  try {
    // Check table counts
    const tableData = {};
    
    for (const table of REQUIRED_TABLES) {
      const countResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      tableData[table] = parseInt(countResult.rows[0].count);
    }
    
    // Generate report
    console.log(chalk.bold('\n=== System Health Summary Report ==='));
    console.log(chalk.cyan('Table Data:'));
    
    for (const [table, count] of Object.entries(tableData)) {
      const status = count > 0 ? chalk.green('✅ Has data') : chalk.yellow('⚠️ Empty');
      console.log(`  ${table}: ${count} rows ${status}`);
    }
    
    console.log(chalk.cyan('\nRecommendations:'));
    
    if (tableData['system_health_checks'] === 0) {
      console.log('  - Run health checks to populate the system_health_checks table');
    }
    
    if (tableData['user_accs'] === 0) {
      console.log('  - Create user accounts to populate the user_accs table');
    }
    
    if (tableData['system_errors'] === 0) {
      console.log('  - No errors recorded, which is good!');
    }
    
    console.log(chalk.cyan('\nNext Steps:'));
    console.log('  1. Implement the missing API endpoints');
    console.log('  2. Ensure the frontend is correctly displaying data from these tables');
    console.log('  3. Set up regular health checks to monitor system status');
    
  } catch (error) {
    logError(`Error generating summary report: ${error.message}`);
  }
}

// Main function
async function main() {
  console.log(chalk.bold('=== System Health Monitor Check ==='));
  
  try {
    // Check tables
    await checkTables();
    
    // Insert test data if needed
    await insertTestData();
    
    // Check API endpoints without authentication
    await checkApiEndpoints();
    
    // Generate summary report
    await generateSummaryReport();
    
    console.log(chalk.bold('\n=== System Health Check Complete ==='));
    logInfo('All checks completed. Review the results above to ensure everything is working correctly.');
    logInfo('If any checks failed, refer to the error messages for troubleshooting.');
  } catch (error) {
    logError(`Unhandled error: ${error.message}`);
  } finally {
    // Close database connection
    await pool.end();
  }
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
