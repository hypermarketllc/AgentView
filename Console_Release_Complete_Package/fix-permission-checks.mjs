/**
 * Script to fix permission checks in the frontend
 * This script ensures permissions work correctly even after page refresh
 * and handles both direct and nested user objects
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('[Permission Checks Fix] Starting...');

// Define the script to inject into the frontend
const permissionFixScript = `
// Permission Checks Fix
(function() {
  console.log('[Permission Checks Fix] Initializing...');
  
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
  
  // Helper function to normalize user object
  function normalizeUser(user) {
    if (!user) return null;
    
    // Handle nested user object
    if (user.user && typeof user.user === 'object') {
      return user.user;
    }
    
    return user;
  }
  
  // Helper function to check if user is admin
  function isAdmin(user) {
    if (!user) return false;
    
    const normalizedUser = normalizeUser(user);
    
    // Check various ways to identify admin
    return (
      (normalizedUser.role === 'admin') ||
      (normalizedUser.email === 'admin@americancoveragecenter.com') ||
      (normalizedUser.position && normalizedUser.position.is_admin) ||
      (normalizedUser.position_id === 6)
    );
  }
  
  // Helper function to get position from user
  function getPosition(user) {
    if (!user) return null;
    
    const normalizedUser = normalizeUser(user);
    
    // Return position if it exists
    if (normalizedUser.position) {
      return normalizedUser.position;
    }
    
    // Create default position based on role
    return {
      id: normalizedUser.position_id || (normalizedUser.role === 'admin' ? 6 : 1),
      name: normalizedUser.role === 'admin' ? 'Admin' : 'Agent',
      level: normalizedUser.role === 'admin' ? 6 : 1,
      is_admin: normalizedUser.role === 'admin',
      permissions: normalizedUser.role === 'admin' ? DEFAULT_ADMIN_PERMISSIONS : DEFAULT_BASIC_PERMISSIONS
    };
  }
  
  // Helper function to get permissions for a user
  function getPermissions(user) {
    if (!user) return {};
    
    const normalizedUser = normalizeUser(user);
    
    // If admin, return admin permissions
    if (isAdmin(normalizedUser)) {
      return DEFAULT_ADMIN_PERMISSIONS;
    }
    
    // Get position
    const position = getPosition(normalizedUser);
    
    // Return position permissions or default basic permissions
    return (position && position.permissions) ? position.permissions : DEFAULT_BASIC_PERMISSIONS;
  }
  
  // Patch the permission checking function
  function patchPermissionChecking() {
    // Find all potential permission checking functions
    const potentialFunctions = [
      'hasPermission',
      'checkPermission',
      'canAccess',
      'hasAccess',
      'checkAccess'
    ];
    
    let patchedCount = 0;
    
    // Try to find and patch each function
    for (const funcName of potentialFunctions) {
      if (typeof window[funcName] === 'function') {
        const originalFunc = window[funcName];
        
        window[funcName] = function(user, section, action) {
          console.log(\`[Permission Checks Fix] Checking access for \${section}/\${action}\`);
          
          // If no user, deny access
          if (!user) {
            console.log(\`[Permission Checks Fix] No user, denying access to \${section}/\${action}\`);
            return false;
          }
          
          // If admin, grant access
          if (isAdmin(user)) {
            console.log(\`[Permission Checks Fix] User is admin, granting access to \${section}/\${action}\`);
            return true;
          }
          
          // Get permissions
          const permissions = getPermissions(user);
          
          // Check if section exists in permissions
          if (!permissions[section]) {
            console.log(\`[Permission Checks Fix] No permission found for section: \${section}, checking defaults\`);
            
            // Check default permissions
            const defaultPermissions = DEFAULT_BASIC_PERMISSIONS;
            if (defaultPermissions[section] && defaultPermissions[section][action]) {
              console.log(\`[Permission Checks Fix] Default permission grants access to \${section}/\${action}\`);
              return true;
            }
            
            console.log(\`[Permission Checks Fix] No permission found for \${section}/\${action}, denying access\`);
            return false;
          }
          
          // Check if action exists in section permissions
          if (!permissions[section][action]) {
            console.log(\`[Permission Checks Fix] No permission found for action \${action} in section \${section}, denying access\`);
            return false;
          }
          
          console.log(\`[Permission Checks Fix] Access for \${section}/\${action}: \${permissions[section][action]}\`);
          return permissions[section][action];
        };
        
        patchedCount++;
        console.log(\`[Permission Checks Fix] Patched \${funcName} function\`);
      }
    }
    
    // If no functions were patched, create a global permission checking function
    if (patchedCount === 0) {
      window.hasPermission = function(user, section, action) {
        console.log(\`[Permission Checks Fix] Checking access for \${section}/\${action}\`);
        
        // If no user, deny access
        if (!user) {
          console.log(\`[Permission Checks Fix] No user, denying access to \${section}/\${action}\`);
          return false;
        }
        
        // If admin, grant access
        if (isAdmin(user)) {
          console.log(\`[Permission Checks Fix] User is admin, granting access to \${section}/\${action}\`);
          return true;
        }
        
        // Get permissions
        const permissions = getPermissions(user);
        
        // Check if section exists in permissions
        if (!permissions[section]) {
          console.log(\`[Permission Checks Fix] No permission found for section: \${section}, checking defaults\`);
          
          // Check default permissions
          const defaultPermissions = DEFAULT_BASIC_PERMISSIONS;
          if (defaultPermissions[section] && defaultPermissions[section][action]) {
            console.log(\`[Permission Checks Fix] Default permission grants access to \${section}/\${action}\`);
            return true;
          }
          
          console.log(\`[Permission Checks Fix] No permission found for \${section}/\${action}, denying access\`);
          return false;
        }
        
        // Check if action exists in section permissions
        if (!permissions[section][action]) {
          console.log(\`[Permission Checks Fix] No permission found for action \${action} in section \${section}, denying access\`);
          return false;
        }
        
        console.log(\`[Permission Checks Fix] Access for \${section}/\${action}: \${permissions[section][action]}\`);
        return permissions[section][action];
      };
      
      console.log('[Permission Checks Fix] Created global hasPermission function');
    }
  }
  
  // Patch the permission provider component
  function patchPermissionProvider() {
    // Wait for React components to be loaded
    const checkInterval = setInterval(() => {
      // Look for permission provider or context
      const permissionComponents = [
        'PermissionProvider',
        'PermissionContext',
        'AuthContext',
        'AuthProvider'
      ];
      
      let found = false;
      
      for (const componentName of permissionComponents) {
        if (window[componentName]) {
          console.log(\`[Permission Checks Fix] Found \${componentName}, patching...\`);
          
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
            }
            
            return result;
          };
          
          found = true;
          console.log(\`[Permission Checks Fix] Patched \${componentName}\`);
        }
      }
      
      if (found) {
        clearInterval(checkInterval);
        console.log('[Permission Checks Fix] Successfully patched permission components');
      }
    }, 500);
    
    // Clear interval after 10 seconds to prevent memory leaks
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 10000);
  }
  
  // Patch React components that check permissions
  function patchReactComponents() {
    // Wait for React to be loaded
    const checkInterval = setInterval(() => {
      if (window.React) {
        console.log('[Permission Checks Fix] React found, patching components...');
        
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
        console.log('[Permission Checks Fix] Successfully patched React components');
      }
    }, 500);
    
    // Clear interval after 10 seconds to prevent memory leaks
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 10000);
  }
  
  // Override permission checking in Redux store
  function patchReduxStore() {
    // Wait for Redux store to be loaded
    const checkInterval = setInterval(() => {
      if (window.store && window.store.getState) {
        console.log('[Permission Checks Fix] Redux store found, patching...');
        
        // Original getState function
        const originalGetState = window.store.getState;
        
        // Override getState to patch auth state
        window.store.getState = function() {
          const state = originalGetState.apply(this);
          
          // If state has auth
          if (state && state.auth) {
            // Ensure user exists
            if (!state.auth.user) {
              state.auth.user = null;
            }
            
            // Add permission checking function
            if (!state.auth.hasPermission) {
              state.auth.hasPermission = function(section, action) {
                return window.hasPermission(state.auth.user, section, action);
              };
            }
            
            // Add isAdmin function
            if (!state.auth.isAdmin) {
              state.auth.isAdmin = function() {
                return isAdmin(state.auth.user);
              };
            }
          }
          
          return state;
        };
        
        clearInterval(checkInterval);
        console.log('[Permission Checks Fix] Successfully patched Redux store');
      }
    }, 500);
    
    // Clear interval after 10 seconds to prevent memory leaks
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 10000);
  }
  
  // Apply all patches
  function applyPatches() {
    // Create global permission checking function
    patchPermissionChecking();
    
    // Patch permission provider
    patchPermissionProvider();
    
    // Patch React components
    patchReactComponents();
    
    // Patch Redux store
    patchReduxStore();
    
    console.log('[Permission Checks Fix] All patches applied');
  }
  
  // Apply patches when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyPatches);
  } else {
    applyPatches();
  }
  
  console.log('[Permission Checks Fix] Initialization complete');
})();
`;

// Function to inject the script into index.html
async function injectPermissionFixScript() {
  try {
    // Path to index.html
    const indexPath = join(__dirname, '..', 'index.html');
    
    // Check if index.html exists
    if (!fs.existsSync(indexPath)) {
      console.error('[Permission Checks Fix] index.html not found');
      return;
    }
    
    // Read index.html
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Check if script is already injected
    if (indexContent.includes('[Permission Checks Fix]')) {
      console.log('[Permission Checks Fix] Script already injected, skipping');
      return;
    }
    
    // Inject script before closing body tag
    indexContent = indexContent.replace(
      '</body>',
      `<script>${permissionFixScript}</script>\n</body>`
    );
    
    // Write updated index.html
    fs.writeFileSync(indexPath, indexContent);
    
    console.log('[Permission Checks Fix] Script injected into index.html');
  } catch (error) {
    console.error('[Permission Checks Fix] Error injecting script:', error);
  }
}

// Run the script
injectPermissionFixScript().then(() => {
  console.log('[Permission Checks Fix] Completed');
}).catch(error => {
  console.error('[Permission Checks Fix] Fatal error:', error);
  process.exit(1);
});
