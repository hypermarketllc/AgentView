/**
 * Script to test authentication endpoints
 * This script tests various API endpoints to ensure authentication is working correctly
 */

import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Base URL for API requests
const BASE_URL = 'http://localhost:3000';

// Test credentials
const TEST_CREDENTIALS = {
  admin: {
    email: 'admin@americancoveragecenter.com',
    password: 'Agent123!'
  },
  agent: {
    email: 'agent@example.com',
    password: 'Agent123!'
  }
};

// API endpoints to test
const ENDPOINTS = [
  { name: 'Login', path: '/crm/api/auth/login', method: 'POST', auth: false, body: TEST_CREDENTIALS.agent },
  { name: 'User Profile', path: '/crm/api/auth/me', method: 'GET', auth: true },
  { name: 'System Settings', path: '/crm/api/settings/system', method: 'GET', auth: true },
  { name: 'Dashboard Data', path: '/crm/api/dashboard', method: 'GET', auth: true },
  { name: 'Users List', path: '/crm/api/users', method: 'GET', auth: true },
  { name: 'Account Settings', path: '/crm/api/account-settings', method: 'GET', auth: true }
];

// Function to make an API request
async function makeRequest(endpoint, token = null) {
  const options = {
    method: endpoint.method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  // Add authorization header if required
  if (endpoint.auth && token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Add request body if needed
  if (endpoint.method === 'POST' && endpoint.body) {
    options.body = JSON.stringify(endpoint.body);
  }
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint.path}`, options);
    const status = response.status;
    
    let data = null;
    try {
      data = await response.json();
    } catch (error) {
      // Response might not be JSON
      data = { text: await response.text() };
    }
    
    return {
      status,
      data,
      success: response.ok
    };
  } catch (error) {
    return {
      status: 0,
      data: null,
      success: false,
      error: error.message
    };
  }
}

// Function to run all tests
async function runTests() {
  console.log('=== Authentication Endpoints Test ===');
  
  // Step 1: Login to get token
  console.log('\nStep 1: Logging in to get token...');
  const loginEndpoint = ENDPOINTS.find(e => e.name === 'Login');
  const loginResult = await makeRequest(loginEndpoint);
  
  console.log(`Login Status: ${loginResult.status}`);
  console.log(`Login Success: ${loginResult.success}`);
  
  if (!loginResult.success) {
    console.error('Login failed, cannot proceed with authenticated tests');
    console.error('Error:', loginResult.data || loginResult.error);
    return;
  }
  
  // Extract token from login response
  const token = loginResult.data.user?.token;
  
  if (!token) {
    console.error('No token received in login response');
    console.error('Response:', JSON.stringify(loginResult.data, null, 2));
    return;
  }
  
  console.log('Login successful, token received');
  console.log('Token:', token.substring(0, 20) + '...');
  
  // Step 2: Test authenticated endpoints
  console.log('\nStep 2: Testing authenticated endpoints...');
  
  const results = [];
  
  for (const endpoint of ENDPOINTS) {
    // Skip login endpoint as we already tested it
    if (endpoint.name === 'Login') continue;
    
    console.log(`\nTesting endpoint: ${endpoint.name} (${endpoint.method} ${endpoint.path})`);
    const result = await makeRequest(endpoint, token);
    
    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.success}`);
    
    if (result.success) {
      console.log('Response:', JSON.stringify(result.data, null, 2).substring(0, 100) + '...');
    } else {
      console.error('Error:', result.data || result.error);
    }
    
    results.push({
      endpoint: endpoint.name,
      path: endpoint.path,
      method: endpoint.method,
      status: result.status,
      success: result.success
    });
  }
  
  // Step 3: Print summary
  console.log('\nStep 3: Test Summary');
  console.log('----------------------------------------------------------');
  console.log('| Endpoint          | Method | Path                | Status | Result |');
  console.log('----------------------------------------------------------');
  
  for (const result of results) {
    const endpoint = result.endpoint.padEnd(18);
    const method = result.method.padEnd(7);
    const path = result.path.padEnd(20);
    const status = result.status.toString().padEnd(7);
    const success = result.success ? 'SUCCESS' : 'FAILED';
    
    console.log(`| ${endpoint} | ${method} | ${path} | ${status} | ${success} |`);
  }
  
  console.log('----------------------------------------------------------');
  
  // Calculate success rate
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  const successRate = (successCount / totalCount) * 100;
  
  console.log(`\nSuccess Rate: ${successCount}/${totalCount} (${successRate.toFixed(2)}%)`);
  
  if (successRate === 100) {
    console.log('\n✅ All tests passed successfully!');
  } else {
    console.log('\n❌ Some tests failed. Please check the results above.');
  }
}

// Run the tests
runTests()
  .then(() => {
    console.log('\nAuthentication endpoints test completed');
  })
  .catch(error => {
    console.error('Error running tests:', error);
  });
