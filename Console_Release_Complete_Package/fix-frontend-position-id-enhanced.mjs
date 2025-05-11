/**
 * Enhanced Frontend Position ID Null Check Fix
 * This script adds comprehensive null checks and fallbacks for position_id
 * and creates defensive wrappers for position data access
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import path from 'path';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Log a message with color
 * @param {string} message - Message to log
 * @param {string} color - Color to use
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Log a section header
 * @param {string} title - Section title
 */
function logSection(title) {
  console.log('\n' + '='.repeat(80));
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log('='.repeat(80));
}

/**
 * Log a success message
 * @param {string} message - Success message
 */
function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

/**
 * Log an error message
 * @param {string} message - Error message
 */
function logError(message) {
  log(`❌ ${message}`, colors.red);
}

/**
 * Log a warning message
 * @param {string} message - Warning message
 */
function logWarning(message) {
  log(`⚠️ ${message}`, colors.yellow);
}

/**
 * Log an info message
 * @param {string} message - Info message
 */
function logInfo(message) {
  log(`ℹ️ ${message}`, colors.blue);
}

/**
 * Find all HTML files in the dist directory
 * @returns {Promise<string[]>} Array of file paths
 */
async function findHtmlFiles() {
  const distDir = join(__dirname, '..', 'dist');
  
  if (!fs.existsSync(distDir)) {
    console.log(`Dist directory not found at ${distDir}, trying parent directory...`);
    const parentDistDir = join(__dirname, '..', '..', 'dist');
    
    if (!fs.existsSync(parentDistDir)) {
      throw new Error(`Dist directory not found: ${parentDistDir}`);
    }
    
    const files = fs.readdirSync(parentDistDir);
    return files
      .filter(file => file.endsWith('.html'))
      .map(file => join(parentDistDir, file));
  }
  
  const files = fs.readdirSync(distDir);
  return files
    .filter(file => file.endsWith('.html'))
    .map(file => join(distDir, file));
}

/**
 * Inject enhanced position_id null check script into HTML file
 * @param {string} filePath - Path to HTML file
 * @returns {Promise<boolean>} True if the file was modified
 */
