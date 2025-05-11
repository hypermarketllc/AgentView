/**
 * run-all-fixes.js
 * 
 * This script runs all the fixes to implement missing API methods and update frontend components.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Run a command and return a promise
 * @param {string} command - The command to run
 * @param {string[]} args - The arguments to pass to the command
 * @returns {Promise<void>} - A promise that resolves when the command completes
 */
function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`Running command: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Run all fixes
 */
async function runAllFixes() {
  console.log('Running all fixes...');
  
  try {
    // Step 1: Create missing tables
    console.log('\n=== Step 1: Creating missing tables ===');
    await runCommand('node', ['apply-missing-tables.js']);
    
    // Step 2: Implement missing API methods
    console.log('\n=== Step 2: Implementing missing API methods ===');
    await runCommand('node', ['api-implementation-main.js']);
    
    // Step 3: Update frontend components
    console.log('\n=== Step 3: Updating frontend components ===');
    await runCommand('node', ['update-frontend-components.js']);
    
    // Step 4: Create a system health monitor check script
    console.log('\n=== Step 4: Creating system health monitor check script ===');
    
    const systemHealthMonitorCheck = `/**
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
      console.log(\`Checking \${endpoint.name} endpoint: \${baseUrl}\${endpoint.url}\`);
      
      const response = await fetch(\`\${baseUrl}\${endpoint.url}\`);
      const data = await response.json();
      
      console.log(\`\${endpoint.name} endpoint status: \${response.status}\`);
      console.log(\`\${endpoint.name} endpoint data: \${JSON.stringify(data, null, 2)}\`);
      
      if (response.ok) {
        console.log(\`✅ \${endpoint.name} endpoint is working correctly.\`);
      } else {
        console.log(\`❌ \${endpoint.name} endpoint returned an error: \${response.status}\`);
      }
    } catch (error) {
      console.error(\`❌ Error checking \${endpoint.name} endpoint:\`, error);
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
`;
    
    fs.writeFileSync('system-health-monitor-check.js', systemHealthMonitorCheck);
    console.log('System health monitor check script created.');
    
    // Step 5: Create a documentation file
    console.log('\n=== Step 5: Creating documentation ===');
    
    const documentation = `# System Health Monitoring and API Implementation

## Overview

This documentation provides information about the implementation of missing API methods and system health monitoring features.

## Implemented API Methods

The following API methods have been implemented:

### System Health Checks

- GET /api/system-health-checks - Get all system health checks
- GET /api/system-health-checks/:id - Get a system health check by ID
- POST /api/system-health-checks - Create a system health check
- DELETE /api/system-health-checks/:id - Delete a system health check

### User Accounts

- GET /api/user-accs - Get all user accounts
- GET /api/user-accs/:id - Get a user account by ID
- POST /api/user-accs - Create a user account
- PUT /api/user-accs/:id - Update a user account
- DELETE /api/user-accs/:id - Delete a user account

### Settings

- GET /api/settings - Get all settings
- GET /api/settings/:category - Get settings by category
- GET /api/settings/:category/:key - Get a setting by key
- POST /api/settings - Create a setting
- PUT /api/settings/:id - Update a setting
- DELETE /api/settings/:id - Delete a setting

## Database Tables

The following database tables have been created:

### system_health_checks

This table stores system health check data.

- id (UUID, primary key)
- endpoint (VARCHAR(255), not null)
- category (VARCHAR(50), not null)
- status (VARCHAR(20), not null)
- response_time (INTEGER, not null)
- status_code (INTEGER, not null)
- created_at (TIMESTAMP WITH TIME ZONE, not null)

### user_accs

This table stores user account data.

- id (SERIAL, primary key)
- user_id (UUID, not null)
- display_name (VARCHAR(100))
- theme_preference (JSONB)
- notification_preferences (JSONB)
- created_at (TIMESTAMP WITH TIME ZONE, not null)
- updated_at (TIMESTAMP WITH TIME ZONE, not null)

### settings

This table stores application settings.

- id (SERIAL, primary key)
- key (VARCHAR(100), not null)
- value (JSONB, not null)
- category (VARCHAR(50), not null)
- created_at (TIMESTAMP WITH TIME ZONE, not null)
- updated_at (TIMESTAMP WITH TIME ZONE, not null)
- UNIQUE(category, key)

## Frontend Components

The following frontend components have been updated or created:

### UserSettings

This component displays user account data and settings. It allows users to update their account settings.

### SystemHealthMonitor

This component displays system health check data. It shows the status of various endpoints and provides a summary of the system health.

## System Health Monitoring

The system health monitor checks the status of various endpoints and saves the results to the database. It can be run periodically to monitor the health of the system.

## How to Run

1. Create the missing tables:
   \`\`\`
   node apply-missing-tables.js
   \`\`\`

2. Implement the missing API methods:
   \`\`\`
   node api-implementation-main.js
   \`\`\`

3. Update the frontend components:
   \`\`\`
   node update-frontend-components.js
   \`\`\`

4. Run the system health monitor check:
   \`\`\`
   node system-health-monitor-check.js
   \`\`\`

5. Run all fixes at once:
   \`\`\`
   node run-all-fixes.js
   \`\`\`

## Troubleshooting

If you encounter any issues, check the following:

1. Make sure the database is running and accessible.
2. Check the server logs for any errors.
3. Check the browser console for any frontend errors.
4. Run the system health monitor check to verify that the API endpoints are working.
5. Verify that the frontend components are displaying data correctly.
`;
    
    fs.writeFileSync('SYSTEM_HEALTH_IMPLEMENTATION_SUMMARY.md', documentation);
    console.log('Documentation created.');
    
    console.log('\nAll fixes have been applied successfully.');
    console.log('To check if everything is working correctly, run:');
    console.log('node system-health-monitor-check.js');
  } catch (error) {
    console.error('Error running fixes:', error);
  }
}

// Run the function
runAllFixes();
