/**
 * system-health-monitor.js
 * 
 * This script monitors the health of the system by checking if data is being
 * properly displayed in each section of the application. It performs API calls
 * to verify data availability and records the results in the system_health_checks table.
 */

import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import pg from 'pg';
import dotenv from 'dotenv';
import SERVER_ENDPOINTS from './server-endpoints.js';

// Load environment variables
dotenv.config({ path: '.env.postgres' });
dotenv.config(); // Also load .env as fallback

// Database connection configuration
const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'postgres',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// API base URL
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/crm/api';

// Create a new PostgreSQL client
const client = new pg.Client(dbConfig);

// Authentication token
let authToken = null;

/**
 * Authenticate with the API to get a token
 */
async function authenticate() {
  try {
    const response = await fetch(`${API_BASE_URL}${SERVER_ENDPOINTS.AUTH.LOGIN}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL || 'admin@example.com',
        password: process.env.ADMIN_PASSWORD || 'admin123'
      })
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    authToken = data.token;
    console.log('Authentication successful');
    return true;
  } catch (error) {
    console.error('Authentication error:', error);
    return false;
  }
}

/**
 * Make an authenticated API request
 */
async function makeApiRequest(endpoint) {
  try {
    if (!authToken) {
      throw new Error('No authentication token available');
    }

    // Use the full URL for the API endpoint
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`Making API request to: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request error for ${endpoint}:`, error);
    return null;
  }
}

/**
 * Record a health check result in the database
 */
async function recordHealthCheck(section, status, details) {
  try {
    const id = uuidv4();
    const testValue = JSON.stringify({
      section,
      status,
      details,
      timestamp: new Date().toISOString()
    });

    await client.query(
      `INSERT INTO system_health_checks (id, test_value, created_at)
       VALUES ($1, $2, NOW())`,
      [id, testValue]
    );

    console.log(`Health check recorded for ${section}: ${status}`);
    return true;
  } catch (error) {
    console.error('Error recording health check:', error);
    return false;
  }
}

/**
 * Check user settings data
 */
async function checkUserSettings() {
  const data = await makeApiRequest(SERVER_ENDPOINTS.USER.SETTINGS);
  
  if (!data) {
    await recordHealthCheck('user_settings', 'FAIL', 'Failed to retrieve user settings data');
    return false;
  }
  
  // Check if user account data is present
  if (!data.user_account) {
    await recordHealthCheck('user_settings', 'FAIL', 'User account data is missing');
    return false;
  }
  
  await recordHealthCheck('user_settings', 'PASS', {
    hasUserAccount: !!data.user_account,
    displayName: data.user_account.display_name || null,
    themePreference: data.user_account.theme_preference || null
  });
  
  return true;
}

/**
 * Check system settings data
 */
async function checkSystemSettings() {
  const data = await makeApiRequest(SERVER_ENDPOINTS.SETTINGS.SYSTEM);
  
  if (!data) {
    await recordHealthCheck('system_settings', 'FAIL', 'Failed to retrieve system settings data');
    return false;
  }
  
  // Check if system name is present
  if (!data.name) {
    await recordHealthCheck('system_settings', 'FAIL', 'System name is missing');
    return false;
  }
  
  await recordHealthCheck('system_settings', 'PASS', {
    name: data.name,
    logoUrl: data.logo_url || null
  });
  
  return true;
}

/**
 * Check deals data
 */
async function checkDeals() {
  const data = await makeApiRequest(SERVER_ENDPOINTS.DATA.DEALS);
  
  if (!data) {
    await recordHealthCheck('deals', 'FAIL', 'Failed to retrieve deals data');
    return false;
  }
  
  await recordHealthCheck('deals', 'PASS', {
    count: data.length,
    hasData: data.length > 0
  });
  
  return true;
}

/**
 * Check carriers data
 */
async function checkCarriers() {
  const data = await makeApiRequest(SERVER_ENDPOINTS.DATA.CARRIERS);
  
  if (!data) {
    await recordHealthCheck('carriers', 'FAIL', 'Failed to retrieve carriers data');
    return false;
  }
  
  await recordHealthCheck('carriers', 'PASS', {
    count: data.length,
    hasData: data.length > 0
  });
  
  return true;
}

/**
 * Check products data
 */
async function checkProducts() {
  const data = await makeApiRequest(SERVER_ENDPOINTS.DATA.PRODUCTS);
  
  if (!data) {
    await recordHealthCheck('products', 'FAIL', 'Failed to retrieve products data');
    return false;
  }
  
  await recordHealthCheck('products', 'PASS', {
    count: data.length,
    hasData: data.length > 0
  });
  
  return true;
}

/**
 * Check positions data
 */
async function checkPositions() {
  const data = await makeApiRequest(SERVER_ENDPOINTS.DATA.POSITIONS);
  
  if (!data) {
    await recordHealthCheck('positions', 'FAIL', 'Failed to retrieve positions data');
    return false;
  }
  
  await recordHealthCheck('positions', 'PASS', {
    count: data.length,
    hasData: data.length > 0
  });
  
  return true;
}

/**
 * Run all health checks
 */
async function runHealthChecks() {
  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to PostgreSQL database');
    
    // Authenticate with the API
    const authenticated = await authenticate();
    if (!authenticated) {
      console.error('Failed to authenticate. Health checks will not be performed.');
      return;
    }
    
    // Run all health checks
    console.log('Running health checks...');
    
    const results = {
      userSettings: await checkUserSettings(),
      systemSettings: await checkSystemSettings(),
      deals: await checkDeals(),
      carriers: await checkCarriers(),
      products: await checkProducts(),
      positions: await checkPositions()
    };
    
    // Record overall system health
    const overallStatus = Object.values(results).every(result => result) ? 'PASS' : 'FAIL';
    await recordHealthCheck('overall_system', overallStatus, results);
    
    console.log('Health checks completed');
    console.log('Results:', results);
    console.log('Overall status:', overallStatus);
    
  } catch (error) {
    console.error('Error running health checks:', error);
  } finally {
    // Close the database connection
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the health checks
runHealthChecks();
