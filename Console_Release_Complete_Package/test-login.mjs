/**
 * Test script to verify login functionality
 * This script tests if the login endpoint works with the updated password hash
 */

import fetch from 'node-fetch';

// Test credentials
const testCredentials = {
  email: 'admin@americancoveragecenter.com',
  password: 'Agent123!'
};

async function testLogin() {
  console.log('=== Login Test ===');
  console.log(`Testing login for user: ${testCredentials.email}`);
  
  try {
    // Make a request to the login endpoint
    const response = await fetch('http://localhost:3000/crm/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCredentials)
    });
    
    // Get the response data
    const data = await response.json();
    
    // Log the response status and data
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    // Check if the login was successful
    if (response.ok) {
      console.log('Login successful!');
      
      // If we have a token, verify it
      if (data.user && data.user.token) {
        console.log('Token received:', data.user.token.substring(0, 20) + '...');
      }
    } else {
      console.log('Login failed:', data.error || 'Unknown error');
    }
  } catch (error) {
    console.error('Error testing login:', error);
  }
}

// Run the test
testLogin()
  .then(() => {
    console.log('Test script completed');
  })
  .catch(error => {
    console.error('Test script failed:', error);
  });
