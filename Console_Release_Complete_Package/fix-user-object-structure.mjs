/**
 * User Object Structure Normalizer
 * This script fixes the inconsistency in user object structure after page refresh
 * - After login, the user object has a direct structure: {id: 2, email: 'agent@example.com', ...}
 * - After refresh, it's nested: {user: {id: 2, email: 'agent@example.com', ...}}
 * This script normalizes the structure to ensure consistent access to user properties
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
 * Inject user object structure normalizer script into HTML file
 * @param {string} filePath - Path to HTML file
 * @returns {Promise<boolean>} True if the file was modified
 */
async function injectUserObjectStructureFix(filePath) {
  logInfo(`Processing file: ${path.basename(filePath)}`);
  
  // Read the file
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if the fix has already been applied
  if (content.includes('/* User Object Structure Normalizer */')) {
    logWarning(`User object structure fix already applied to ${path.basename(filePath)}`);
    return false;
  }
  
  // Create the script to inject
  const script = `
<script>
/* User Object Structure Normalizer */
(function() {
  console.log('[User Object Structure Normalizer] Initializing...');
  
  // Wait for the app to initialize
  window.addEventListener('load', function() {
    // Give React a moment to initialize
    setTimeout(function() {
      try {
        console.log('[User Object Structure Normalizer] Applying user object structure normalization...');
        
        // Create a user object normalizer function
        window.normalizeUserObject = function(userObj) {
          if (!userObj) {
            console.log('[User Object Structure Normalizer] No user object provided');
            return null;
          }
          
          // If it's already a direct user object (has id and email properties)
          if (userObj.id && userObj.email) {
            console.log('[User Object Structure Normalizer] User object already in direct format');
            return userObj;
          }
          
          // If it's a nested user object (has user property with id and email)
          if (userObj.user && userObj.user.id && userObj.user.email) {
            console.log('[User Object Structure Normalizer] Converting nested user object to direct format');
            return userObj.user;
          }
          
          // If it's a token response (has token and user properties)
          if (userObj.token && userObj.user) {
            console.log('[User Object Structure Normalizer] Extracting user from token response');
            return userObj.user;
          }
          
          console.log('[User Object Structure Normalizer] Unknown user object format:', userObj);
          return userObj;
        };
        
        // Patch localStorage getItem to normalize user object when retrieved
        const originalGetItem = Storage.prototype.getItem;
        Storage.prototype.getItem = function(key) {
          const value = originalGetItem.call(this, key);
          
          // If this is a user-related key
          if (key === 'user' || key === 'auth' || key === 'authUser') {
            try {
              const parsed = JSON.parse(value);
              if (parsed) {
                // Normalize the user object
                const normalized = window.normalizeUserObject(parsed);
                console.log('[User Object Structure Normalizer] Normalized user object from localStorage:', key);
                return JSON.stringify(normalized);
              }
            } catch (error) {
              // Not JSON or other error, return original value
            }
          }
          
          return value;
        };
        
        // Patch localStorage setItem to normalize user object before storing
        const originalSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = function(key, value) {
          // If this is a user-related key and the value is a string
          if ((key === 'user' || key === 'auth' || key === 'authUser') && typeof value === 'string') {
            try {
              const parsed = JSON.parse(value);
              if (parsed) {
                // Normalize the user object
                const normalized = window.normalizeUserObject(parsed);
                console.log('[User Object Structure Normalizer] Normalized user object before storing in localStorage:', key);
                return originalSetItem.call(this, key, JSON.stringify(normalized));
              }
            } catch (error) {
              // Not JSON or other error, store original value
            }
          }
          
          return originalSetItem.call(this, key, value);
        };
        
        // Patch the global state if it exists
        if (window.store && window.store.getState) {
          console.log('[User Object Structure Normalizer] Patching Redux store...');
          
          const originalGetState = window.store.getState;
          
          window.store.getState = function() {
            const state = originalGetState.apply(this, arguments);
            
            try {
              // Ensure auth state exists
              if (state && state.auth) {
                // Normalize user object
                if (state.auth.user) {
                  state.auth.user = window.normalizeUserObject(state.auth.user);
                }
              }
            } catch (error) {
              console.error('[User Object Structure Normalizer] Error patching state:', error);
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
                  if (action.payload) {
                    // Normalize user object in payload
                    if (action.payload.user) {
                      action.payload.user = window.normalizeUserObject(action.payload.user);
                    } else if (action.payload.id && action.payload.email) {
                      // Direct user object in payload
                      action.payload = window.normalizeUserObject(action.payload);
                    }
                  }
                }
              } catch (error) {
                console.error('[User Object Structure Normalizer] Error patching dispatch:', error);
              }
              
              return originalDispatch.apply(this, arguments);
            };
          }
        }
        
        // Patch fetch to intercept user-related API responses
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
          // Call the original fetch function
          return originalFetch(url, options)
            .then(response => {
              // Clone the response so we can read the body
              const clonedResponse = response.clone();
              
              // Check if this is a user-related API call
              if (typeof url === 'string' && (
                url.includes('/api/auth/me') || 
                url.includes('/api/auth/login') || 
                url.includes('/api/users')
              )) {
                clonedResponse.json().then(data => {
                  // Normalize the user object in the response
                  if (data) {
                    console.log('[User Object Structure Normalizer] Normalizing user object from API response');
                    window.normalizeUserObject(data);
                  }
                }).catch(err => {
                  // Ignore JSON parsing errors
                });
              }
              
              return response;
            });
        };
        
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
            this._url.includes('/api/users')
          )) {
            const originalOnLoad = this.onload;
            this.onload = function() {
              try {
                if (this.responseText) {
                  const data = JSON.parse(this.responseText);
                  
                  // Normalize the user object in the response
                  if (data) {
                    console.log('[User Object Structure Normalizer] Normalizing user object from XHR API response');
                    window.normalizeUserObject(data);
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
        
        console.log('[User Object Structure Normalizer] User object structure normalization applied successfully');
      } catch (error) {
        console.error('[User Object Structure Normalizer] Error applying user object structure normalization:', error);
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
  
  logSuccess(`User object structure fix applied to ${path.basename(filePath)}`);
  return true;
}

/**
 * Main function
 */
async function main() {
  logSection('User Object Structure Normalizer');
  
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
      const modified = await injectUserObjectStructureFix(filePath);
      
      if (modified) {
        modifiedCount++;
      }
    }
    
    if (modifiedCount > 0) {
      logSuccess(`User object structure fix applied to ${modifiedCount} files`);
    } else {
      logWarning('No files were modified');
    }
    
    logSection('User Object Structure Normalizer Completed');
  } catch (error) {
    logError(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main();
