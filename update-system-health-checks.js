/**
 * update-system-health-checks.js
 * This script updates the system_health_checks API methods in server-docker-routes.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to server-docker-routes.js
const routesFilePath = path.join(__dirname, 'server-docker-routes.js');

console.log('=== Updating System Health Checks API Methods ===');
console.log('Reading server-docker-routes.js...');

// Check if the routes file exists
if (!fs.existsSync(routesFilePath)) {
  console.error('Routes file not found:', routesFilePath);
  process.exit(1);
}

// Read the routes file
let routesContent = fs.readFileSync(routesFilePath, 'utf8');

// Find the setupSystemHealthChecksRoutes function
const setupSystemHealthChecksFunction = routesContent.match(/function setupSystemHealthChecksRoutes\([^)]*\) {[^]*?}/s);

if (setupSystemHealthChecksFunction) {
  // Replace the function with the updated version
  const updatedFunction = `function setupSystemHealthChecksRoutes(app, pool, authenticateToken) {
  // Get system health checks
  app.get(\`/crm/api\${SERVER_ENDPOINTS.SYSTEM.HEALTH_CHECKS}\`, authenticateToken, async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM system_health_checks ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (error) {
      console.error('Get system health checks error:', error);
      res.status(500).json({ error: 'Failed to get system health checks' });
    }
  });
  
  // Create a new system health check
  app.post(\`/crm/api\${SERVER_ENDPOINTS.SYSTEM.HEALTH_CHECKS}\`, authenticateToken, async (req, res) => {
    try {
      const { component, status, message } = req.body;
      
      // Insert system health check
      const result = await pool.query(
        \`INSERT INTO system_health_checks 
         (component, status, message, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING *\`,
        [component, status, message]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create system health check error:', error);
      res.status(500).json({ error: 'Failed to create system health check' });
    }
  });
  
  // Delete a system health check
  app.delete(\`/crm/api\${SERVER_ENDPOINTS.SYSTEM.HEALTH_CHECKS}/:id\`, authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Delete system health check
      await pool.query('DELETE FROM system_health_checks WHERE id = $1', [id]);
      
      res.status(204).send();
    } catch (error) {
      console.error('Delete system health check error:', error);
      res.status(500).json({ error: 'Failed to delete system health check' });
    }
  });
  
  // Delete all system health checks (for cleanup)
  app.delete(\`/crm/api\${SERVER_ENDPOINTS.SYSTEM.HEALTH_CHECKS}\`, authenticateToken, async (req, res) => {
    try {
      // Delete all health checks
      await pool.query('DELETE FROM system_health_checks');
      
      res.status(204).send();
    } catch (error) {
      console.error('Delete all system health checks error:', error);
      res.status(500).json({ error: 'Failed to delete all system health checks' });
    }
  });
}`;

  // Replace the old function with the updated one
  routesContent = routesContent.replace(setupSystemHealthChecksFunction[0], updatedFunction);
  
  // Write the updated content back to the file
  fs.writeFileSync(routesFilePath, routesContent);
  
  console.log('System health checks API methods updated successfully!');
} else {
  console.error('Could not find setupSystemHealthChecksRoutes function in the routes file.');
}

// Create a script to update the UserSettings component to display user_accs data
const updateUserSettingsPath = path.join(__dirname, 'update-user-settings.js');
const updateUserSettingsContent = `/**
 * update-user-settings.js
 * This script updates the UserSettings component to display user_accs data
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to UserSettings.tsx
const userSettingsPath = path.join(__dirname, 'src', 'components', 'UserSettings.tsx');

console.log('=== Updating UserSettings Component ===');
console.log('Reading UserSettings.tsx...');

// Check if the file exists
if (!fs.existsSync(userSettingsPath)) {
  console.error('UserSettings.tsx not found:', userSettingsPath);
  process.exit(1);
}

// Read the file
let userSettingsContent = fs.readFileSync(userSettingsPath, 'utf8');

// Add imports for useState and useEffect if they don't exist
if (!userSettingsContent.includes('useState')) {
  userSettingsContent = userSettingsContent.replace(
    'import React',
    'import React, { useState, useEffect }'
  );
}

// Add API service import if it doesn't exist
if (!userSettingsContent.includes('apiService')) {
  userSettingsContent = userSettingsContent.replace(
    'import React',
    'import React\\nimport { apiService } from "../services/api-service"'
  );
}

// Find the component function
const componentMatch = userSettingsContent.match(/export default function UserSettings\\([^)]*\\)[^{]*{/);

if (componentMatch) {
  const componentStart = componentMatch[0];
  const componentStartIndex = userSettingsContent.indexOf(componentStart) + componentStart.length;
  
  // Add state variables and useEffect hook
  const stateAndEffectCode = \`
  // State for user account data
  const [userAccount, setUserAccount] = useState(null);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user account and settings data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch user account data
        const userAccsResponse = await apiService.get('/crm/api/user-accs');
        if (userAccsResponse.data && userAccsResponse.data.length > 0) {
          setUserAccount(userAccsResponse.data[0]);
        }
        
        // Fetch settings
        const settingsResponse = await apiService.get('/crm/api/settings');
        setSettings(settingsResponse.data || []);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load account settings. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
\`;
  
  // Insert the state and effect code after the component opening
  userSettingsContent = 
    userSettingsContent.substring(0, componentStartIndex) + 
    stateAndEffectCode + 
    userSettingsContent.substring(componentStartIndex);
  
  // Find the return statement
  const returnMatch = userSettingsContent.match(/return \\([^;]*\\);/s);
  
  if (returnMatch) {
    const returnStatement = returnMatch[0];
    const returnIndex = userSettingsContent.indexOf(returnStatement);
    
    // Replace the return statement with updated JSX
    const updatedReturnStatement = \`return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      
      {loading ? (
        <div className="text-center py-4">Loading account settings...</div>
      ) : error ? (
        <div className="text-red-500 py-4">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">User Account</h2>
            {userAccount ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Account Type</label>
                  <div className="bg-gray-100 p-2 rounded">{userAccount.account_type}</div>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Account Status</label>
                  <div className="bg-gray-100 p-2 rounded">
                    <span className={\`inline-block px-2 py-1 rounded \${
                      userAccount.account_status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }\`}>
                      {userAccount.account_status}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Settings</label>
                  <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
                    {JSON.stringify(userAccount.settings, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">No account data available</div>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">System Settings</h2>
            {settings.length > 0 ? (
              <div className="space-y-4">
                {settings.map(setting => (
                  <div key={setting.key}>
                    <label className="block text-gray-700 font-medium mb-1">{setting.key}</label>
                    <div className="bg-gray-100 p-2 rounded">{setting.value}</div>
                    {setting.description && (
                      <p className="text-sm text-gray-500 mt-1">{setting.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500">No settings available</div>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">System Health</h2>
            <div className="flex justify-center">
              <button 
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                onClick={() => window.location.href = '/crm/system-health'}
              >
                View System Health Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );\`;
    
    // Replace the return statement
    userSettingsContent = 
      userSettingsContent.substring(0, returnIndex) + 
      updatedReturnStatement + 
      userSettingsContent.substring(returnIndex + returnStatement.length);
    
    // Write the updated content back to the file
    fs.writeFileSync(userSettingsPath, userSettingsContent);
    
    console.log('UserSettings component updated successfully!');
  } else {
    console.error('Could not find return statement in UserSettings component.');
  }
} else {
  console.error('Could not find UserSettings component function.');
}

console.log('All updates completed successfully!');
`;

fs.writeFileSync(updateUserSettingsPath, updateUserSettingsContent);
console.log('Script for updating UserSettings component created successfully!');

console.log('All scripts created successfully!');
