/**
 * Position API Compatibility Fix
 * 
 * This script fixes the issue where the frontend tries to directly access the positions table
 * through its PostgreSQL compatibility layer instead of using the API endpoints.
 * 
 * It intercepts these direct database access attempts and redirects them to use our API endpoints,
 * caches position data for better performance, and provides fallback position data when API calls fail.
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
 * Inject position API compatibility fix script into HTML file
 * @param {string} filePath - Path to HTML file
 * @returns {Promise<boolean>} True if the file was modified
 */
async function injectPositionApiCompatibilityFix(filePath) {
  logInfo(`Processing file: ${path.basename(filePath)}`);
  
  // Read the file
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if the fix has already been applied
  if (content.includes('/* Position API Compatibility Fix */')) {
    logWarning(`Position API compatibility fix already applied to ${path.basename(filePath)}`);
    return false;
  }
  
  // Create the script to inject
  const script = `
<script>
/* Position API Compatibility Fix */
(function() {
  console.log('[Position API Compatibility Fix] Initializing...');
  
  // Default positions data for fallback
  const DEFAULT_POSITIONS = [
    {
      id: 1,
      name: 'Agent',
      level: 1,
      description: 'Regular agent with basic permissions',
      permissions: {
        dashboard: { view: true },
        "post-deal": { view: true, edit: true, create: true },
        book: { view: true, edit: true }
      },
      is_admin: false,
      can_manage_users: false,
      can_manage_deals: true,
      can_view_analytics: false,
      can_manage_settings: false
    },
    {
      id: 2,
      name: 'Senior Agent',
      level: 2,
      description: 'Senior agent with additional analytics permissions',
      permissions: {
        dashboard: { view: true },
        "post-deal": { view: true, edit: true, create: true },
        book: { view: true, edit: true },
        analytics: { view: true }
      },
      is_admin: false,
      can_manage_users: false,
      can_manage_deals: true,
      can_view_analytics: true,
      can_manage_settings: false
    },
    {
      id: 3,
      name: 'Team Lead',
      level: 3,
      description: 'Team lead with user management permissions',
      permissions: {
        dashboard: { view: true },
        "post-deal": { view: true, edit: true, create: true, delete: true },
        book: { view: true, edit: true },
        agents: { view: true },
        analytics: { view: true }
      },
      is_admin: false,
      can_manage_users: true,
      can_manage_deals: true,
      can_view_analytics: true,
      can_manage_settings: false
    },
    {
      id: 4,
      name: 'Manager',
      level: 4,
      description: 'Manager with extended permissions',
      permissions: {
        dashboard: { view: true },
        "post-deal": { view: true, edit: true, create: true, delete: true },
        book: { view: true, edit: true, create: true },
        agents: { view: true, edit: true },
        analytics: { view: true },
        settings: { view: true }
      },
      is_admin: false,
      can_manage_users: true,
      can_manage_deals: true,
      can_view_analytics: true,
      can_manage_settings: true
    },
    {
      id: 5,
      name: 'Director',
      level: 5,
      description: 'Director with high-level permissions',
      permissions: {
        dashboard: { view: true },
        "post-deal": { view: true, edit: true, create: true, delete: true },
        book: { view: true, edit: true, create: true, delete: true },
        agents: { view: true, edit: true, create: true },
        configuration: { view: true },
        monitoring: { view: true },
        settings: { view: true, edit: true },
        analytics: { view: true }
      },
      is_admin: false,
      can_manage_users: true,
      can_manage_deals: true,
      can_view_analytics: true,
      can_manage_settings: true
    },
    {
      id: 6,
      name: 'Admin',
      level: 6,
      description: 'Administrator with full system access',
      permissions: {
        dashboard: { view: true },
        users: { view: true, edit: true, create: true, delete: true },
        "post-deal": { view: true, edit: true, create: true, delete: true },
        book: { view: true, edit: true, create: true, delete: true },
        agents: { view: true, edit: true, create: true, delete: true },
        configuration: { view: true, edit: true },
        monitoring: { view: true },
        settings: { view: true, edit: true },
        analytics: { view: true }
      },
      is_admin: true,
      can_manage_users: true,
      can_manage_deals: true,
      can_view_analytics: true,
      can_manage_settings: true
    }
  ];
  
  // Position data cache
  let positionsCache = null;
  let positionsByIdCache = {};
  let lastFetchTime = 0;
  const CACHE_TTL = 60000; // 1 minute cache TTL
  
  // Wait for the app to initialize
  window.addEventListener('load', function() {
    // Give React a moment to initialize
    setTimeout(function() {
      try {
        console.log('[Position API Compatibility Fix] Applying position API compatibility fix...');
        
        // Function to fetch positions from API
        async function fetchPositionsFromApi() {
          try {
            const now = Date.now();
            
            // Return cached data if it's still fresh
            if (positionsCache && (now - lastFetchTime < CACHE_TTL)) {
              console.log('[Position API Compatibility Fix] Using cached positions data');
              return positionsCache;
            }
            
            console.log('[Position API Compatibility Fix] Fetching positions from API...');
            
            // Get the token from localStorage
            let token = null;
            try {
              const authData = localStorage.getItem('auth');
              if (authData) {
                const parsed = JSON.parse(authData);
                token = parsed.token;
              }
            } catch (error) {
              console.error('[Position API Compatibility Fix] Error getting token:', error);
            }
            
            // Fetch positions from API
            const response = await fetch('/crm/api/positions', {
              headers: token ? { 'Authorization': \`Bearer \${token}\` } : {}
            });
            
            if (!response.ok) {
              throw new Error(\`API returned \${response.status}: \${response.statusText}\`);
            }
            
            const positions = await response.json();
            
            // Update cache
            positionsCache = positions;
            positionsByIdCache = {};
            positions.forEach(position => {
              positionsByIdCache[position.id] = position;
            });
            lastFetchTime = now;
            
            console.log('[Position API Compatibility Fix] Fetched positions from API:', positions);
            return positions;
          } catch (error) {
            console.error('[Position API Compatibility Fix] Error fetching positions from API:', error);
            
            // Use default positions if cache is empty
            if (!positionsCache) {
              console.log('[Position API Compatibility Fix] Using default positions data');
              positionsCache = DEFAULT_POSITIONS;
              positionsByIdCache = {};
              DEFAULT_POSITIONS.forEach(position => {
                positionsByIdCache[position.id] = position;
              });
            }
            
            return positionsCache;
          }
        }
        
        // Function to fetch a position by ID from API
        async function fetchPositionByIdFromApi(id) {
          try {
            const now = Date.now();
            
            // Return cached data if it's still fresh
            if (positionsByIdCache[id] && (now - lastFetchTime < CACHE_TTL)) {
              console.log(\`[Position API Compatibility Fix] Using cached position data for ID \${id}\`);
              return positionsByIdCache[id];
            }
            
            console.log(\`[Position API Compatibility Fix] Fetching position ID \${id} from API...\`);
            
            // Get the token from localStorage
            let token = null;
            try {
              const authData = localStorage.getItem('auth');
              if (authData) {
                const parsed = JSON.parse(authData);
                token = parsed.token;
              }
            } catch (error) {
              console.error('[Position API Compatibility Fix] Error getting token:', error);
            }
            
            // Fetch position from API
            const response = await fetch(\`/crm/api/positions/\${id}\`, {
              headers: token ? { 'Authorization': \`Bearer \${token}\` } : {}
            });
            
            if (!response.ok) {
              throw new Error(\`API returned \${response.status}: \${response.statusText}\`);
            }
            
            const position = await response.json();
            
            // Update cache
            positionsByIdCache[id] = position;
            lastFetchTime = now;
            
            console.log(\`[Position API Compatibility Fix] Fetched position ID \${id} from API:\`, position);
            return position;
          } catch (error) {
            console.error(\`[Position API Compatibility Fix] Error fetching position ID \${id} from API:\`, error);
            
            // Try to find the position in the default positions
            const defaultPosition = DEFAULT_POSITIONS.find(p => p.id === parseInt(id));
            if (defaultPosition) {
              console.log(\`[Position API Compatibility Fix] Using default position data for ID \${id}\`);
              positionsByIdCache[id] = defaultPosition;
              return defaultPosition;
            }
            
            // Return a generic position based on ID
            const genericPosition = {
              id: parseInt(id),
              name: id === 6 ? 'Admin' : 'Agent',
              level: id === 6 ? 6 : 1,
              permissions: id === 6 ? DEFAULT_POSITIONS[5].permissions : DEFAULT_POSITIONS[0].permissions,
              is_admin: id === 6
            };
            
            console.log(\`[Position API Compatibility Fix] Using generic position data for ID \${id}\`);
            positionsByIdCache[id] = genericPosition;
            return genericPosition;
          }
        }
        
        // Function to fetch a user's position from API
        async function fetchUserPositionFromApi(userId) {
          try {
            console.log(\`[Position API Compatibility Fix] Fetching position for user ID \${userId} from API...\`);
            
            // Get the token from localStorage
            let token = null;
            try {
              const authData = localStorage.getItem('auth');
              if (authData) {
                const parsed = JSON.parse(authData);
                token = parsed.token;
              }
            } catch (error) {
              console.error('[Position API Compatibility Fix] Error getting token:', error);
            }
            
            // Fetch user's position from API
            const response = await fetch(\`/crm/api/positions/user/\${userId}\`, {
              headers: token ? { 'Authorization': \`Bearer \${token}\` } : {}
            });
            
            if (!response.ok) {
              throw new Error(\`API returned \${response.status}: \${response.statusText}\`);
            }
            
            const position = await response.json();
            
            // Update cache
            positionsByIdCache[position.id] = position;
            
            console.log(\`[Position API Compatibility Fix] Fetched position for user ID \${userId} from API:\`, position);
            return position;
          } catch (error) {
            console.error(\`[Position API Compatibility Fix] Error fetching position for user ID \${userId} from API:\`, error);
            
            // Try to get the user's position_id
            let positionId = null;
            try {
              // Try to get from auth state
              const authData = localStorage.getItem('auth');
              if (authData) {
                const parsed = JSON.parse(authData);
                if (parsed.user && parsed.user.position_id) {
                  positionId = parsed.user.position_id;
                } else if (parsed.position_id) {
                  positionId = parsed.position_id;
                }
              }
              
              // If we found a position_id, try to get the position
              if (positionId) {
                return await fetchPositionByIdFromApi(positionId);
              }
            } catch (innerError) {
              console.error('[Position API Compatibility Fix] Error getting user position_id:', innerError);
            }
            
            // Determine if the user is an admin
            let isAdmin = false;
            try {
              const authData = localStorage.getItem('auth');
              if (authData) {
                const parsed = JSON.parse(authData);
                if (parsed.user && parsed.user.role === 'admin') {
                  isAdmin = true;
                } else if (parsed.role === 'admin') {
                  isAdmin = true;
                }
              }
            } catch (innerError) {
              console.error('[Position API Compatibility Fix] Error determining if user is admin:', innerError);
            }
            
            // Return a default position based on admin status
            const defaultPosition = isAdmin ? DEFAULT_POSITIONS[5] : DEFAULT_POSITIONS[0];
            console.log(\`[Position API Compatibility Fix] Using default position for user ID \${userId}:\`, defaultPosition);
            return defaultPosition;
          }
        }
        
        // Patch the PostgreSQL compatibility layer
        if (window.supabasePostgres) {
          console.log('[Position API Compatibility Fix] Patching PostgreSQL compatibility layer...');
          
          // Store the original select method
          const originalSelect = window.supabasePostgres.select;
          
          // Override the select method
          window.supabasePostgres.select = function(table, columns, filters) {
            // Check if this is a positions table query
            if (table === 'positions') {
              console.log('[Position API Compatibility Fix] Intercepted positions table query:', { columns, filters });
              
              // Return a promise that resolves with position data
              return new Promise(async (resolve) => {
                try {
                  // If filtering by ID
                  if (filters && filters.id) {
                    const position = await fetchPositionByIdFromApi(filters.id);
                    resolve([position]);
                    return;
                  }
                  
                  // If filtering by user_id (from user_positions view)
                  if (filters && filters.user_id) {
                    const position = await fetchUserPositionFromApi(filters.user_id);
                    resolve([position]);
                    return;
                  }
                  
                  // Otherwise, get all positions
                  const positions = await fetchPositionsFromApi();
                  resolve(positions);
                } catch (error) {
                  console.error('[Position API Compatibility Fix] Error handling positions query:', error);
                  resolve(DEFAULT_POSITIONS);
                }
              });
            }
            
            // Otherwise, use the original method
            return originalSelect.call(this, table, columns, filters);
          };
          
          console.log('[Position API Compatibility Fix] PostgreSQL compatibility layer patched successfully');
        } else {
          // If the compatibility layer isn't available yet, wait for it
          let checkCount = 0;
          const checkInterval = setInterval(() => {
            if (window.supabasePostgres) {
              clearInterval(checkInterval);
              console.log('[Position API Compatibility Fix] Found PostgreSQL compatibility layer, patching...');
              
              // Store the original select method
              const originalSelect = window.supabasePostgres.select;
              
              // Override the select method
              window.supabasePostgres.select = function(table, columns, filters) {
                // Check if this is a positions table query
                if (table === 'positions') {
                  console.log('[Position API Compatibility Fix] Intercepted positions table query:', { columns, filters });
                  
                  // Return a promise that resolves with position data
                  return new Promise(async (resolve) => {
                    try {
                      // If filtering by ID
                      if (filters && filters.id) {
                        const position = await fetchPositionByIdFromApi(filters.id);
                        resolve([position]);
                        return;
                      }
                      
                      // If filtering by user_id (from user_positions view)
                      if (filters && filters.user_id) {
                        const position = await fetchUserPositionFromApi(filters.user_id);
                        resolve([position]);
                        return;
                      }
                      
                      // Otherwise, get all positions
                      const positions = await fetchPositionsFromApi();
                      resolve(positions);
                    } catch (error) {
                      console.error('[Position API Compatibility Fix] Error handling positions query:', error);
                      resolve(DEFAULT_POSITIONS);
                    }
                  });
                }
                
                // Otherwise, use the original method
                return originalSelect.call(this, table, columns, filters);
              };
              
              console.log('[Position API Compatibility Fix] PostgreSQL compatibility layer patched successfully');
            } else {
              checkCount++;
              if (checkCount > 50) {
                clearInterval(checkInterval);
                console.error('[Position API Compatibility Fix] PostgreSQL compatibility layer not found after 5 seconds');
              }
            }
          }, 100);
        }
        
        // Add a global error handler for position-related errors
        window.addEventListener('error', function(event) {
          // Check if this is a position-related error
          if (event.error && event.error.message && (
            event.error.message.includes("No position found") ||
            event.error.message.includes("Error determining user permissions") ||
            event.error.message.includes("Cannot read properties of null (reading 'position_id')")
          )) {
            console.log('[Position API Compatibility Fix] Caught position-related error:', event.error.message);
            event.preventDefault();
            
            // Try to fix the issue by pre-fetching positions
            fetchPositionsFromApi().catch(err => {
              console.error('[Position API Compatibility Fix] Error pre-fetching positions:', err);
            });
            
            // Try to get the current user
            try {
              const authData = localStorage.getItem('auth');
              if (authData) {
                const parsed = JSON.parse(authData);
                const user = parsed.user || parsed;
                
                if (user && user.id) {
                  // Pre-fetch the user's position
                  fetchUserPositionFromApi(user.id).catch(err => {
                    console.error(\`[Position API Compatibility Fix] Error pre-fetching position for user ID \${user.id}:\`, err);
                  });
                }
              }
            } catch (error) {
              console.error('[Position API Compatibility Fix] Error getting user from localStorage:', error);
            }
          }
        });
        
        // Prefetch positions data
        fetchPositionsFromApi().catch(err => {
          console.error('[Position API Compatibility Fix] Error pre-fetching positions:', err);
        });
        
        console.log('[Position API Compatibility Fix] Position API compatibility fix applied successfully');
      } catch (error) {
        console.error('[Position API Compatibility Fix] Error applying position API compatibility fix:', error);
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
  
  logSuccess(`Position API compatibility fix applied to ${path.basename(filePath)}`);
  return true;
}

/**
 * Main function
 */
async function main() {
  logSection('Position API Compatibility Fix');
  
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
      const modified = await injectPositionApiCompatibilityFix(filePath);
      
      if (modified) {
        modifiedCount++;
      }
    }
    
    if (modifiedCount > 0) {
      logSuccess(`Position API compatibility fix applied to ${modifiedCount} files`);
    } else {
      logWarning('No files were modified');
    }
    
    logSection('Position API Compatibility Fix Completed');
  } catch (error) {
    logError(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main();
