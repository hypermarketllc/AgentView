/**
 * implement-missing-api-methods.js
 * 
 * This script implements the missing API methods for the system_health_checks,
 * user_accs, and settings tables. It adds the necessary routes to the server
 * to handle DELETE and INSERT operations for these tables.
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

// Helper function to log success
function logSuccess(message) {
  console.log(chalk.green('✅ ' + message));
}

// Helper function to log error
function logError(message) {
  console.error(chalk.red('❌ ' + message));
}

// Helper function to log info
function logInfo(message) {
  console.log(chalk.blue('ℹ️ ' + message));
}

// Helper function to log warning
function logWarning(message) {
  console.log(chalk.yellow('⚠️ ' + message));
}

// Path to the handlers directory
const handlersDir = path.join('src', 'handlers');
const systemStatusHandlersPath = path.join(handlersDir, 'system-status-handlers.js');
const userSettingsHandlersPath = path.join(handlersDir, 'user-settings-handlers.js');
const settingsHandlersPath = path.join(handlersDir, 'settings-handlers.js');

// Path to the API registry file
const apiRegistryPath = path.join('src', 'config', 'api-registry.js');

// Create the user-settings-handlers.js file if it doesn't exist
function createUserSettingsHandlers() {
  logInfo('Creating user settings handlers...');
  
  const userSettingsHandlersContent = `/**
 * User Settings Handlers
 * 
 * This module provides handlers for user settings API endpoints.
 */

import { pool } from '../lib/postgres.js';
import { handleError } from '../lib/error-handler.js';

/**
 * Get user settings for the authenticated user
 */
