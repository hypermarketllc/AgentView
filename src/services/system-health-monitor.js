/**
 * system-health-monitor.js
 * 
 * This file implements a system health monitor that checks the status of various endpoints.
 */

import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import pg from 'pg';

// Create a PostgreSQL client
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Endpoints to monitor
const endpoints = [
  { url: '/api/system-health-checks', category: 'api' },
  { url: '/api/user-accs', category: 'api' },
  { url: '/api/settings', category: 'api' },
  { url: '/api/auth/status', category: 'auth' },
  { url: '/api/dashboard', category: 'dashboard' }
];

/**
 * Check the status of an endpoint
 * @param {string} url - The URL to check
 * @param {string} category - The category of the endpoint
 * @returns {Promise<Object>} - The check result
 */
async function checkEndpoint(url, category) {
  const startTime = Date.now();
  let status = 'error';
  let statusCode = 500;
  
  try {
    const response = await fetch(url);
    statusCode = response.status;
    status = response.ok ? 'ok' : 'error';
  } catch (error) {
    console.error(`Error checking endpoint ${url}:`, error);
  }
  
  const endTime = Date.now();
  const responseTime = endTime - startTime;
  
  return {
    id: uuidv4(),
    endpoint: url,
    category,
    status,
    response_time: responseTime,
    status_code: statusCode,
    created_at: new Date()
  };
}

/**
 * Save a check result to the database
 * @param {Object} result - The check result
 * @returns {Promise<void>}
 */
async function saveCheckResult(result) {
  try {
    const client = await pool.connect();
    
    try {
      await client.query(
        'INSERT INTO system_health_checks (id, endpoint, category, status, response_time, status_code, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [result.id, result.endpoint, result.category, result.status, result.response_time, result.status_code, result.created_at]
      );
      
      console.log(`Check result saved for endpoint ${result.endpoint}`);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error saving check result:', error);
  }
}

/**
 * Run the system health monitor
 * @returns {Promise<void>}
 */
export async function runSystemHealthMonitor() {
  console.log('Running system health monitor...');
  
  for (const endpoint of endpoints) {
    const result = await checkEndpoint(endpoint.url, endpoint.category);
    await saveCheckResult(result);
  }
  
  console.log('System health monitor completed.');
}

// If this file is run directly, run the monitor
if (require.main === module) {
  runSystemHealthMonitor().catch(console.error);
}
