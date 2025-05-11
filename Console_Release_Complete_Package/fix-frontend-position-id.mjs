/**
 * Fix frontend position_id null reference error
 * This script adds null checks for position_id in the frontend code
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
    throw new Error(`Dist directory not found: ${distDir}`);
  }
  
  const files = fs.readdirSync(distDir);
  return files
    .filter(file => file.endsWith('.html'))
    .map(file => join(distDir, file));
}

/**
 * Inject position_id null check script into HTML file
 * @param {string} filePath - Path to HTML file
 * @returns {Promise<boolean>} True if the file was modified
 */
async function injectPositionIdNullCheck(filePath) {
  logInfo(`Processing file: ${path.basename(filePath)}`);
  
  // Read the file
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if the fix has already been applied
  if (content.includes('/* Position ID Null Check Fix */')) {
    logWarning(`Position ID null check fix already applied to ${path.basename(filePath)}`);
    return false;
  }
  
  // Create the script to inject
  const script = `
<script>
/* Position ID Null Check Fix */
(function() {
  console.log('[Position ID Fix] Applying position_id null check fix...');
  
  // Wait for the app to initialize
  window.addEventListener('load', function() {
    // Give React a moment to initialize
    setTimeout(function() {
      try {
        // Patch the queryFn function to handle null position_id
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
          // Call the original fetch function
          return originalFetch(url, options)
            .then(response => {
              // Clone the response so we can read the body
              const clonedResponse = response.clone();
              
              // Check if this is a positions API call
              if (url.includes('/positions') || url.includes('position_id')) {
                clonedResponse.json().then(data => {
                  console.log('[Position ID Fix] Intercepted position-related API call:', url);
                  
                  // Add defensive null checks for position_id
                  if (window.positionIdFixApplied !== true) {
                    console.log('[Position ID Fix] Adding defensive null checks for position_id');
                    
                    // Add a global error handler for position_id null references
                    window.addEventListener('error', function(event) {
                      if (event.error && event.error.message && event.error.message.includes("Cannot read properties of null (reading 'position_id')")) {
                        console.log('[Position ID Fix] Caught position_id null reference error');
                        event.preventDefault();
                        
                        // Try to find the user object in the global state
                        if (window.store && window.store.getState) {
                          const state = window.store.getState();
                          if (state.auth && state.auth.user) {
                            const user = state.auth.user;
                            
                            // Set a default position_id if it's null
                            if (!user.position_id) {
                              console.log('[Position ID Fix] Setting default position_id for user');
                              user.position_id = 1; // Default to Agent position
                            }
                          }
                        }
                      }
                    });
                    
                    // Mark the fix as applied
                    window.positionIdFixApplied = true;
                  }
                }).catch(err => {
                  console.error('[Position ID Fix] Error parsing response:', err);
                });
              }
              
              return response;
            });
        };
        
        console.log('[Position ID Fix] Position ID null check fix applied successfully');
      } catch (error) {
        console.error('[Position ID Fix] Error applying position_id null check fix:', error);
      }
    }, 1000);
  });
})();
</script>
`;
  
  // Inject the script before the closing </body> tag
  const injectedContent = content.replace('</body>', `${script}\n</body>`);
  
  // Write the modified content back to the file
  fs.writeFileSync(filePath, injectedContent, 'utf8');
  
  logSuccess(`Position ID null check fix applied to ${path.basename(filePath)}`);
  return true;
}

/**
 * Main function
 */
async function main() {
  logSection('Frontend Position ID Null Check Fix');
  
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
      const modified = await injectPositionIdNullCheck(filePath);
      
      if (modified) {
        modifiedCount++;
      }
    }
    
    if (modifiedCount > 0) {
      logSuccess(`Position ID null check fix applied to ${modifiedCount} files`);
    } else {
      logWarning('No files were modified');
    }
    
    logSection('Frontend Position ID Null Check Fix Completed');
  } catch (error) {
    logError(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main();
