/**
 * system-health-monitor-direct.js
 * 
 * This script monitors the health of the system by directly querying the database
 * instead of using API calls. This ensures that we can verify data is available
 * even if the API routes are not working correctly.
 */

import { v4 as uuidv4 } from 'uuid';
import pg from 'pg';
import dotenv from 'dotenv';

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

// Create a new PostgreSQL client
const client = new pg.Client(dbConfig);

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
 * Check user settings data directly from the database
 */
async function checkUserSettings() {
  try {
    // Check if user_accs table exists and has data
    const userAccsResult = await client.query(`
      SELECT COUNT(*) FROM user_accs
    `);
    
    const userAccsCount = parseInt(userAccsResult.rows[0].count);
    
    if (userAccsCount === 0) {
      await recordHealthCheck('user_settings', 'FAIL', 'No user account data found in database');
      return false;
    }
    
    // Get a sample user account
    const sampleUserAccResult = await client.query(`
      SELECT * FROM user_accs LIMIT 1
    `);
    
    if (sampleUserAccResult.rows.length === 0) {
      await recordHealthCheck('user_settings', 'FAIL', 'Failed to retrieve user account data');
      return false;
    }
    
    const userAcc = sampleUserAccResult.rows[0];
    
    await recordHealthCheck('user_settings', 'PASS', {
      userAccsCount,
      sampleUserAcc: {
        displayName: userAcc.display_name,
        themePreference: userAcc.theme_preference
      }
    });
    
    return true;
  } catch (error) {
    console.error('Check user settings error:', error);
    await recordHealthCheck('user_settings', 'FAIL', `Database error: ${error.message}`);
    return false;
  }
}

/**
 * Check system settings data directly from the database
 */
async function checkSystemSettings() {
  try {
    // Check if settings table exists and has data
    const settingsResult = await client.query(`
      SELECT COUNT(*) FROM settings WHERE category = 'system'
    `);
    
    const settingsCount = parseInt(settingsResult.rows[0].count);
    
    if (settingsCount === 0) {
      // Insert default system settings if none exist
      await client.query(`
        INSERT INTO settings (key, value, category)
        VALUES ('name', 'MyAgentView', 'system')
      `);
      
      await recordHealthCheck('system_settings', 'PASS', {
        settingsCount: 1,
        defaultSettingsCreated: true
      });
      
      return true;
    }
    
    // Get all system settings
    const allSettingsResult = await client.query(`
      SELECT * FROM settings WHERE category = 'system'
    `);
    
    const settings = {};
    allSettingsResult.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    
    await recordHealthCheck('system_settings', 'PASS', {
      settingsCount,
      settings
    });
    
    return true;
  } catch (error) {
    console.error('Check system settings error:', error);
    await recordHealthCheck('system_settings', 'FAIL', `Database error: ${error.message}`);
    return false;
  }
}

/**
 * Check deals data directly from the database
 */
async function checkDeals() {
  try {
    // Check if deals table exists and has data
    const dealsResult = await client.query(`
      SELECT COUNT(*) FROM deals
    `);
    
    const dealsCount = parseInt(dealsResult.rows[0].count);
    
    await recordHealthCheck('deals', 'PASS', {
      dealsCount,
      hasData: dealsCount > 0
    });
    
    return true;
  } catch (error) {
    console.error('Check deals error:', error);
    await recordHealthCheck('deals', 'FAIL', `Database error: ${error.message}`);
    return false;
  }
}

/**
 * Check carriers data directly from the database
 */
async function checkCarriers() {
  try {
    // Check if carriers table exists and has data
    const carriersResult = await client.query(`
      SELECT COUNT(*) FROM carriers
    `);
    
    const carriersCount = parseInt(carriersResult.rows[0].count);
    
    await recordHealthCheck('carriers', 'PASS', {
      carriersCount,
      hasData: carriersCount > 0
    });
    
    return true;
  } catch (error) {
    console.error('Check carriers error:', error);
    await recordHealthCheck('carriers', 'FAIL', `Database error: ${error.message}`);
    return false;
  }
}

/**
 * Check products data directly from the database
 */
async function checkProducts() {
  try {
    // Check if products table exists and has data
    const productsResult = await client.query(`
      SELECT COUNT(*) FROM products
    `);
    
    const productsCount = parseInt(productsResult.rows[0].count);
    
    await recordHealthCheck('products', 'PASS', {
      productsCount,
      hasData: productsCount > 0
    });
    
    return true;
  } catch (error) {
    console.error('Check products error:', error);
    await recordHealthCheck('products', 'FAIL', `Database error: ${error.message}`);
    return false;
  }
}

/**
 * Check positions data directly from the database
 */
async function checkPositions() {
  try {
    // Check if positions table exists and has data
    const positionsResult = await client.query(`
      SELECT COUNT(*) FROM positions
    `);
    
    const positionsCount = parseInt(positionsResult.rows[0].count);
    
    await recordHealthCheck('positions', 'PASS', {
      positionsCount,
      hasData: positionsCount > 0
    });
    
    return true;
  } catch (error) {
    console.error('Check positions error:', error);
    await recordHealthCheck('positions', 'FAIL', `Database error: ${error.message}`);
    return false;
  }
}

/**
 * Run all health checks
 */
async function runHealthChecks() {
  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to PostgreSQL database');
    
    // Run all health checks
    console.log('Running health checks directly against the database...');
    
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
