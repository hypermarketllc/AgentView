/**
 * run-fixed-server-with-db.js
 * This script runs the server with all fixes applied, including database connection fix.
 */

// First, fix the database connection
import './fix-database-connection.js';

// Then import the app and start function
import { app, start } from './server-docker-index.js';

// Apply authentication endpoint fixes
import './fix-auth-endpoints.js';

// Apply missing API methods
import './implement-missing-api-methods.js';

console.log('Starting server with all fixes applied...');

// Create a system health monitoring endpoint to check data display
app.get('/api/system-health-monitor/check-data-display', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const results = {};
    
    // Check system_health_checks table
    try {
      const healthChecksResult = await pool.query('SELECT COUNT(*) FROM system_health_checks');
      results.system_health_checks = {
        status: 'ok',
        count: parseInt(healthChecksResult.rows[0].count),
        message: 'Table exists and is accessible'
      };
    } catch (error) {
      results.system_health_checks = {
        status: 'error',
        error: error.message,
        message: 'Error accessing system_health_checks table'
      };
    }
    
    // Check user_accs table
    try {
      const userAccsResult = await pool.query('SELECT COUNT(*) FROM user_accs');
      results.user_accs = {
        status: 'ok',
        count: parseInt(userAccsResult.rows[0].count),
        message: 'Table exists and is accessible'
      };
    } catch (error) {
      results.user_accs = {
        status: 'error',
        error: error.message,
        message: 'Error accessing user_accs table'
      };
    }
    
    // Check settings table
    try {
      const settingsResult = await pool.query('SELECT COUNT(*) FROM settings');
      results.settings = {
        status: 'ok',
        count: parseInt(settingsResult.rows[0].count),
        message: 'Table exists and is accessible'
      };
    } catch (error) {
      results.settings = {
        status: 'error',
        error: error.message,
        message: 'Error accessing settings table'
      };
    }
    
    // Check API endpoints
    results.api_endpoints = {
      auth: {
        login: '/api/auth/login and /crm/api/auth/login',
        register: '/api/auth/register and /crm/api/auth/register',
        me: '/api/auth/me and /crm/api/auth/me'
      },
      system_health_checks: {
        get_all: '/api/system-health-checks and /crm/api/system-health-checks',
        get_one: '/api/system-health-checks/:id and /crm/api/system-health-checks/:id',
        create: '/api/system-health-checks and /crm/api/system-health-checks',
        update: '/api/system-health-checks/:id and /crm/api/system-health-checks/:id',
        delete: '/api/system-health-checks/:id and /crm/api/system-health-checks/:id'
      },
      user_accs: {
        get_all: '/api/user-accs and /crm/api/user-accs',
        get_one: '/api/user-accs/:id and /crm/api/user-accs/:id',
        create: '/api/user-accs and /crm/api/user-accs',
        update: '/api/user-accs/:id and /crm/api/user-accs/:id',
        delete: '/api/user-accs/:id and /crm/api/user-accs/:id'
      },
      settings: {
        get_all: '/api/settings and /crm/api/settings',
        get_one: '/api/settings/:key and /crm/api/settings/:key',
        create: '/api/settings and /crm/api/settings',
        update: '/api/settings/:key and /crm/api/settings/:key',
        delete: '/api/settings/:key and /crm/api/settings/:key'
      }
    };
    
    // Return the results
    res.json({
      timestamp: new Date(),
      status: 'ok',
      message: 'System health monitor check completed',
      results
    });
  } catch (error) {
    console.error('Error in system health monitor check:', error);
    res.status(500).json({
      timestamp: new Date(),
      status: 'error',
      message: 'Error in system health monitor check',
      error: error.message
    });
  }
});

// Start the server
start();

console.log('Server started with all fixes applied:');
console.log('1. Database connection fixed to use correct credentials');
console.log('2. Authentication endpoint fixes applied');
console.log('3. Missing API methods implemented for system_health_checks, user_accs, and settings tables');
console.log('4. System health monitoring endpoint added at /api/system-health-monitor/check-data-display');
console.log('\nYou can check the system health at: http://localhost:3000/api/system-health-monitor/check-data-display');
