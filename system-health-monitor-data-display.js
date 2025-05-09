/**
 * system-health-monitor-data-display.js
 * 
 * This script monitors the system health by checking if data is being displayed correctly
 * in each section of the application. It checks:
 * 1. If the required tables exist
 * 2. If the API endpoints are working correctly
 * 3. If the data is being displayed in the frontend
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { Pool } from 'pg';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

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

// Helper function to log warning
function logWarning(message) {
  console.log(chalk.yellow('⚠️ ' + message));
}

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Check if a table exists
async function checkTableExists(tableName) {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = $1
      );
    `, [tableName]);
    
    return result.rows[0].exists;
  } catch (error) {
    logError(`Error checking if table ${tableName} exists: ${error.message}`);
    return false;
  }
}

// Check if a table has data
async function checkTableHasData(tableName) {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) FROM ${tableName};
    `);
    
    return parseInt(result.rows[0].count) > 0;
  } catch (error) {
    logError(`Error checking if table ${tableName} has data: ${error.message}`);
    return false;
  }
}

// Check if an API endpoint is working
async function checkApiEndpoint(endpoint, method = 'GET', token = null) {
  try {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000/crm/api';
    const url = `${baseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method,
      headers
    });
    
    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        message: `API endpoint ${endpoint} returned status ${response.status}`
      };
    }
    
    const data = await response.json();
    
    return {
      success: true,
      status: response.status,
      data
    };
  } catch (error) {
    return {
      success: false,
      message: `Error checking API endpoint ${endpoint}: ${error.message}`
    };
  }
}

// Check if a component is rendering data correctly
async function checkComponentDataRendering(componentName) {
  try {
    // This is a placeholder for actual frontend testing
    // In a real implementation, this would use a headless browser like Puppeteer
    // to check if the component is rendering data correctly
    
    logInfo(`Checking if ${componentName} is rendering data correctly...`);
    
    // For now, we'll just check if the component file exists
    const componentPath = path.join('src', 'components', `${componentName}.tsx`);
    
    if (!fs.existsSync(componentPath)) {
      return {
        success: false,
        message: `Component file ${componentPath} does not exist`
      };
    }
    
    // Read the component file and check if it contains data rendering logic
    const componentContent = fs.readFileSync(componentPath, 'utf8');
    
    // Check if the component is using data from the API
    const usesApiData = componentContent.includes('useEffect') && 
                        (componentContent.includes('fetch') || 
                         componentContent.includes('axios') || 
                         componentContent.includes('api.'));
    
    // Check if the component is rendering data
    const rendersData = componentContent.includes('map(') || 
                        componentContent.includes('forEach(') || 
                        componentContent.includes('.map((') || 
                        componentContent.includes('.forEach((');
    
    if (!usesApiData) {
      return {
        success: false,
        message: `Component ${componentName} does not appear to fetch data from the API`
      };
    }
    
    if (!rendersData) {
      return {
        success: false,
        message: `Component ${componentName} does not appear to render data`
      };
    }
    
    return {
      success: true,
      message: `Component ${componentName} appears to be rendering data correctly`
    };
  } catch (error) {
    return {
      success: false,
      message: `Error checking component ${componentName}: ${error.message}`
    };
  }
}

// Add a health check to the system_health_checks table
async function addHealthCheck(endpoint, category, status, responseTime, statusCode) {
  try {
    await pool.query(`
      INSERT INTO system_health_checks 
      (id, endpoint, category, status, response_time, status_code, created_at)
      VALUES 
      (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())
    `, [endpoint, category, status, responseTime, statusCode]);
    
    logSuccess(`Added health check for ${endpoint}`);
  } catch (error) {
    logError(`Error adding health check for ${endpoint}: ${error.message}`);
  }
}

// Check if the system_health_checks table exists, and create it if it doesn't
async function ensureHealthChecksTableExists() {
  try {
    const tableExists = await checkTableExists('system_health_checks');
    
    if (!tableExists) {
      logWarning('system_health_checks table does not exist, creating it...');
      
      await pool.query(`
        CREATE TABLE system_health_checks (
          id UUID PRIMARY KEY,
          endpoint VARCHAR(255) NOT NULL,
          category VARCHAR(50) NOT NULL,
          status VARCHAR(20) NOT NULL,
          response_time INTEGER NOT NULL,
          status_code INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL
        );
      `);
      
      logSuccess('Created system_health_checks table');
    } else {
      logSuccess('system_health_checks table exists');
    }
  } catch (error) {
    logError(`Error ensuring system_health_checks table exists: ${error.message}`);
  }
}

// Check if the user_accs table exists, and create it if it doesn't
async function ensureUserAccsTableExists() {
  try {
    const tableExists = await checkTableExists('user_accs');
    
    if (!tableExists) {
      logWarning('user_accs table does not exist, creating it...');
      
      await pool.query(`
        CREATE TABLE user_accs (
          id UUID PRIMARY KEY,
          user_id UUID NOT NULL,
          theme VARCHAR(50) DEFAULT 'light',
          notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true}'::jsonb,
          dashboard_layout JSONB DEFAULT '{"layout": "default", "widgets": ["deals", "notifications"]}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL
        );
      `);
      
      logSuccess('Created user_accs table');
    } else {
      logSuccess('user_accs table exists');
    }
  } catch (error) {
    logError(`Error ensuring user_accs table exists: ${error.message}`);
  }
}

// Check if the settings table exists, and create it if it doesn't
async function ensureSettingsTableExists() {
  try {
    const tableExists = await checkTableExists('settings');
    
    if (!tableExists) {
      logWarning('settings table does not exist, creating it...');
      
      await pool.query(`
        CREATE TABLE settings (
          id UUID PRIMARY KEY,
          key VARCHAR(255) NOT NULL UNIQUE,
          value JSONB NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL
        );
      `);
      
      logSuccess('Created settings table');
    } else {
      logSuccess('settings table exists');
    }
  } catch (error) {
    logError(`Error ensuring settings table exists: ${error.message}`);
  }
}

// Check if the required tables exist and have data
async function checkRequiredTables() {
  console.log(chalk.bold('\n=== Checking Required Tables ==='));
  
  // Check if the system_health_checks table exists
  await ensureHealthChecksTableExists();
  
  // Check if the user_accs table exists
  await ensureUserAccsTableExists();
  
  // Check if the settings table exists
  await ensureSettingsTableExists();
  
  // Check if the tables have data
  const systemHealthChecksHasData = await checkTableHasData('system_health_checks');
  const userAccsHasData = await checkTableHasData('user_accs');
  const settingsHasData = await checkTableHasData('settings');
  
  if (!systemHealthChecksHasData) {
    logWarning('system_health_checks table has no data');
  } else {
    logSuccess('system_health_checks table has data');
  }
  
  if (!userAccsHasData) {
    logWarning('user_accs table has no data');
  } else {
    logSuccess('user_accs table has data');
  }
  
  if (!settingsHasData) {
    logWarning('settings table has no data');
  } else {
    logSuccess('settings table has data');
  }
}

// Check if the API endpoints are working
async function checkApiEndpoints() {
  console.log(chalk.bold('\n=== Checking API Endpoints ==='));
  
  // Get a token for authenticated endpoints
  let token = null;
  
  try {
    // Try to log in with default admin credentials
    const loginResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3000/crm/api'}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL || 'admin@example.com',
        password: process.env.ADMIN_PASSWORD || 'admin123'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      token = loginData.token;
      logSuccess('Successfully logged in with admin credentials');
    } else {
      logWarning('Could not log in with admin credentials, some checks will be skipped');
    }
  } catch (error) {
    logWarning(`Error logging in: ${error.message}`);
  }
  
  // Check system health endpoints
  const healthEndpoint = await checkApiEndpoint('/system/health');
  if (healthEndpoint.success) {
    logSuccess('GET /system/health endpoint is working');
    await addHealthCheck('/system/health', 'API', 'SUCCESS', 0, healthEndpoint.status);
  } else {
    logError(`GET /system/health endpoint is not working: ${healthEndpoint.message}`);
    await addHealthCheck('/system/health', 'API', 'FAILURE', 0, healthEndpoint.status || 0);
  }
  
  // Check authenticated endpoints if we have a token
  if (token) {
    // Check user settings endpoints
    const userSettingsEndpoint = await checkApiEndpoint('/user/settings', 'GET', token);
    if (userSettingsEndpoint.success) {
      logSuccess('GET /user/settings endpoint is working');
      await addHealthCheck('/user/settings', 'API', 'SUCCESS', 0, userSettingsEndpoint.status);
    } else {
      logError(`GET /user/settings endpoint is not working: ${userSettingsEndpoint.message}`);
      await addHealthCheck('/user/settings', 'API', 'FAILURE', 0, userSettingsEndpoint.status || 0);
    }
    
    // Check system settings endpoints
    const settingsEndpoint = await checkApiEndpoint('/settings', 'GET', token);
    if (settingsEndpoint.success) {
      logSuccess('GET /settings endpoint is working');
      await addHealthCheck('/settings', 'API', 'SUCCESS', 0, settingsEndpoint.status);
    } else {
      logError(`GET /settings endpoint is not working: ${settingsEndpoint.message}`);
      await addHealthCheck('/settings', 'API', 'FAILURE', 0, settingsEndpoint.status || 0);
    }
    
    // Check system health checks endpoints
    const healthChecksEndpoint = await checkApiEndpoint('/system/health/checks', 'GET', token);
    if (healthChecksEndpoint.success) {
      logSuccess('GET /system/health/checks endpoint is working');
      await addHealthCheck('/system/health/checks', 'API', 'SUCCESS', 0, healthChecksEndpoint.status);
    } else {
      logError(`GET /system/health/checks endpoint is not working: ${healthChecksEndpoint.message}`);
      await addHealthCheck('/system/health/checks', 'API', 'FAILURE', 0, healthChecksEndpoint.status || 0);
    }
  }
}

// Check if the components are rendering data correctly
async function checkComponentRendering() {
  console.log(chalk.bold('\n=== Checking Component Rendering ==='));
  
  // Check UserSettings component
  const userSettingsResult = await checkComponentDataRendering('UserSettings');
  if (userSettingsResult.success) {
    logSuccess(userSettingsResult.message);
    await addHealthCheck('UserSettings', 'COMPONENT', 'SUCCESS', 0, 200);
  } else {
    logError(userSettingsResult.message);
    await addHealthCheck('UserSettings', 'COMPONENT', 'FAILURE', 0, 0);
  }
  
  // Check DashboardLayout component
  const dashboardLayoutResult = await checkComponentDataRendering('DashboardLayout');
  if (dashboardLayoutResult.success) {
    logSuccess(dashboardLayoutResult.message);
    await addHealthCheck('DashboardLayout', 'COMPONENT', 'SUCCESS', 0, 200);
  } else {
    logError(dashboardLayoutResult.message);
    await addHealthCheck('DashboardLayout', 'COMPONENT', 'FAILURE', 0, 0);
  }
}

// Main function
async function main() {
  console.log(chalk.bold('=== System Health Monitor - Data Display Check ==='));
  
  try {
    // Check if the required tables exist
    await checkRequiredTables();
    
    // Check if the API endpoints are working
    await checkApiEndpoints();
    
    // Check if the components are rendering data correctly
    await checkComponentRendering();
    
    console.log(chalk.bold('\n=== System Health Check Complete ==='));
    logInfo('Check the system_health_checks table for detailed results');
  } catch (error) {
    logError(`Fatal error: ${error.message}`);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
