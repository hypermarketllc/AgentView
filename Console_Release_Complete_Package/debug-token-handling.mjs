/**
 * Debug script to analyze token handling
 * This script tests the login endpoint and analyzes the response
 */

import fetch from 'node-fetch';

// Test credentials
const testCredentials = {
  email: 'admin@americancoveragecenter.com',
  password: 'Agent123!'
};

async function debugTokenHandling() {
  console.log('=== Token Handling Debug ===');
  console.log(`Testing login for user: ${testCredentials.email}`);
  
  try {
    // Make a request to the login endpoint
    console.log('Making login request to http://localhost:3000/crm/api/auth/login');
    const response = await fetch('http://localhost:3000/crm/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCredentials)
    });
    
    // Get the response data
    const data = await response.json();
    
    // Log the response status
    console.log('Response status:', response.status);
    
    // Check if the login was successful
    if (response.ok) {
      console.log('Login successful!');
      
      // Analyze the response structure
      console.log('\nResponse structure analysis:');
      console.log('- success property:', data.success !== undefined ? 'present' : 'missing');
      
      if (data.user) {
        console.log('- user object:', 'present');
        console.log('  - id:', data.user.id !== undefined ? 'present' : 'missing');
        console.log('  - email:', data.user.email !== undefined ? 'present' : 'missing');
        console.log('  - role:', data.user.role !== undefined ? 'present' : 'missing');
        console.log('  - token:', data.user.token !== undefined ? 'present' : 'missing');
        
        if (data.user.token) {
          console.log('\nToken analysis:');
          console.log('- Token preview:', data.user.token.substring(0, 20) + '...');
          
          // Test the /me endpoint with the token
          console.log('\nTesting /me endpoint with the token...');
          const meResponse = await fetch('http://localhost:3000/crm/api/auth/me', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${data.user.token}`
            }
          });
          
          const meData = await meResponse.json();
          console.log('- /me response status:', meResponse.status);
          console.log('- /me response data:', JSON.stringify(meData, null, 2));
        }
      } else {
        console.log('- user object: missing');
      }
    } else {
      console.log('Login failed:', data.error || 'Unknown error');
    }
    
    // Suggest fixes based on analysis
    console.log('\nPossible issues and fixes:');
    if (!response.ok) {
      console.log('- Login failed. Check credentials and server logs.');
    } else if (!data.user) {
      console.log('- Response is missing user object. Check auth-routes.mjs response structure.');
    } else if (!data.user.token) {
      console.log('- Response is missing token. Check token generation in auth-db.mjs.');
    } else {
      console.log('- Login and token generation appear to be working correctly.');
      console.log('- If frontend still has issues, check how it\'s storing and using the token.');
      console.log('- Ensure frontend is sending the token in the Authorization header as "Bearer <token>".');
    }
    
  } catch (error) {
    console.error('Error during debug:', error);
  }
}

// Run the debug function
debugTokenHandling()
  .then(() => {
    console.log('\nDebug script completed');
  })
  .catch(error => {
    console.error('Debug script failed:', error);
  });
