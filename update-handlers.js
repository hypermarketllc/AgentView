/**
 * update-handlers.js
 * 
 * This script updates the handlers/index.js file to add the missing handlers
 * for the new endpoints added to the API registry.
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

// Path to the handlers/index.js file
const handlersIndexPath = path.join('src', 'handlers', 'index.js');

// Update the handlers/index.js file to add the missing handlers
function updateHandlersIndex() {
  logInfo('Updating handlers/index.js...');
  
  try {
    // Check if the file exists
    if (!fs.existsSync(handlersIndexPath)) {
      logError(`File not found: ${handlersIndexPath}`);
      return false;
    }
    
    // Read the current content
    const currentContent = fs.readFileSync(handlersIndexPath, 'utf8');
    
    // Check if the handlers are already defined
    if (currentContent.includes('handleDeleteUserSettings') && 
        currentContent.includes('handleGetSettingByKey') && 
        currentContent.includes('handleCreateSetting') && 
        currentContent.includes('handleDeleteSetting')) {
      logWarning('Handlers already defined in handlers/index.js');
      return true;
    }
    
    // Add the missing handlers to the import section
    let updatedContent = currentContent;
    
    // Update the import section
    updatedContent = updatedContent.replace(
      /import \{([^}]+)\} from '\.\.\/handlers\/system-status-handlers\.js';/,
      `import {
  handleGetHealth,
  handleGetHealthSummary,
  handleGetHealthHistory,
  handleRunHealthChecks,
  handleGetErrorStats,
  handleGetErrorDetails,
  handleGetHealthChecks,
  handleCreateHealthCheck,
  handleDeleteHealthCheck,
  handleDeleteAllHealthChecks,
  handleGetUserSettings,
  handleUpdateUserSettings,
  handleDeleteUserSettings,
  handleGetSystemSettings,
  handleUpdateSystemSettings,
  handleGetSettingByKey,
  handleCreateSetting,
  handleDeleteSetting
} from './system-status-handlers.js';`
    );
    
    // Update the export section
    updatedContent = updatedContent.replace(
      /export \{([^}]+)\};/,
      `export {
  // System status handlers
  handleGetHealth,
  handleGetHealthSummary,
  handleGetHealthHistory,
  handleRunHealthChecks,
  handleGetErrorStats,
  handleGetErrorDetails,
  handleGetHealthChecks,
  handleCreateHealthCheck,
  handleDeleteHealthCheck,
  handleDeleteAllHealthChecks,
  
  // User settings handlers
  handleGetUserSettings,
  handleUpdateUserSettings,
  handleDeleteUserSettings,
  
  // System settings handlers
  handleGetSystemSettings,
  handleUpdateSystemSettings,
  handleGetSettingByKey,
  handleCreateSetting,
  handleDeleteSetting
};`
    );
    
    fs.writeFileSync(handlersIndexPath, updatedContent);
    logSuccess('Updated handlers/index.js');
    return true;
  } catch (error) {
    logError(`Error updating handlers/index.js: ${error.message}`);
    return false;
  }
}

// Update the system-status-handlers.js file to add the missing handlers
function updateSystemStatusHandlers() {
  logInfo('Updating system-status-handlers.js...');
  
  const systemStatusHandlersPath = path.join('src', 'handlers', 'system-status-handlers.js');
  
  try {
    // Check if the file exists
    if (!fs.existsSync(systemStatusHandlersPath)) {
      logError(`File not found: ${systemStatusHandlersPath}`);
      return false;
    }
    
    // Read the current content
    const currentContent = fs.readFileSync(systemStatusHandlersPath, 'utf8');
    
    // Check if the handlers are already defined
    if (currentContent.includes('handleDeleteUserSettings') && 
        currentContent.includes('handleGetSettingByKey') && 
        currentContent.includes('handleCreateSetting') && 
        currentContent.includes('handleDeleteSetting')) {
      logWarning('Handlers already defined in system-status-handlers.js');
      return true;
    }
    
    // Add the missing handlers
    let updatedContent = currentContent;
    
    // Add the missing handlers for user settings
    if (!updatedContent.includes('handleDeleteUserSettings')) {
      updatedContent += `
/**
 * Delete user settings for the authenticated user
 */
export async function handleDeleteUserSettings(req, res) {
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
      logSuccess('Added handleDeleteUserSettings handler');
    }
    
    // Add the missing handlers for system settings
    if (!updatedContent.includes('handleGetSettingByKey')) {
      updatedContent += `
/**
 * Get a specific system setting by key
 */
export async function handleGetSettingByKey(req, res) {
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
 * Create a new system setting
 */
export async function handleCreateSetting(req, res) {
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
export async function handleDeleteSetting(req, res) {
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
      logSuccess('Added handleGetSettingByKey, handleCreateSetting, and handleDeleteSetting handlers');
    }
    
    fs.writeFileSync(systemStatusHandlersPath, updatedContent);
    logSuccess('Updated system-status-handlers.js');
    return true;
  } catch (error) {
    logError(`Error updating system-status-handlers.js: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log(chalk.bold('=== Updating Handlers ==='));
  
  // Update the handlers/index.js file
  updateHandlersIndex();
  
  // Update the system-status-handlers.js file
  updateSystemStatusHandlers();
  
  console.log(chalk.bold('\n=== Update Complete ==='));
  logInfo('The handlers have been updated with missing functions.');
  logInfo('To apply these changes, restart the server.');
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
