/**
 * fix-all-api-and-data-display-issues.js
 * This script applies all fixes to resolve API and data display issues:
 * 1. Creates missing tables (system_health_checks, user_accs, settings)
 * 2. Fixes authentication endpoints
 * 3. Implements missing API methods
 * 4. Adds system health monitoring to check data display
 */

import { app, start } from './server-docker-index.js';
import { applyMissingTables } from './apply-missing-tables.js';
import { pool } from './server-docker-db.js';

// Prevent pool from closing after applying tables
const originalPoolEnd = pool.end;
pool.end = () => {
  console.log('Pool end prevented to allow server to continue running.');
  return Promise.resolve();
};

async function applyAllFixes() {
  console.log('Starting comprehensive fix for API and data display issues...');
  
  try {
    // Step 1: Apply missing tables
    console.log('\n=== Step 1: Creating Missing Tables ===');
    await applyMissingTables();
    
    // Step 2: Fix authentication endpoints
    console.log('\n=== Step 2: Fixing Authentication Endpoints ===');
    await import('./fix-auth-endpoints.js');
    console.log('Authentication endpoint fixes applied successfully.');
    
    // Step 3: Implement missing API methods
    console.log('\n=== Step 3: Implementing Missing API Methods ===');
    await import('./implement-missing-api-methods.js');
    console.log('Missing API methods implemented successfully.');
    
    // Step 4: Add system health monitoring
    console.log('\n=== Step 4: Adding System Health Monitoring ===');
    
    // Create a system health monitoring endpoint to check data display
    app.get('/api/system-health-monitor/check-data-display', async (req, res) => {
      try {
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
    
    console.log('System health monitoring endpoint added at /api/system-health-monitor/check-data-display');
    
    // Step 5: Start the server
    console.log('\n=== Step 5: Starting Server with All Fixes ===');
    start();
    
    console.log('\n=== All Fixes Applied Successfully ===');
    console.log('1. Created missing tables: system_health_checks, user_accs, settings');
    console.log('2. Fixed authentication endpoints for both /api and /crm/api paths');
    console.log('3. Implemented missing API methods for all required tables');
    console.log('4. Added system health monitoring to check data display');
    console.log('\nServer is now running with all fixes applied.');
    console.log('You can check the system health at: http://localhost:3000/api/system-health-monitor/check-data-display');
    
  } catch (error) {
    console.error('Error applying fixes:', error);
    process.exit(1);
  }
}

// Run the function if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  applyAllFixes();
}

export { applyAllFixes };
