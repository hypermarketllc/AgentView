/**
 * Script to implement hardcoded permissions for critical sections
 * This ensures users can access essential sections regardless of position data issues
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('[Hardcoded Permissions Fix] Starting...');

// Define the script to inject into the frontend
const hardcodedPermissionsScript = `
// Hardcoded Permissions Fix
(function() {
  console.log('[Hardcoded Permissions Fix] Initializing...');
  
  // Define critical sections that all users must have access to
  const CRITICAL_SECTIONS = {
    dashboard: { view: true },
    "post-deal": { view: true, edit: true, create: true },
    book: { view: true, edit: true },
    settings: { view: true, edit: true }
  };
  
  // Define admin sections with full permissions
  const ADMIN_SECTIONS = {
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
  
  // Function to check if user is admin
  function isAdmin(user) {
    if (!user) return false;
    
    // Normalize user object
    const normalizedUser = user.user ? user.user : user;
    
    return normalizedUser.role === 'admin' || 
           normalizedUser.email === 'admin@americancoveragecenter.com' || 
           (normalizedUser.position && normalizedUser.position.is_admin) || 
           normalizedUser.position_id === 6;
  }
  
  // Override hasPermission function
  function hardcodedHasPermission(user, section, action) {
    console.log(\`[Hardcoded Permissions Fix] Checking permission for \${section}/\${action}\`);
    
    // If no user, deny access
    if (!user) {
      console.log(\`[Hardcoded Permissions Fix] No user, denying access to \${section}/\${action}\`);
      return false;
    }
    
    // Check if user is admin
    if (isAdmin(user)) {
      console.log(\`[Hardcoded Permissions Fix] User is admin, granting access to \${section}/\${action}\`);
      return true;
    }
    
    // For critical sections, always grant access if the action is supported
    if (CRITICAL_SECTIONS[section] && CRITICAL_SECTIONS[section][action]) {
      console.log(\`[Hardcoded Permissions Fix] Critical section \${section}/\${action}, granting access\`);
      return true;
    }
    
    // For non-critical sections, try to use the original permission system
    try {
      // If there's an existing permission system, use it for non-critical sections
      if (window._originalHasPermission) {
        return window._originalHasPermission(user, section, action);
      }
    } catch (error) {
      console.error(\`[Hardcoded Permissions Fix] Error checking original permissions: \${error.message}\`);
    }
    
    // Default deny for non-critical sections
    console.log(\`[Hardcoded Permissions Fix] Non-critical section \${section}/\${action}, denying access\`);
    return false;
  }
  
  // Function to patch permission checking
  function patchPermissionChecking() {
    console.log('[Hardcoded Permissions Fix] Patching permission checking...');
    
    // Store original hasPermission function if it exists
    if (typeof window.hasPermission === 'function') {
      window._originalHasPermission = window.hasPermission;
    }
    
    // Override global hasPermission function
    window.hasPermission = hardcodedHasPermission;
    
    // Find and patch existing permission checking functions
    const potentialFunctions = [
      'checkPermission',
      'canAccess',
      'hasAccess',
      'checkAccess'
    ];
    
    for (const funcName of potentialFunctions) {
      if (typeof window[funcName] === 'function') {
        const originalFunc = window[funcName];
        window['_original' + funcName] = originalFunc;
        
        window[funcName] = function(user, section, action) {
          return hardcodedHasPermission(user, section, action);
        };
        
        console.log(\`[Hardcoded Permissions Fix] Patched \${funcName} function\`);
      }
    }
  }
  
  // Function to patch React components
  function patchReactComponents() {
    console.log('[Hardcoded Permissions Fix] Patching React components...');
    
    // Wait for React to be loaded
    const checkInterval = setInterval(() => {
      if (window.React) {
        console.log('[Hardcoded Permissions Fix] React found, patching components...');
        
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
            
            // For critical sections, always render the component
            if (CRITICAL_SECTIONS[section] && CRITICAL_SECTIONS[section][action]) {
              // Continue with original createElement
              return originalCreateElement.apply(this, [type, props, ...children]);
            }
            
            // For admin users, always render the component
            if (user && isAdmin(user)) {
              return originalCreateElement.apply(this, [type, props, ...children]);
            }
            
            // For other sections, check permission
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
        console.log('[Hardcoded Permissions Fix] Successfully patched React components');
      }
    }, 500);
    
    // Clear interval after 10 seconds to prevent memory leaks
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 10000);
  }
  
  // Function to patch auth context
  function patchAuthContext() {
    console.log('[Hardcoded Permissions Fix] Patching auth context...');
    
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
          console.log(\`[Hardcoded Permissions Fix] Found \${componentName}, patching...\`);
          
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
                  return hardcodedHasPermission(user, section, action);
                };
              } else {
                // Override existing hasPermission
                const originalContextHasPermission = result.value.hasPermission;
                result.value._originalHasPermission = originalContextHasPermission;
                
                result.value.hasPermission = function(section, action) {
                  const user = result.value.user || result.value.currentUser;
                  return hardcodedHasPermission(user, section, action);
                };
              }
            }
            
            return result;
          };
          
          found = true;
          console.log(\`[Hardcoded Permissions Fix] Patched \${componentName}\`);
        }
      }
      
      if (found) {
        clearInterval(checkInterval);
        console.log('[Hardcoded Permissions Fix] Successfully patched auth context');
      }
    }, 500);
    
    // Clear interval after 10 seconds to prevent memory leaks
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 10000);
  }
  
  // Function to patch route guards
  function patchRouteGuards() {
    console.log('[Hardcoded Permissions Fix] Patching route guards...');
    
    // Wait for router to be loaded
    const checkInterval = setInterval(() => {
      // Look for router components
      const routerComponents = [
        'Router',
        'BrowserRouter',
        'Route',
        'PrivateRoute',
        'ProtectedRoute'
      ];
      
      let found = false;
      
      for (const componentName of routerComponents) {
        if (window[componentName]) {
          console.log(\`[Hardcoded Permissions Fix] Found \${componentName}, patching...\`);
          
          // If it's a route guard component
          if (componentName === 'PrivateRoute' || componentName === 'ProtectedRoute') {
            const originalComponent = window[componentName];
            
            window[componentName] = function(...args) {
              // Get props from args
              const props = args[0] || {};
              
              // If it has permission requirements
              if (props.requiredPermission || props.requiredSection || props.requiredAction) {
                const section = props.requiredSection || props.requiredPermission;
                const action = props.requiredAction || 'view';
                
                // For critical sections, always allow access
                if (CRITICAL_SECTIONS[section] && CRITICAL_SECTIONS[section][action]) {
                  // Remove permission requirements
                  const newProps = { ...props };
                  delete newProps.requiredPermission;
                  delete newProps.requiredSection;
                  delete newProps.requiredAction;
                  
                  args[0] = newProps;
                }
              }
              
              return originalComponent.apply(this, args);
            };
            
            found = true;
            console.log(\`[Hardcoded Permissions Fix] Patched \${componentName}\`);
          }
        }
      }
      
      if (found) {
        clearInterval(checkInterval);
        console.log('[Hardcoded Permissions Fix] Successfully patched route guards');
      }
    }, 500);
    
    // Clear interval after 10 seconds to prevent memory leaks
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 10000);
  }
  
  // Apply all patches
  function applyPatches() {
    // Patch permission checking
    patchPermissionChecking();
    
    // Patch React components
    patchReactComponents();
    
    // Patch auth context
    patchAuthContext();
    
    // Patch route guards
    patchRouteGuards();
    
    console.log('[Hardcoded Permissions Fix] All patches applied');
  }
  
  // Apply patches when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyPatches);
  } else {
    applyPatches();
  }
  
  // Also apply patches after login
  const originalFetch = window.fetch;
  window.fetch = async function(url, options) {
    const result = await originalFetch.apply(this, arguments);
    
    // Clone result to avoid consuming it
    const clonedResult = result.clone();
    
    // Check if this is a login request
    if (typeof url === 'string' && url.includes('/auth/login') && options && options.method === 'POST') {
      try {
        const data = await clonedResult.json();
        
        // If login successful, apply patches
        if (data && data.token) {
          console.log('[Hardcoded Permissions Fix] Login successful, applying patches...');
          setTimeout(applyPatches, 500);
        }
      } catch (error) {
        // Ignore errors
      }
    }
    
    return result;
  };
  
  // Apply patches on page refresh
  window.addEventListener('load', function() {
    console.log('[Hardcoded Permissions Fix] Page loaded, applying patches...');
    setTimeout(applyPatches, 500);
  });
  
  console.log('[Hardcoded Permissions Fix] Initialization complete');
})();
`;

// Function to inject the script into index.html
async function injectHardcodedPermissionsScript() {
  try {
    // Path to index.html
    const indexPath = join(__dirname, '..', 'index.html');
    
    // Check if index.html exists
    if (!fs.existsSync(indexPath)) {
      console.error('[Hardcoded Permissions Fix] index.html not found');
      return;
    }
    
    // Read index.html
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Check if script is already injected
    if (indexContent.includes('[Hardcoded Permissions Fix]')) {
      console.log('[Hardcoded Permissions Fix] Script already injected, skipping');
      return;
    }
    
    // Inject script before closing body tag
    indexContent = indexContent.replace(
      '</body>',
      `<script>${hardcodedPermissionsScript}</script>\n</body>`
    );
    
    // Write updated index.html
    fs.writeFileSync(indexPath, indexContent);
    
    console.log('[Hardcoded Permissions Fix] Script injected into index.html');
  } catch (error) {
    console.error('[Hardcoded Permissions Fix] Error injecting script:', error);
  }
}

// Run the script
injectHardcodedPermissionsScript().then(() => {
  console.log('[Hardcoded Permissions Fix] Completed');
}).catch(error => {
  console.error('[Hardcoded Permissions Fix] Fatal error:', error);
  process.exit(1);
});
