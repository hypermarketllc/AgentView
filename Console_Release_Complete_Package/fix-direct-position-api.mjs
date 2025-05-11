/**
 * Script to fix position API fetching by using direct API calls
 * This ensures positions are properly loaded and available for permission checks
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('[Direct Position API Fix] Starting...');

// Define the script to inject into the frontend
const directPositionApiScript = `
// Direct Position API Fix
(function() {
  console.log('[Direct Position API Fix] Initializing...');
  
  // Store positions globally
  window.cachedPositions = null;
  
  // Define default permissions for different user types
  const DEFAULT_BASIC_PERMISSIONS = {
    dashboard: { view: true },
    "post-deal": { view: true, edit: true, create: true },
    book: { view: true, edit: true },
    settings: { view: true, edit: true }
  };
  
  const DEFAULT_ADMIN_PERMISSIONS = {
    dashboard: { view: true, edit: true, create: true, delete: true },
    "post-deal": { view: true, edit: true, create: true, delete: true },
    book: { view: true, edit: true, create: true, delete: true },
    agents: { view: true, edit: true, create: true, delete: true },
    configuration: { view: true, edit: true, create: true, delete: true },
    monitoring: { view: true, edit: true, create: true, delete: true },
    settings: { view: true, edit: true, create: true, delete: true },
    analytics: { view: true, edit: true, create: true, delete: true },
    users: { view: true, edit: true, create: true, delete: true }
  };
  
  // Helper function to get token from localStorage
  function getToken() {
    try {
      return localStorage.getItem('token') || '';
    } catch (error) {
      console.error('[Direct Position API Fix] Error getting token:', error);
      return '';
    }
  }
  
  // Function to fetch positions directly from API
  async function fetchPositionsDirectly() {
    try {
      console.log('[Direct Position API Fix] Fetching positions from API...');
      
      // Get token
      const token = getToken();
      
      // Prepare headers
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add token if available
      if (token) {
        headers['Authorization'] = \`Bearer \${token}\`;
        console.log('[Direct Position API Fix] Added token to request');
      } else {
        console.log('[Direct Position API Fix] No token available for API request');
      }
      
      // Make API request
      const response = await fetch('/crm/api/positions', {
        method: 'GET',
        headers: headers
      });
      
      // Check if response is ok
      if (!response.ok) {
        throw new Error(\`API request failed with status \${response.status}\`);
      }
      
      // Parse response
      const positions = await response.json();
      
      console.log('[Direct Position API Fix] Fetched positions from API:', positions);
      
      // Store positions globally
      window.cachedPositions = positions;
      
      // Store positions in localStorage for fallback
      try {
        localStorage.setItem('cachedPositions', JSON.stringify(positions));
        console.log('[Direct Position API Fix] Stored positions in localStorage');
      } catch (error) {
        console.error('[Direct Position API Fix] Error storing positions in localStorage:', error);
      }
      
      return positions;
    } catch (error) {
      console.error('[Direct Position API Fix] Error fetching positions:', error);
      
      // Try to get positions from localStorage
      try {
        const cachedPositions = localStorage.getItem('cachedPositions');
        if (cachedPositions) {
          console.log('[Direct Position API Fix] Using cached positions from localStorage');
          const positions = JSON.parse(cachedPositions);
          window.cachedPositions = positions;
          return positions;
        }
      } catch (error) {
        console.error('[Direct Position API Fix] Error getting cached positions:', error);
      }
      
      return [];
    }
  }
  
  // Function to get position by ID
  function getPositionById(positionId) {
    // If positions are cached, use them
    if (window.cachedPositions && Array.isArray(window.cachedPositions)) {
      const position = window.cachedPositions.find(p => p.id === positionId);
      if (position) {
        return position;
      }
    }
    
    // If position not found, return default position
    return {
      id: positionId || 1,
      name: positionId === 6 ? 'Admin' : 'Agent',
      level: positionId === 6 ? 6 : 1,
      is_admin: positionId === 6,
      permissions: positionId === 6 ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_BASIC_PERMISSIONS
    };
  }
  
  // Function to get permissions for a user
  function getPermissionsForUser(user) {
    if (!user) return DEFAULT_BASIC_PERMISSIONS;
    
    // Normalize user object
    const normalizedUser = user.user ? user.user : user;
    
    // Check if user is admin
    const isAdmin = normalizedUser.role === 'admin' || 
                   normalizedUser.email === 'admin@americancoveragecenter.com' || 
                   (normalizedUser.position && normalizedUser.position.is_admin) || 
                   normalizedUser.position_id === 6;
    
    if (isAdmin) {
      return DEFAULT_ADMIN_PERMISSIONS;
    }
    
    // Get position ID
    const positionId = normalizedUser.position_id || 
                      (normalizedUser.position ? normalizedUser.position.id : null) || 
                      1;
    
    // Get position
    const position = getPositionById(positionId);
    
    // Return permissions from position or default
    return (position && position.permissions) ? position.permissions : DEFAULT_BASIC_PERMISSIONS;
  }
  
  // Function to check if user has permission
  function hasPermission(user, section, action) {
    console.log(\`[Direct Position API Fix] Checking permission for \${section}/\${action}\`);
    
    // If no user, deny access
    if (!user) {
      console.log(\`[Direct Position API Fix] No user, denying access to \${section}/\${action}\`);
      return false;
    }
    
    // Normalize user object
    const normalizedUser = user.user ? user.user : user;
    
    // Check if user is admin
    const isAdmin = normalizedUser.role === 'admin' || 
                   normalizedUser.email === 'admin@americancoveragecenter.com' || 
                   (normalizedUser.position && normalizedUser.position.is_admin) || 
                   normalizedUser.position_id === 6;
    
    if (isAdmin) {
      console.log(\`[Direct Position API Fix] User is admin, granting access to \${section}/\${action}\`);
      return true;
    }
    
    // Get permissions
    const permissions = getPermissionsForUser(normalizedUser);
    
    // Check if section exists in permissions
    if (!permissions[section]) {
      console.log(\`[Direct Position API Fix] No permission found for section: \${section}, checking defaults\`);
      
      // Check default permissions
      const defaultPermissions = DEFAULT_BASIC_PERMISSIONS;
      if (defaultPermissions[section] && defaultPermissions[section][action]) {
        console.log(\`[Direct Position API Fix] Default permission grants access to \${section}/\${action}\`);
        return true;
      }
      
      console.log(\`[Direct Position API Fix] No permission found for \${section}/\${action}, denying access\`);
      return false;
    }
    
    // Check if action exists in section permissions
    if (!permissions[section][action]) {
      console.log(\`[Direct Position API Fix] No permission found for action \${action} in section \${section}, denying access\`);
      return false;
    }
    
    console.log(\`[Direct Position API Fix] Access for \${section}/\${action}: \${permissions[section][action]}\`);
    return permissions[section][action];
  }
  
  // Function to patch permission checking
  function patchPermissionChecking() {
    console.log('[Direct Position API Fix] Patching permission checking...');
    
    // Override global hasPermission function
    window.hasPermission = function(user, section, action) {
      return hasPermission(user, section, action);
    };
    
    // Find and patch existing permission checking functions
    const potentialFunctions = [
      'hasPermission',
      'checkPermission',
      'canAccess',
      'hasAccess',
      'checkAccess'
    ];
    
    for (const funcName of potentialFunctions) {
      if (typeof window[funcName] === 'function' && funcName !== 'hasPermission') {
        const originalFunc = window[funcName];
        
        window[funcName] = function(user, section, action) {
          return hasPermission(user, section, action);
        };
        
        console.log(\`[Direct Position API Fix] Patched \${funcName} function\`);
      }
    }
  }
  
  // Function to patch React components
  function patchReactComponents() {
    console.log('[Direct Position API Fix] Patching React components...');
    
    // Wait for React to be loaded
    const checkInterval = setInterval(() => {
      if (window.React) {
        console.log('[Direct Position API Fix] React found, patching components...');
        
        // Original createElement function
        const originalCreateElement = window.React.createElement;
        
        // Override createElement to patch components
        window.React.createElement = function(type, props, ...children) {
          // If component has permission props
          if (props && (props.requiredPermission || props.requiredSection || props.requiredAction)) {
            const section = props.requiredSection || props.requiredPermission;
            const action = props.requiredAction || 'view';
            
            // Get current user from props or global state
            const user = props.user || (window.store && window.store.getState && window.store.getState().auth && window.store.getState().auth.user);
            
            // Check permission
            const hasPermission = window.hasPermission(user, section, action);
            
            // If no permission, return null or fallback
            if (!hasPermission && props.fallback) {
              return originalCreateElement.apply(this, [props.fallback, null, ...children]);
            } else if (!hasPermission) {
              return null;
            }
          }
          
          // Call original function
          return originalCreateElement.apply(this, [type, props, ...children]);
        };
        
        clearInterval(checkInterval);
        console.log('[Direct Position API Fix] Successfully patched React components');
      }
    }, 500);
    
    // Clear interval after 10 seconds to prevent memory leaks
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 10000);
  }
  
  // Function to patch auth context
  function patchAuthContext() {
    console.log('[Direct Position API Fix] Patching auth context...');
    
    // Wait for auth context to be loaded
    const checkInterval = setInterval(() => {
      // Look for auth context or provider
      const authComponents = [
        'AuthContext',
        'AuthProvider',
        'PermissionContext',
        'PermissionProvider'
      ];
      
      let found = false;
      
      for (const componentName of authComponents) {
        if (window[componentName]) {
          console.log(\`[Direct Position API Fix] Found \${componentName}, patching...\`);
          
          // Store original component
          const originalComponent = window[componentName];
          
          // Override with patched version
          window[componentName] = function(...args) {
            const result = originalComponent.apply(this, args);
            
            // If result has a value property (React context)
            if (result && result.value) {
              // Add our permission checking function
              if (!result.value.hasPermission) {
                result.value.hasPermission = function(section, action) {
                  const user = result.value.user || result.value.currentUser;
                  return window.hasPermission(user, section, action);
                };
              }
              
              // Add getPositionById function
              if (!result.value.getPositionById) {
                result.value.getPositionById = getPositionById;
              }
              
              // Add getPermissionsForUser function
              if (!result.value.getPermissionsForUser) {
                result.value.getPermissionsForUser = getPermissionsForUser;
              }
            }
            
            return result;
          };
          
          found = true;
          console.log(\`[Direct Position API Fix] Patched \${componentName}\`);
        }
      }
      
      if (found) {
        clearInterval(checkInterval);
        console.log('[Direct Position API Fix] Successfully patched auth context');
      }
    }, 500);
    
    // Clear interval after 10 seconds to prevent memory leaks
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 10000);
  }
  
  // Function to fetch positions on login
  function setupPositionFetching() {
    console.log('[Direct Position API Fix] Setting up position fetching...');
    
    // Fetch positions immediately
    fetchPositionsDirectly();
    
    // Fetch positions after login
    const originalFetch = window.fetch;
    window.fetch = async function(url, options) {
      const result = await originalFetch.apply(this, arguments);
      
      // Clone result to avoid consuming it
      const clonedResult = result.clone();
      
      // Check if this is a login request
      if (typeof url === 'string' && url.includes('/auth/login') && options && options.method === 'POST') {
        try {
          const data = await clonedResult.json();
          
          // If login successful, fetch positions
          if (data && data.token) {
            console.log('[Direct Position API Fix] Login successful, fetching positions...');
            setTimeout(fetchPositionsDirectly, 500);
          }
        } catch (error) {
          // Ignore errors
        }
      }
      
      return result;
    };
    
    // Listen for storage events to detect token changes
    window.addEventListener('storage', function(event) {
      if (event.key === 'token' && event.newValue) {
        console.log('[Direct Position API Fix] Token changed, fetching positions...');
        fetchPositionsDirectly();
      }
    });
    
    // Fetch positions periodically
    setInterval(fetchPositionsDirectly, 60000);
  }
  
  // Apply all patches
  function applyPatches() {
    // Patch permission checking
    patchPermissionChecking();
    
    // Patch React components
    patchReactComponents();
    
    // Patch auth context
    patchAuthContext();
    
    // Setup position fetching
    setupPositionFetching();
    
    console.log('[Direct Position API Fix] All patches applied');
  }
  
  // Apply patches when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyPatches);
  } else {
    applyPatches();
  }
  
  console.log('[Direct Position API Fix] Initialization complete');
})();
`;

// Function to inject the script into index.html
async function injectDirectPositionApiScript() {
  try {
    // Path to index.html
    const indexPath = join(__dirname, '..', 'index.html');
    
    // Check if index.html exists
    if (!fs.existsSync(indexPath)) {
      console.error('[Direct Position API Fix] index.html not found');
      return;
    }
    
    // Read index.html
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Check if script is already injected
    if (indexContent.includes('[Direct Position API Fix]')) {
      console.log('[Direct Position API Fix] Script already injected, skipping');
      return;
    }
    
    // Inject script before closing body tag
    indexContent = indexContent.replace(
      '</body>',
      `<script>${directPositionApiScript}</script>\n</body>`
    );
    
    // Write updated index.html
    fs.writeFileSync(indexPath, indexContent);
    
    console.log('[Direct Position API Fix] Script injected into index.html');
  } catch (error) {
    console.error('[Direct Position API Fix] Error injecting script:', error);
  }
}

// Run the script
injectDirectPositionApiScript().then(() => {
  console.log('[Direct Position API Fix] Completed');
}).catch(error => {
  console.error('[Direct Position API Fix] Fatal error:', error);
  process.exit(1);
});