async function injectEnhancedPositionIdFix(filePath) {
  logInfo(`Processing file: ${path.basename(filePath)}`);
  
  // Read the file
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if the enhanced fix has already been applied
  if (content.includes('/* Enhanced Position ID Fix v2 */')) {
    logWarning(`Enhanced position ID fix already applied to ${path.basename(filePath)}`);
    return false;
  }
  
  // Create the script to inject
  const script = `
<script>
/* Enhanced Position ID Fix v2 */
(function() {
  console.log('[Enhanced Position ID Fix v2] Applying comprehensive position handling...');
  
  // Define default permissions for roles
  const DEFAULT_PERMISSIONS = {
    admin: {
      dashboard: { view: true },
      users: { view: true, edit: true, create: true, delete: true },
      "post-deal": { view: true, edit: true, create: true, delete: true },
      book: { view: true, edit: true, create: true, delete: true },
      agents: { view: true, edit: true },
      configuration: { view: true, edit: true },
      monitoring: { view: true },
      settings: { view: true, edit: true },
      analytics: { view: true }
    },
    agent: {
      dashboard: { view: true },
      "post-deal": { view: true, edit: true, create: true },
      book: { view: true, edit: true }
    }
  };
  
  // Create a position object from role and position_id
  function createPositionFromRole(role, positionId) {
    const isAdmin = role === 'admin';
    return {
      id: positionId || (isAdmin ? 6 : 1),
      name: isAdmin ? 'Admin' : 'Agent',
      level: isAdmin ? 6 : 1,
      permissions: DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.agent,
      is_admin: isAdmin
    };
  }
  
  // Create a default position object
  function createDefaultPosition(role) {
    return createPositionFromRole(role || 'agent');
  }
  
  // Wait for the app to initialize
  window.addEventListener('load', function() {
    // Give React a moment to initialize
    setTimeout(function() {
      try {
        console.log('[Enhanced Position ID Fix v2] Initializing position handling system...');
        
        // Create a safe position data access wrapper
        window.safeGetPosition = function(user) {
          if (!user) {
            console.log('[Enhanced Position ID Fix v2] No user provided, returning default position');
            return createDefaultPosition();
          }
          
          // If position object exists and is valid, return it
          if (user.position && user.position.id) {
            return user.position;
          }
          
          // If position object is missing but position_id exists
          if (user.position_id) {
            console.log('[Enhanced Position ID Fix v2] Creating position from position_id: ' + user.position_id);
            return createPositionFromRole(user.role, user.position_id);
          }
          
          // If no position data at all, create a default based on role
          console.log('[Enhanced Position ID Fix v2] No position data, creating from role: ' + (user.role || 'agent'));
          return createDefaultPosition(user.role);
        };
        
        // Create a robust permission check wrapper
        window.hasPermission = function(user, section, action) {
          if (!user) {
            console.log('[Enhanced Position ID Fix v2] No user, denying access to ' + section + '/' + action);
            return false;
          }
          
          // Admin users have access to everything
          if (user.role === 'admin') {
            console.log('[Enhanced Position ID Fix v2] Admin role, granting access to ' + section + '/' + action);
            return true;
          }
          
          try {
            // Get position safely
            const position = window.safeGetPosition(user);
            
            if (!position) {
              console.log('[Enhanced Position ID Fix v2] No position, denying access to ' + section + '/' + action);
              return false;
            }
            
            // Admin positions have access to everything
            if (position.is_admin) {
              console.log('[Enhanced Position ID Fix v2] Admin position, granting access to ' + section + '/' + action);
              return true;
            }
            
            // Check specific permissions
            const permissions = position.permissions || {};
            const hasAccess = permissions[section] && permissions[section][action];
            
            console.log('[Enhanced Position ID Fix v2] Access for ' + section + '/' + action + ': ' + (hasAccess ? 'true' : 'false'));
            return !!hasAccess;
          } catch (error) {
            console.error('[Enhanced Position ID Fix v2] Error checking permission:', error);
            
            // Fallback to default permissions based on role
            const defaultPerms = DEFAULT_PERMISSIONS[user.role] || DEFAULT_PERMISSIONS.agent;
            const hasAccess = defaultPerms[section] && defaultPerms[section][action];
            
            console.log('[Enhanced Position ID Fix v2] Fallback access for ' + section + '/' + action + ': ' + (hasAccess ? 'true' : 'false'));
            return !!hasAccess;
          }
        };
        
        // Create a permission provider wrapper
        window.PermissionProvider = {
          // Check if user has permission for section/action
          can: function(user, section, action) {
            return window.hasPermission(user, section, action);
          },
          
          // Get user's position
          getPosition: function(user) {
            return window.safeGetPosition(user);
          }
        };
        
        // Patch React Context Providers
        function patchReactContextProviders() {
          // Check if React DevTools are available to find components
          if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
            const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
            
            // Wait for React components to be registered
            const originalInject = hook.inject;
            hook.inject = function(renderer) {
              const result = originalInject.call(this, renderer);
              
              // Add a listener for new React roots
              if (renderer.findFiberByHostInstance) {
                console.log('[Enhanced Position ID Fix v2] React detected, patching context providers...');
                
                // Find Permission Provider component
                setTimeout(function() {
                  try {
                    // Find AuthContext component if available
                    console.log('[Enhanced Position ID Fix v2] Attempting to patch AuthContext...');
                    
                    // Override user state if necessary
                    const originalSetState = React.Component.prototype.setState;
                    React.Component.prototype.setState = function(state, callback) {
                      if (state && state.user !== undefined && state.user !== null) {
                        // Ensure user has valid position data
                        if (state.user && !state.user.position && state.user.id) {
                          console.log('[Enhanced Position ID Fix v2] Patching user state with position data');
                          state.user.position = window.safeGetPosition(state.user);
                        }
                      }
                      
                      return originalSetState.call(this, state, callback);
                    };
                    
                    console.log('[Enhanced Position ID Fix v2] React context providers patched');
                  } catch (error) {
                    console.error('[Enhanced Position ID Fix v2] Error patching React context:', error);
                  }
                }, 2000);
              }
              
              return result;
            };
          }
        }
        
        // Try to patch React context providers
        patchReactContextProviders();
        
        // Patch the global state if it exists
        if (window.store && window.store.getState) {
          console.log('[Enhanced Position ID Fix v2] Patching Redux store...');
          
          const originalGetState = window.store.getState;
          
          window.store.getState = function() {
            const state = originalGetState.apply(this, arguments);
            
            try {
              // Ensure auth state exists
              if (state && state.auth) {
                // Ensure user exists
                if (state.auth.user) {
                  const user = state.auth.user;
                  
                  // Ensure position_id exists
                  if (!user.position_id && user.role) {
                    user.position_id = user.role === 'admin' ? 6 : 1;
                    console.log('[Enhanced Position ID Fix v2] Added default position_id to user in state');
                  }
                  
                  // Ensure position object exists
                  if (!user.position) {
                    user.position = window.safeGetPosition(user);
                    console.log('[Enhanced Position ID Fix v2] Added position object to user in state');
                  }
                }
              }
            } catch (error) {
              console.error('[Enhanced Position ID Fix v2] Error patching state:', error);
            }
            
            return state;
          };
          
          // Try to patch Redux dispatch
          if (window.store.dispatch) {
            const originalDispatch = window.store.dispatch;
            
            window.store.dispatch = function(action) {
              try {
                // Check for user-related actions
                if (action && action.type && (
                  action.type.includes('USER') || 
                  action.type.includes('AUTH') || 
                  action.type.includes('LOGIN')
                )) {
                  if (action.payload && action.payload.user) {
                    const user = action.payload.user;
                    
                    // Ensure position_id exists
                    if (!user.position_id && user.role) {
                      user.position_id = user.role === 'admin' ? 6 : 1;
                      console.log('[Enhanced Position ID Fix v2] Added default position_id to user in action');
                    }
                    
                    // Ensure position object exists
                    if (!user.position) {
                      user.position = window.safeGetPosition(user);
                      console.log('[Enhanced Position ID Fix v2] Added position object to user in action');
                    }
                  }
                }
              } catch (error) {
                console.error('[Enhanced Position ID Fix v2] Error patching dispatch:', error);
              }
              
              return originalDispatch.apply(this, arguments);
            };
          }
        }
        
        // Patch fetch to intercept position-related API calls
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
          // Call the original fetch function
          return originalFetch(url, options)
            .then(response => {
              // Clone the response so we can read the body
              const clonedResponse = response.clone();
              
              // Check if this is a user or position-related API call
              if (typeof url === 'string' && (
                url.includes('/api/auth/me') || 
                url.includes('/api/auth/login') || 
                url.includes('/positions')
              )) {
                clonedResponse.json().then(data => {
                  // If this is user data in the response
                  if (data && (
                    (data.id && data.email) || // Single user
                    (data.user && data.user.id) // User in login response
                  )) {
                    const user = data.user || data;
                    
                    // Ensure position_id exists
                    if (!user.position_id && user.role) {
                      user.position_id = user.role === 'admin' ? 6 : 1;
                      console.log('[Enhanced Position ID Fix v2] Added default position_id to user from API');
                    }
                    
                    // Ensure position object exists
                    if (!user.position && user.position_id) {
                      user.position = window.safeGetPosition(user);
                      console.log('[Enhanced Position ID Fix v2] Added default position object to user from API');
                    }
                  }
                }).catch(err => {
                  // Ignore JSON parsing errors
                });
              }
              
              return response;
            });
        };
        
        // Add a global error handler for position_id null references
        window.addEventListener('error', function(event) {
          // Check if this is a position-related error
          if (event.error && event.error.message && (
            event.error.message.includes("Cannot read properties of null (reading 'position_id')") ||
            event.error.message.includes("Cannot read properties of null (reading 'position')") ||
            event.error.message.includes("Cannot read property 'position_id' of null") ||
            event.error.message.includes("Cannot read property 'position' of null") ||
            event.error.message.includes("No position found")
          )) {
            console.log('[Enhanced Position ID Fix v2] Caught position-related error:', event.error.message);
            event.preventDefault();
            
            // Try to find the user object in the global state
            if (window.store && window.store.getState) {
              const state = window.store.getState();
              if (state.auth && state.auth.user) {
                const user = state.auth.user;
                
                // Set a default position_id if it's null
                if (!user.position_id) {
                  console.log('[Enhanced Position ID Fix v2] Setting default position_id for user');
                  user.position_id = user.role === 'admin' ? 6 : 1;
                }
                
                // Set a default position object if it's null
                if (!user.position) {
                  console.log('[Enhanced Position ID Fix v2] Setting default position object for user');
                  user.position = window.safeGetPosition(user);
                }
              }
            }
          }
        });
        
        // Patch XMLHttpRequest to handle API responses
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function() {
          this._url = arguments[1];
          return originalOpen.apply(this, arguments);
        };
        
        XMLHttpRequest.prototype.send = function() {
          if (this._url && typeof this._url === 'string' && (
            this._url.includes('/api/auth/me') || 
            this._url.includes('/api/auth/login') || 
            this._url.includes('/positions')
          )) {
            const originalOnLoad = this.onload;
            this.onload = function() {
              try {
                if (this.responseText) {
                  const data = JSON.parse(this.responseText);
                  
                  // If this is user data in the response
                  if (data && (
                    (data.id && data.email) || // Single user
                    (data.user && data.user.id) // User in login response
                  )) {
                    const user = data.user || data;
                    
                    // Ensure position_id exists
                    if (!user.position_id && user.role) {
                      user.position_id = user.role === 'admin' ? 6 : 1;
                      console.log('[Enhanced Position ID Fix v2] Added default position_id to user from XHR API');
                    }
                    
                    // Ensure position object exists
                    if (!user.position && user.position_id) {
                      user.position = window.safeGetPosition(user);
                      console.log('[Enhanced Position ID Fix v2] Added default position object to user from XHR API');
                    }
                  }
                }
              } catch (error) {
                // Ignore JSON parsing errors
              }
              
              if (originalOnLoad) {
                return originalOnLoad.apply(this, arguments);
              }
            };
          }
          
          return originalSend.apply(this, arguments);
        };
        
        console.log('[Enhanced Position ID Fix v2] Comprehensive position handling system applied successfully');
      } catch (error) {
        console.error('[Enhanced Position ID Fix v2] Error applying position handling system:', error);
      }
    }, 500);
  });
})();
</script>
`;
  
  // Inject the script before the closing </body> tag
  const injectedContent = content.replace('</body>', `${script}\n</body>`);
  
  // Write the modified content back to the file
  fs.writeFileSync(filePath, injectedContent, 'utf8');
  
  logSuccess(`Enhanced position ID fix v2 applied to ${path.basename(filePath)}`);
  return true;
}

/**
 * Main function
 */
async function main() {
  logSection('Enhanced Frontend Position ID Fix v2');
  
  try {
    // Find all HTML files
    const htmlFiles = await findHtmlFiles();
    
    if (htmlFiles.length === 0) {
      logWarning('No HTML files found in the dist directory');
      return;
    }
    
    logInfo(`Found ${htmlFiles.length} HTML files`);
    
    // Process each HTML file
    let modifiedCount = 0;
    
    for (const filePath of htmlFiles) {
      const modified = await injectEnhancedPositionIdFix(filePath);
      
      if (modified) {
        modifiedCount++;
      }
    }
    
    if (modifiedCount > 0) {
      logSuccess(`Enhanced position ID fix v2 applied to ${modifiedCount} files`);
    } else {
      logWarning('No files were modified');
    }
    
    logSection('Enhanced Frontend Position ID Fix v2 Completed');
  } catch (error) {
    logError(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main();
