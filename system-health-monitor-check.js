/**
 * system-health-monitor-check.js
 * 
 * This script checks if the system health monitor is working correctly.
 */

import fetch from 'node-fetch';

/**
 * Check if the API endpoints are working
 */
async function checkApiEndpoints() {
  console.log('Checking API endpoints...');
  
  const endpoints = [
    { url: '/api/system-health-checks', name: 'System Health Checks' },
    { url: '/api/user-accs', name: 'User Accounts' },
    { url: '/api/settings', name: 'Settings' }
  ];
  
  const baseUrl = process.env.API_URL || 'http://localhost:3000';
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Checking ${endpoint.name} endpoint: ${baseUrl}${endpoint.url}`);
      
      const response = await fetch(`${baseUrl}${endpoint.url}`);
      const data = await response.json();
      
      console.log(`${endpoint.name} endpoint status: ${response.status}`);
      console.log(`${endpoint.name} endpoint data: ${JSON.stringify(data, null, 2)}`);
      
      if (response.ok) {
        console.log(`✅ ${endpoint.name} endpoint is working correctly.`);
      } else {
        console.log(`❌ ${endpoint.name} endpoint returned an error: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Error checking ${endpoint.name} endpoint:`, error);
    }
    
    console.log('---');
  }
}

/**
 * Check if the frontend components are displaying data
 */
async function checkFrontendComponents() {
  console.log('Checking frontend components...');
  
  console.log('To check if the frontend components are displaying data:');
  console.log('1. Open the application in a browser');
  console.log('2. Navigate to the Account Settings page');
  console.log('3. Verify that user account data and settings are displayed');
  console.log('4. Navigate to the System Health Monitor page');
  console.log('5. Verify that system health checks data is displayed');
  
  console.log('If any data is not displayed, check the browser console for errors.');
}

/**
 * Main function
 */
async function main() {
  console.log('Running system health monitor check...');
  
  await checkApiEndpoints();
  await checkFrontendComponents();
  
  console.log('System health monitor check completed.');
}

// Run the main function
main().catch(console.error);
