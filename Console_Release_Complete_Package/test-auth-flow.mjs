/**
 * Test script for authentication flow
 * This script tests the login process and token handling
 */

import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const API_BASE_URL = 'http://localhost:3000/crm/api';
const AUTH_ENDPOINT = `${API_BASE_URL}/auth`;
const TEST_USER = {
  email: 'agent@example.com',
  password: 'Agent123!'
};

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Log a message with color
 * @param {string} message - Message to log
 * @param {string} color - Color to use
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Log a section header
 * @param {string} title - Section title
 */
function logSection(title) {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log('='.repeat(80));
}

/**
 * Log a success message
 * @param {string} message - Success message
 */
function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

/**
 * Log an error message
 * @param {string} message - Error message
 */
function logError(message) {
  log(`❌ ${message}`, colors.red);
}

/**
 * Log a warning message
 * @param {string} message - Warning message
 */
function logWarning(message) {
  log(`⚠️ ${message}`, colors.yellow);
}

/**
 * Log an info message
 * @param {string} message - Info message
 */
function logInfo(message) {
  log(`ℹ️ ${message}`, colors.blue);
}

/**
 * Make an API request
 * @param {string} endpoint - API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Response data
 */
async function makeRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${AUTH_ENDPOINT}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

/**
 * Test login functionality
 * @returns {Promise<Object|null>} Token if login successful, null otherwise
 */
async function testLogin() {
  logSection('Testing Login');
  
  logInfo(`Attempting to login with user: ${TEST_USER.email}`);
  
  const response = await makeRequest('/login', {
    method: 'POST',
    body: JSON.stringify(TEST_USER)
  });
  
  if (!response.ok) {
    logError(`Login failed with status ${response.status}`);
    console.error(response.data);
    return null;
  }
  
  logSuccess('Login successful');
  console.log('Response data:', JSON.stringify(response.data, null, 2));
  
  // Check for token in different locations
  let token = null;
  
  if (response.data.token) {
    token = response.data.token;
    logSuccess('Token found at response.data.token');
  } else if (response.data.user && response.data.user.token) {
    token = response.data.user.token;
    logSuccess('Token found at response.data.user.token');
  } else {
    logError('No token found in response');
    return null;
  }
  
  logInfo(`Token: ${token.substring(0, 20)}...`);
  return token;
}

/**
 * Test token verification
 * @param {string} token - JWT token
 * @returns {Promise<boolean>} True if token is valid
 */
async function testTokenVerification(token) {
  logSection('Testing Token Verification');
  
  if (!token) {
    logError('No token provided for verification');
    return false;
  }
  
  const response = await makeRequest('/verify-token', {
    method: 'POST',
    body: JSON.stringify({ token })
  });
  
  if (!response.ok) {
    logError(`Token verification failed with status ${response.status}`);
    console.error(response.data);
    return false;
  }
  
  logSuccess('Token verification successful');
  console.log('Decoded token:', JSON.stringify(response.data, null, 2));
  return true;
}

/**
 * Test authenticated endpoint
 * @param {string} token - JWT token
 * @returns {Promise<boolean>} True if request is successful
 */
async function testAuthenticatedEndpoint(token) {
  logSection('Testing Authenticated Endpoint');
  
  if (!token) {
    logError('No token provided for authenticated request');
    return false;
  }
  
  const response = await makeRequest('/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    logError(`Authenticated request failed with status ${response.status}`);
    console.error(response.data);
    return false;
  }
  
  logSuccess('Authenticated request successful');
  console.log('User data:', JSON.stringify(response.data, null, 2));
  return true;
}

/**
 * Test debug token endpoint
 * @param {string} token - JWT token
 * @returns {Promise<boolean>} True if request is successful
 */
async function testDebugToken(token) {
  logSection('Testing Debug Token Endpoint');
  
  const response = await makeRequest('/debug-token', {
    method: 'GET',
    headers: token ? {
      'Authorization': `Bearer ${token}`
    } : {}
  });
  
  if (!response.ok) {
    logError(`Debug token request failed with status ${response.status}`);
    console.error(response.data);
    return false;
  }
  
  logSuccess('Debug token request successful');
  console.log('Debug info:', JSON.stringify(response.data, null, 2));
  return true;
}

/**
 * Main function to run all tests
 */
async function runTests() {
  logSection('Starting Authentication Flow Tests');
  
  try {
    // Test login
    const token = await testLogin();
    
    if (!token) {
      logError('Login test failed, cannot proceed with other tests');
      process.exit(1);
    }
    
    // Test token verification
    const isTokenValid = await testTokenVerification(token);
    
    if (!isTokenValid) {
      logWarning('Token verification test failed, but continuing with other tests');
    }
    
    // Test debug token endpoint without token
    await testDebugToken();
    
    // Test debug token endpoint with token
    await testDebugToken(token);
    
    // Test authenticated endpoint
    const isAuthEndpointWorking = await testAuthenticatedEndpoint(token);
    
    if (!isAuthEndpointWorking) {
      logError('Authenticated endpoint test failed');
    }
    
    // Final summary
    logSection('Test Summary');
    
    if (token && isTokenValid && isAuthEndpointWorking) {
      logSuccess('All tests passed successfully');
    } else {
      logWarning('Some tests failed, check the logs for details');
    }
  } catch (error) {
    logError(`Unhandled error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the tests
runTests();