export async function getUserSettings(req, res) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const result = await pool.query(
      'SELECT * FROM user_accs WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      // Create default settings if none exist
      const defaultSettings = {
        theme: 'light',
        notification_preferences: { email: true, sms: false, push: true },
        dashboard_layout: { layout: 'default', widgets: ['deals', 'notifications'] }
      };
      
      const insertResult = await pool.query(
        \`INSERT INTO user_accs 
         (id, user_id, theme, notification_preferences, dashboard_layout, created_at, updated_at)
         VALUES 
         (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
         RETURNING *\`,
        [userId, defaultSettings.theme, defaultSettings.notification_preferences, defaultSettings.dashboard_layout]
      );
      
      return res.json(insertResult.rows[0]);
    }
    
    return res.json(result.rows[0]);
  } catch (error) {
    return handleError(error, req, res);
  }
}

/**
 * Update user settings for the authenticated user
 */
export async function updateUserSettings(req, res) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { theme, notification_preferences, dashboard_layout } = req.body;
    
    // Check if user settings exist
    const checkResult = await pool.query(
      'SELECT id FROM user_accs WHERE user_id = $1',
      [userId]
    );
    
    if (checkResult.rows.length === 0) {
      // Create new settings
      const insertResult = await pool.query(
        \`INSERT INTO user_accs 
         (id, user_id, theme, notification_preferences, dashboard_layout, created_at, updated_at)
         VALUES 
         (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())
         RETURNING *\`,
        [userId, theme, notification_preferences, dashboard_layout]
      );
      
      return res.json(insertResult.rows[0]);
    } else {
      // Update existing settings
      const updateResult = await pool.query(
        \`UPDATE user_accs 
         SET theme = COALESCE($1, theme),
             notification_preferences = COALESCE($2, notification_preferences),
             dashboard_layout = COALESCE($3, dashboard_layout),
             updated_at = NOW()
         WHERE user_id = $4
         RETURNING *\`,
        [theme, notification_preferences, dashboard_layout, userId]
      );
      
      return res.json(updateResult.rows[0]);
    }
  } catch (error) {
    return handleError(error, req, res);
  }
}

/**
 * Delete user settings for the authenticated user
 */
export async function deleteUserSettings(req, res) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    await pool.query(
      'DELETE FROM user_accs WHERE user_id = $1',
      [userId]
    );
    
    return res.json({ success: true, message: 'User settings deleted successfully' });
  } catch (error) {
    return handleError(error, req, res);
  }
}
`;

  fs.writeFileSync(userSettingsHandlersPath, userSettingsHandlersContent);
  logSuccess('Created user settings handlers');
}

// Create the settings-handlers.js file if it doesn't exist
function createSettingsHandlers() {
  logInfo('Creating settings handlers...');
  
  const settingsHandlersContent = `/**
 * Settings Handlers
 * 
 * This module provides handlers for system settings API endpoints.
 */

import { pool } from '../lib/postgres.js';
import { handleError } from '../lib/error-handler.js';

/**
 * Get all system settings
 */
export async function getSettings(req, res) {
  try {
    // Check if user has admin permissions
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin permissions required' });
    }
    
    const result = await pool.query('SELECT * FROM settings');
    return res.json(result.rows);
  } catch (error) {
    return handleError(error, req, res);
  }
}

/**
 * Get a specific system setting by key
 */
export async function getSettingByKey(req, res) {
  try {
    const { key } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM settings WHERE key = $1',
      [key]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    return res.json(result.rows[0]);
  } catch (error) {
    return handleError(error, req, res);
  }
}

/**
 * Update a system setting
 */
export async function updateSetting(req, res) {
  try {
    // Check if user has admin permissions
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin permissions required' });
    }
    
    const { key } = req.params;
    const { value, description } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }
    
    // Check if setting exists
    const checkResult = await pool.query(
      'SELECT * FROM settings WHERE key = $1',
      [key]
    );
    
    if (checkResult.rows.length === 0) {
      // Create new setting
      const insertResult = await pool.query(
        \`INSERT INTO settings 
         (id, key, value, description, created_at, updated_at)
         VALUES 
         (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
         RETURNING *\`,
        [key, value, description]
      );
      
      return res.json(insertResult.rows[0]);
    } else {
      // Update existing setting
      const updateResult = await pool.query(
        \`UPDATE settings 
         SET value = $1,
             description = COALESCE($2, description),
             updated_at = NOW()
         WHERE key = $3
         RETURNING *\`,
        [value, description, key]
      );
      
      return res.json(updateResult.rows[0]);
    }
  } catch (error) {
    return handleError(error, req, res);
  }
}

/**
 * Create a new system setting
 */
export async function createSetting(req, res) {
  try {
    // Check if user has admin permissions
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin permissions required' });
    }
    
    const { key, value, description } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Key and value are required' });
    }
    
    // Check if setting already exists
    const checkResult = await pool.query(
      'SELECT * FROM settings WHERE key = $1',
      [key]
    );
    
    if (checkResult.rows.length > 0) {
      return res.status(409).json({ error: 'Setting already exists' });
    }
    
    // Create new setting
    const insertResult = await pool.query(
      \`INSERT INTO settings 
       (id, key, value, description, created_at, updated_at)
       VALUES 
       (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
       RETURNING *\`,
      [key, value, description]
    );
    
    return res.status(201).json(insertResult.rows[0]);
  } catch (error) {
    return handleError(error, req, res);
  }
}

/**
 * Delete a system setting
 */
export async function deleteSetting(req, res) {
  try {
    // Check if user has admin permissions
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin permissions required' });
    }
    
    const { key } = req.params;
    
    const result = await pool.query(
      'DELETE FROM settings WHERE key = $1 RETURNING *',
      [key]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    return res.json({ success: true, message: 'Setting deleted successfully' });
  } catch (error) {
    return handleError(error, req, res);
  }
}
`;

  fs.writeFileSync(settingsHandlersPath, settingsHandlersContent);
  logSuccess('Created settings handlers');
}

// Update the system-status-handlers.js file to add missing methods
function updateSystemStatusHandlers() {
  logInfo('Updating system status handlers...');
  
  try {
    // Check if the file exists
    if (!fs.existsSync(systemStatusHandlersPath)) {
      logError(`File not found: ${systemStatusHandlersPath}`);
      return false;
    }
    
    // Read the current content
    const currentContent = fs.readFileSync(systemStatusHandlersPath, 'utf8');
    
    // Check if the methods already exist
    if (currentContent.includes('createHealthCheck') && currentContent.includes('deleteHealthCheck')) {
      logWarning('Methods already exist in system-status-handlers.js');
      return true;
    }
    
    // Add the missing methods
    const updatedContent = currentContent + `
/**
 * Create a new health check
 */
export async function createHealthCheck(req, res) {
  try {
    const { endpoint, category } = req.body;
    
    if (!endpoint || !category) {
      return res.status(400).json({ error: 'Endpoint and category are required' });
    }
    
    // Insert the health check
    const result = await pool.query(
      \`INSERT INTO system_health_checks 
       (id, endpoint, category, status, response_time, status_code, created_at)
       VALUES 
       (gen_random_uuid(), $1, $2, 'PENDING', 0, 0, NOW())
       RETURNING *\`,
      [endpoint, category]
    );
    
    // Run the health check immediately
    const healthMonitorService = req.app.get('healthMonitorService');
    if (healthMonitorService) {
      await healthMonitorService.runCheck(result.rows[0]);
    }
    
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return handleError(error, req, res);
  }
}

/**
 * Delete a health check by ID
 */
export async function deleteHealthCheck(req, res) {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM system_health_checks WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Health check not found' });
    }
    
    return res.json({ success: true, message: 'Health check deleted successfully' });
  } catch (error) {
    return handleError(error, req, res);
  }
}

/**
 * Delete all health checks
 */
export async function deleteAllHealthChecks(req, res) {
  try {
    // Check if user has admin permissions
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin permissions required' });
    }
    
    await pool.query('DELETE FROM system_health_checks');
    
    return res.json({ success: true, message: 'All health checks deleted successfully' });
  } catch (error) {
    return handleError(error, req, res);
  }
}
`;
    
    fs.writeFileSync(systemStatusHandlersPath, updatedContent);
    logSuccess('Updated system status handlers');
    return true;
  } catch (error) {
    logError(`Error updating system status handlers: ${error.message}`);
    return false;
  }
}

// Update the API registry to add the new routes
function updateApiRegistry() {
  logInfo('Updating API registry...');
  
  try {
    // Check if the file exists
    if (!fs.existsSync(apiRegistryPath)) {
      logError(`File not found: ${apiRegistryPath}`);
      return false;
    }
    
    // Read the current content
    const currentContent = fs.readFileSync(apiRegistryPath, 'utf8');
    
    // Check if the routes already exist
    if (
      currentContent.includes('POST /system/health/checks') && 
      currentContent.includes('DELETE /system/health/checks/:id') &&
      currentContent.includes('GET /user/settings') &&
      currentContent.includes('PUT /user/settings') &&
      currentContent.includes('GET /settings')
    ) {
      logWarning('Routes already exist in API registry');
      return true;
    }
    
    // Find the import section
    let updatedContent = currentContent;
    
    // Add imports for the new handlers if they don't exist
    if (!updatedContent.includes('user-settings-handlers')) {
      updatedContent = updatedContent.replace(
        "import {",
        "import { getUserSettings, updateUserSettings, deleteUserSettings } from '../handlers/user-settings-handlers.js';\nimport {"
      );
    }
    
    if (!updatedContent.includes('settings-handlers')) {
      updatedContent = updatedContent.replace(
        "import {",
        "import { getSettings, getSettingByKey, updateSetting, createSetting, deleteSetting } from '../handlers/settings-handlers.js';\nimport {"
      );
    }
    
    // Add the createHealthCheck and deleteHealthCheck imports if they don't exist
    if (!updatedContent.includes('createHealthCheck')) {
      updatedContent = updatedContent.replace(
        /import {([^}]+)} from '\.\.\/handlers\/system-status-handlers\.js';/,
        "import { $1, createHealthCheck, deleteHealthCheck, deleteAllHealthChecks } from '../handlers/system-status-handlers.js';"
      );
    }
    
    // Find the routes array
    const routesMatch = updatedContent.match(/const routes\s*=\s*\[([\s\S]*?)\];/);
    
    if (!routesMatch) {
      logError('Could not find routes array in API registry');
      return false;
    }
    
    // Add the new routes
    const newRoutes = `
  // System health checks routes
  { method: 'POST', path: '/system/health/checks', handler: createHealthCheck, auth: true },
  { method: 'DELETE', path: '/system/health/checks/:id', handler: deleteHealthCheck, auth: true },
  { method: 'DELETE', path: '/system/health/checks/all', handler: deleteAllHealthChecks, auth: true },
  
  // User settings routes
  { method: 'GET', path: '/user/settings', handler: getUserSettings, auth: true },
  { method: 'PUT', path: '/user/settings', handler: updateUserSettings, auth: true },
  { method: 'DELETE', path: '/user/settings', handler: deleteUserSettings, auth: true },
  
  // System settings routes
  { method: 'GET', path: '/settings', handler: getSettings, auth: true },
  { method: 'GET', path: '/settings/:key', handler: getSettingByKey, auth: false },
  { method: 'PUT', path: '/settings/:key', handler: updateSetting, auth: true },
  { method: 'POST', path: '/settings', handler: createSetting, auth: true },
  { method: 'DELETE', path: '/settings/:key', handler: deleteSetting, auth: true },`;
    
    // Insert the new routes at the beginning of the routes array
    updatedContent = updatedContent.replace(
      /const routes\s*=\s*\[/,
      `const routes = [${newRoutes}`
    );
    
    fs.writeFileSync(apiRegistryPath, updatedContent);
    logSuccess('Updated API registry');
    return true;
  } catch (error) {
    logError(`Error updating API registry: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log(chalk.bold('=== Implementing Missing API Methods ==='));
  
  // Create the handlers directory if it doesn't exist
  if (!fs.existsSync(handlersDir)) {
    fs.mkdirSync(handlersDir, { recursive: true });
    logSuccess(`Created directory: ${handlersDir}`);
  }
  
  // Create the user settings handlers
  createUserSettingsHandlers();
  
  // Create the settings handlers
  createSettingsHandlers();
  
  // Update the system status handlers
  updateSystemStatusHandlers();
  
  // Update the API registry
  updateApiRegistry();
  
  console.log(chalk.bold('\n=== Implementation Complete ==='));
  logInfo('The missing API methods have been implemented.');
  logInfo('To apply these changes, restart the server.');
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
