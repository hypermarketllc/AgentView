/**
 * Script to fix position token handling in the frontend
 * This ensures positions are properly fetched with the token after login
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('[Position Token Handling Fix] Starting...');

// Define the script to inject into the frontend
const positionTokenHandlingScript = `
// Position Token Handling Fix
(function() {
  console.log('[Position Token Handling Fix] Initializing...');
  
  // Function to get token from localStorage
  function getToken() {
    try {
      return localStorage.getItem('token') || '';
    } catch (error) {
      console.error('[Position Token Handling Fix] Error getting token:', error);
      return '';
    }
  }
  
  // Function to fetch positions with token
  async function fetchPositionsWithToken() {
    try {
      console.log('[Position Token Handling Fix] Fetching positions with token...');
      
      // Get token
      const token = getToken();
      if (!token) {
        console.log('[Position Token Handling Fix] No token available, skipping position fetch');
        return null;
      }
      
      // Prepare headers with token
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${token}\`
      };
      
      // Make API request to positions endpoint
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
      console.log('[Position Token Handling Fix] Successfully fetched positions:', positions);
      
      // Store positions in global variable and localStorage
      window.positionsData = positions;
      try {
        localStorage.setItem('positionsData', JSON.stringify(positions));
      } catch (error) {
        console.error('[Position Token Handling Fix] Error storing positions in localStorage:', error);
      }
      
      return positions;
    } catch (error) {
      console.error('[Position Token Handling Fix] Error fetching positions:', error);
      return null;
    }
  }
  
  // Function to get position by ID
  function getPositionById(positionId) {
    // Try to get from global variable
    if (window.positionsData && Array.isArray(window.positionsData)) {
      const position = window.positionsData.find(p => p.id === positionId);
      if (position) {
        return position;
      }
    }
    
    // Try to get from localStorage
    try {
      const positionsData = localStorage.getItem('positionsData');
      if (positionsData) {
        const positions = JSON.parse(positionsData);
        const position = positions.find(p => p.id === positionId);
        if (position) {
          return position;
        }
      }
    } catch (error) {
      console.error('[Position Token Handling Fix] Error getting position from localStorage:', error);
    }
    
    // Return default position if not found
    return {
      id: positionId || 1,
      name: positionId === 6 ? 'Admin' : 'Agent',
      level: positionId === 6 ? 6 : 1,
      is_admin: positionId === 6,
      permissions: positionId === 6 ? {
        dashboard: { view: true, edit: true, create: true, delete: true },
        "post-deal": { view: true, edit: true, create: true, delete: true },
        book: { view: true, edit: true, create: true, delete: true },
        agents: { view: true, edit: true, create: true, delete: true },
        configuration: { view: true, edit: true, create: true, delete: true },
        monitoring: { view: true, edit: true, create: true, delete: true },
        settings: { view: true, edit: true, create: true, delete: true },
        analytics: { view: true, edit: true, create: true, delete: true },
        users: { view: true, edit: true, create: true, delete: true }
      } : {
        dashboard: { view: true },
        "post-deal": { view: true, edit: true, create: true },
        book: { view: true, edit: true },
        settings: { view: true, edit: true }
      }
    };
  }
  
  // Function to patch position fetching
  function patchPositionFetching() {
    console.log('[Position Token Handling Fix] Patching position fetching...');
    
    // Override global getPositionById function if it exists
    if (typeof window.getPositionById === 'function') {
      const originalGetPositionById = window.getPositionById;
      window.getPositionById = function(positionId) {
        const position = getPositionById(positionId);
        if (position) {
          return position;
        }
        return originalGetPositionById(positionId);
      };
      console.log('[Position Token Handling Fix] Patched global getPositionById function');
    } else {
      // Add global getPositionById function if it doesn't exist
      window.getPositionById = getPositionById;
      console.log('[Position Token Handling Fix] Added global getPositionById function');
    }
    
    // Add global fetchPositionsWithToken function
    window.fetchPositionsWithToken = fetchPositionsWithToken;
    console.log('[Position Token Handling Fix] Added global fetchPositionsWithToken function');
  }
  
  // Function to patch API calls
  function patchApiCalls() {
    console.log('[Position Token Handling Fix] Patching API calls...');
    
    // Override fetch to add token to position API calls
    const originalFetch = window.fetch;
    window.fetch = async function(url, options = {}) {
      // If this is a positions API call
      if (typeof url === 'string' && url.includes('/api/positions')) {
        console.log('[Position Token Handling Fix] Intercepted positions API call');
        
        // Get token
        const token = getToken();
        
        // Add token to headers if available
        if (token) {
          options.headers = options.headers || {};
          options.headers['Authorization'] = \`Bearer \${token}\`;
          console.log('[Position Token Handling Fix] Added token to positions API call');
        }
      }
      
      // Call original fetch
      return originalFetch.apply(this, arguments);
    };
    
    console.log('[Position Token Handling Fix] Patched fetch for position API calls');
  }
  
  // Function to patch user object
  function patchUserObject() {
    console.log('[Position Token Handling Fix] Patching user object...');
    
    // Override Object.defineProperty to intercept user object
    const originalDefineProperty = Object.defineProperty;
    Object.defineProperty = function(obj, prop, descriptor) {
      // If this is setting a user property
      if (prop === 'user' && descriptor && descriptor.value) {
        console.log('[Position Token Handling Fix] Intercepted user object assignment');
        
        // Get user object
        const user = descriptor.value;
        
        // If user has position_id but no position
        if (user && user.position_id && !user.position) {
          console.log('[Position Token Handling Fix] User has position_id but no position, fetching position');
          
          // Get position
          const position = getPositionById(user.position_id);
          
          // Add position to user
          if (position) {
            user.position = position;
            console.log('[Position Token Handling Fix] Added position to user object');
          }
        }
      }
      
      // Call original defineProperty
      return originalDefineProperty.apply(this, arguments);
    };
    
    console.log('[Position Token Handling Fix] Patched Object.defineProperty for user object');
  }
  
  // Function to setup event listeners
  function setupEventListeners() {
    console.log('[Position Token Handling Fix] Setting up event listeners...');
    
    // Listen for token changes
    window.addEventListener('storage', function(event) {
      if (event.key === 'token' && event.newValue) {
        console.log('[Position Token Handling Fix] Token changed, fetching positions...');
        fetchPositionsWithToken();
      }
    });
    
    // Listen for login events
    document.addEventListener('login', function() {
      console.log('[Position Token Handling Fix] Login event detected, fetching positions...');
      fetchPositionsWithToken();
    });
    
    // Fetch positions on page load
    window.addEventListener('load', function() {
      console.log('[Position Token Handling Fix] Page loaded, fetching positions...');
      setTimeout(fetchPositionsWithToken, 1000);
    });
    
    // Intercept login API calls
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
            console.log('[Position Token Handling Fix] Login successful, fetching positions...');
            setTimeout(fetchPositionsWithToken, 1000);
            
            // Dispatch login event
            document.dispatchEvent(new Event('login'));
          }
        } catch (error) {
          // Ignore errors
        }
      }
      
      return result;
    };
    
    console.log('[Position Token Handling Fix] Event listeners set up');
  }
  
  // Apply all patches
  function applyPatches() {
    // Patch position fetching
    patchPositionFetching();
    
    // Patch API calls
    patchApiCalls();
    
    // Patch user object
    patchUserObject();
    
    // Setup event listeners
    setupEventListeners();
    
    // Fetch positions immediately
    fetchPositionsWithToken();
    
    console.log('[Position Token Handling Fix] All patches applied');
  }
  
  // Apply patches when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyPatches);
  } else {
    applyPatches();
  }
  
  console.log('[Position Token Handling Fix] Initialization complete');
})();
`;

// Function to inject the script into index.html
async function injectPositionTokenHandlingScript() {
  try {
    // Path to index.html
    const indexPath = join(__dirname, '..', 'index.html');
    
    // Check if index.html exists
    if (!fs.existsSync(indexPath)) {
      console.error('[Position Token Handling Fix] index.html not found');
      return;
    }
    
    // Read index.html
    let indexContent = fs.readFileSync(indexPath, 'utf8');
    
    // Check if script is already injected
    if (indexContent.includes('[Position Token Handling Fix]')) {
      console.log('[Position Token Handling Fix] Script already injected, skipping');
      return;
    }
    
    // Inject script before closing body tag
    indexContent = indexContent.replace(
      '</body>',
      `<script>${positionTokenHandlingScript}</script>\n</body>`
    );
    
    // Write updated index.html
    fs.writeFileSync(indexPath, indexContent);
    
    console.log('[Position Token Handling Fix] Script injected into index.html');
  } catch (error) {
    console.error('[Position Token Handling Fix] Error injecting script:', error);
  }
}

// Run the script
injectPositionTokenHandlingScript().then(() => {
  console.log('[Position Token Handling Fix] Completed');
}).catch(error => {
  console.error('[Position Token Handling Fix] Fatal error:', error);
  process.exit(1);
});
