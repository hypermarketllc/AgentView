/**
 * update-api-registry.js
 * 
 * This script updates the API registry to add missing endpoints for user settings and system settings.
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

// Path to the API registry file
const apiRegistryPath = path.join('src', 'config', 'api-registry.js');

// Update the API registry to add missing endpoints
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
    
    // Check if the API_REGISTRY object exists
    if (!currentContent.includes('export const API_REGISTRY')) {
      logError('Could not find API_REGISTRY object in API registry');
      return false;
    }
    
    // Add missing endpoints to the user settings section
    let updatedContent = currentContent;
    
    // Check if the user settings section has the delete endpoint
    if (!updatedContent.includes('deleteSettings')) {
      updatedContent = updatedContent.replace(
        /user: \{([^}]+)\}/,
        `user: {$1,
    deleteSettings: {
      path: '/user/settings',
      method: 'DELETE',
      requiresAuth: true,
      handler: 'handleDeleteUserSettings',
      description: 'Delete user settings'
    }
  }`
      );
      logSuccess('Added DELETE /user/settings endpoint');
    }
    
    // Check if the settings section has the getByKey, create, and delete endpoints
    if (!updatedContent.includes('getSettingByKey')) {
      updatedContent = updatedContent.replace(
        /settings: \{([^}]+)\}/,
        `settings: {$1,
    getSettingByKey: {
      path: '/settings/:key',
      method: 'GET',
      requiresAuth: false,
      handler: 'handleGetSettingByKey',
      description: 'Get setting by key'
    },
    createSetting: {
      path: '/settings',
      method: 'POST',
      requiresAuth: true,
      handler: 'handleCreateSetting',
      description: 'Create a new setting'
    },
    deleteSetting: {
      path: '/settings/:key',
      method: 'DELETE',
      requiresAuth: true,
      handler: 'handleDeleteSetting',
      description: 'Delete a setting'
    }
  }`
      );
      logSuccess('Added GET /settings/:key, POST /settings, and DELETE /settings/:key endpoints');
    }
    
    fs.writeFileSync(apiRegistryPath, updatedContent);
    logSuccess('Updated API registry');
    return true;
  } catch (error) {
    logError(`Error updating API registry: ${error.message}`);
    return false;
  }
}

// Update the route registrar to map handlers to functions
function updateRouteRegistrar() {
  logInfo('Updating route registrar...');
  
  const routeRegistrarPath = path.join('src', 'lib', 'route-registrar.js');
  
  try {
    // Check if the file exists
    if (!fs.existsSync(routeRegistrarPath)) {
      logError(`File not found: ${routeRegistrarPath}`);
      return false;
    }
    
    // Read the current content
    const currentContent = fs.readFileSync(routeRegistrarPath, 'utf8');
    
    // Check if the handlerMap object exists
    if (!currentContent.includes('const handlerMap')) {
      logError('Could not find handlerMap object in route registrar');
      return false;
    }
    
    // Add missing handlers to the handlerMap
    let updatedContent = currentContent;
    
    // Add imports for the new handlers
    if (!updatedContent.includes('user-settings-handlers')) {
      updatedContent = updatedContent.replace(
        /import \{([^}]+)\} from '\.\.\/handlers\/system-status-handlers\.js';/,
        `import {$1} from '../handlers/system-status-handlers.js';\nimport { getUserSettings, updateUserSettings, deleteUserSettings } from '../handlers/user-settings-handlers.js';\nimport { getSettings, getSettingByKey, updateSetting, createSetting, deleteSetting } from '../handlers/settings-handlers.js';`
      );
      logSuccess('Added imports for user settings and settings handlers');
    }
    
    // Add mappings for the new handlers
    if (!updatedContent.includes('handleDeleteUserSettings')) {
      updatedContent = updatedContent.replace(
        /const handlerMap = \{([^}]+)\};/,
        `const handlerMap = {$1,
  // User settings handlers
  handleGetUserSettings: getUserSettings,
  handleUpdateUserSettings: updateUserSettings,
  handleDeleteUserSettings: deleteUserSettings,
  
  // Settings handlers
  handleGetSystemSettings: getSettings,
  handleGetSettingByKey: getSettingByKey,
  handleUpdateSystemSettings: updateSetting,
  handleCreateSetting: createSetting,
  handleDeleteSetting: deleteSetting
};`
      );
      logSuccess('Added mappings for user settings and settings handlers');
    }
    
    fs.writeFileSync(routeRegistrarPath, updatedContent);
    logSuccess('Updated route registrar');
    return true;
  } catch (error) {
    logError(`Error updating route registrar: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log(chalk.bold('=== Updating API Registry ==='));
  
  // Update the API registry
  updateApiRegistry();
  
  // Update the route registrar
  updateRouteRegistrar();
  
  console.log(chalk.bold('\n=== Update Complete ==='));
  logInfo('The API registry has been updated with missing endpoints.');
  logInfo('To apply these changes, restart the server.');
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
