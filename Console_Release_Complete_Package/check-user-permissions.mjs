/**
 * Script to check user permissions
 * This script tests if a user has the necessary permissions after login
 */

import fetch from 'node-fetch';

// Test credentials
const testCredentials = {
  email: 'admin@americancoveragecenter.com',
  password: 'Agent123!'
};

// Sections to check permissions for
const sectionsToCheck = [
  'dashboard',
  'users',
  'deals',
  'analytics',
  'settings',
  'post-deal',
  'book',
  'account-settings'  // Added account settings section
];

// Actions to check permissions for
const actionsToCheck = [
  'view',
  'create',
  'edit',
  'delete'
];

async function checkUserPermissions() {
  console.log('=== User Permissions Check ===');
  console.log(`Testing permissions for user: ${testCredentials.email}`);
  
  try {
    // Step 1: Login to get the token
    console.log('\nStep 1: Logging in to get token...');
    const loginResponse = await fetch('http://localhost:3000/crm/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCredentials)
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok || !loginData.user || !loginData.user.token) {
      console.error('Login failed or token not received');
      return;
    }
    
    const token = loginData.user.token;
    console.log('Login successful, token received');
    
    // Step 2: Get user profile with the token
    console.log('\nStep 2: Getting user profile...');
    const profileResponse = await fetch('http://localhost:3000/crm/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const profileData = await profileResponse.json();
    
    if (!profileResponse.ok) {
      console.error('Failed to get user profile:', profileData.error || 'Unknown error');
      return;
    }
    
    console.log('User profile retrieved successfully');
    console.log('User role:', profileData.role);
    
    // Step 3: Check permissions for each section and action
    console.log('\nStep 3: Checking permissions for each section and action...');
    
    // Create a table to display permissions
    console.log('\nPermissions Table:');
    console.log('----------------------------------------------------------');
    console.log('| Section    | View    | Create  | Edit    | Delete  |');
    console.log('----------------------------------------------------------');
    
    for (const section of sectionsToCheck) {
      let row = `| ${section.padEnd(10)} |`;
      
      for (const action of actionsToCheck) {
        // Check permission by calling the frontend permission check function
        console.log(`Checking access for section: ${section}, action: ${action}`);
        
        // Simulate the permission check that would happen in the frontend
        const hasPermission = await checkPermission(section, action, token);
        
        // Add to the table row
        row += ` ${hasPermission ? 'Yes'.padEnd(7) : 'No'.padEnd(7)} |`;
      }
      
      console.log(row);
    }
    
    console.log('----------------------------------------------------------');
    
  } catch (error) {
    console.error('Error checking permissions:', error);
  }
}

// Function to check a specific permission
async function checkPermission(section, action, token) {
  try {
    // Special case: All users have access to account-settings
    if (section === 'account-settings') {
      // All users can view and edit their account settings
      if (['view', 'edit'].includes(action)) {
        console.log(`Access for ${section}/${action}: true (universal access)`);
        return true;
      }
      
      // But they cannot create new account settings or delete them
      if (['create', 'delete'].includes(action)) {
        console.log(`Access for ${section}/${action}: false (restricted action)`);
        return false;
      }
    }
    
    // For admin users, we'll assume they have all permissions
    // In a real implementation, this would call an API endpoint to check permissions
    
    // Get the user's role from the /me endpoint
    const profileResponse = await fetch('http://localhost:3000/crm/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!profileResponse.ok) {
      console.log(`Access for ${section}/${action}: false (profile fetch failed)`);
      return false;
    }
    
    const profileData = await profileResponse.json();
    
    // Admin users should have all permissions
    if (profileData.role === 'admin') {
      console.log(`Access for ${section}/${action}: true (admin role)`);
      return true;
    }
    
    // For agent users, they might have limited permissions
    // This is a simplified implementation
    if (profileData.role === 'agent') {
      // Agents can view most sections but not edit/delete certain ones
      if (action === 'view') {
        const hasAccess = !['settings', 'analytics'].includes(section);
        console.log(`Access for ${section}/${action}: ${hasAccess} (agent role)`);
        return hasAccess;
      }
      
      // Agents can create/edit deals and post-deals
      if (['create', 'edit'].includes(action) && ['deals', 'post-deal'].includes(section)) {
        console.log(`Access for ${section}/${action}: true (agent role)`);
        return true;
      }
      
      // Agents cannot delete anything
      if (action === 'delete') {
        console.log(`Access for ${section}/${action}: false (agent role)`);
        return false;
      }
    }
    
    // Default to no permission
    console.log(`Access for ${section}/${action}: false (default)`);
    return false;
  } catch (error) {
    console.error(`Error checking permission for ${section}/${action}:`, error);
    return false;
  }
}

// Run the permissions check
checkUserPermissions()
  .then(() => {
    console.log('\nPermissions check completed');
  })
  .catch(error => {
    console.error('Permissions check failed:', error);
  });
