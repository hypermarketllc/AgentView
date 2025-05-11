/**
 * Script to fix frontend token handling
 * This script creates a patch for the frontend to properly handle authentication tokens
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the frontend index.html file
const indexHtmlPath = path.join(__dirname, '..', 'dist', 'index.html');

// Function to create the token handling fix script
function createTokenFixScript() {
  return `
<script>
// Enhanced Token Handling Fix
(function() {
  console.log('%c[Auth Fix] Applying enhanced token handling fix...', 'color: #4CAF50; font-weight: bold');
  
  // Debug mode - set to true for verbose logging
  const DEBUG = true;
  
  // Store the original fetch function
  const originalFetch = window.fetch;
  
  // Function to safely parse JSON
  function safeJsonParse(text) {
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('[Auth Fix] JSON parse error:', e);
      return null;
    }
  }
  
  // Function to handle token storage
  function storeToken(token) {
    if (!token) {
      console.error('[Auth Fix] Attempted to store null/undefined token');
      return false;
    }
    
    try {
      // Store in multiple locations for redundancy
      localStorage.setItem('auth_token', token);
      sessionStorage.setItem('auth_token', token);
      
      // Also try to store in a cookie for maximum compatibility
      document.cookie = 'auth_token=' + token + '; path=/; max-age=86400'; // 24 hours
      
      console.log('%c[Auth Fix] Token stored successfully in multiple locations', 'color: #4CAF50');
      return true;
    } catch (e) {
      console.error('[Auth Fix] Error storing token:', e);
      return false;
    }
  }
  
  // Function to get token from storage
  function getToken() {
    try {
      // Try localStorage first
      let token = localStorage.getItem('auth_token');
      
      // If not in localStorage, try sessionStorage
      if (!token) {
        token = sessionStorage.getItem('auth_token');
        if (token) {
          if (DEBUG) console.log('[Auth Fix] Token retrieved from sessionStorage');
          // Restore to localStorage if possible
          try {
            localStorage.setItem('auth_token', token);
          } catch (e) {
            console.warn('[Auth Fix] Could not restore token to localStorage');
          }
        }
      } else {
        if (DEBUG) console.log('[Auth Fix] Token retrieved from localStorage');
      }
      
      // If still no token, try cookies
      if (!token) {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          if (cookie.startsWith('auth_token=')) {
            token = cookie.substring('auth_token='.length);
            if (DEBUG) console.log('[Auth Fix] Token retrieved from cookie');
            break;
          }
        }
      }
      
      return token;
    } catch (e) {
      console.error('[Auth Fix] Error retrieving token:', e);
      return null;
    }
  }
  
  // Function to check if URL is an API URL
  function isApiUrl(url) {
    return url.includes('/api/') || url.includes('/crm/api/');
  }
  
  // Function to extract token from login response
  function extractTokenFromLoginResponse(response) {
    return new Promise((resolve) => {
      const clonedResponse = response.clone();
      
      clonedResponse.text().then(text => {
        if (!text) {
          console.error('[Auth Fix] Empty response body');
          resolve(null);
          return;
        }
        
        const data = safeJsonParse(text);
        if (!data) {
          console.error('[Auth Fix] Invalid JSON in response');
          resolve(null);
          return;
        }
        
        if (data.user && data.user.token) {
          console.log('%c[Auth Fix] Token found in response', 'color: #2196F3');
          resolve(data.user.token);
        } else if (data.token) {
          // Alternative token location
          console.log('%c[Auth Fix] Token found directly in response', 'color: #2196F3');
          resolve(data.token);
        } else if (data.data && data.data.token) {
          // Another alternative token location
          console.log('%c[Auth Fix] Token found in data.token', 'color: #2196F3');
          resolve(data.data.token);
        } else {
          console.warn('[Auth Fix] No token found in response:', data);
          resolve(null);
        }
      }).catch(err => {
        console.error('[Auth Fix] Error reading response:', err);
        resolve(null);
      });
    });
  }
  
  // Override fetch to automatically include the token
  window.fetch = function(url, options = {}) {
    // Initialize options and headers if they don't exist
    options = options || {};
    options.headers = options.headers || {};
    
    // Get the token from storage
    const token = getToken();
    
    // If we have a token and this is an API request, add the Authorization header
    if (token && isApiUrl(url)) {
      // Add the Authorization header with the token
      options.headers['Authorization'] = 'Bearer ' + token;
      if (DEBUG) console.log('[Auth Fix] Added token to request:', url.substring(0, 50) + (url.length > 50 ? '...' : ''));
    } else if (isApiUrl(url) && !options.headers['Authorization']) {
      console.warn('[Auth Fix] No token available for API request:', url);
    }
    
    // Call the original fetch function
    return originalFetch(url, options)
      .then(response => {
        // If this is a login request and it was successful, save the token
        if (url.includes('/login') && response.ok) {
          extractTokenFromLoginResponse(response).then(token => {
            if (token) {
              storeToken(token);
              // Dispatch an event to notify the application that authentication state has changed
              window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { authenticated: true } }));
            }
          });
        }
        
        return response;
      })
      .catch(error => {
        console.error('[Auth Fix] Fetch error:', error, 'for URL:', url);
        throw error;
      });
  };
  
  // Also handle Axios if it's being used
  if (window.axios) {
    console.log('[Auth Fix] Axios detected, adding interceptors');
    
    // Request interceptor
    window.axios.interceptors.request.use(
      config => {
        const token = getToken();
        if (token && isApiUrl(config.url)) {
          config.headers['Authorization'] = 'Bearer ' + token;
          if (DEBUG) console.log('[Auth Fix] Added token to axios request:', config.url);
        }
        return config;
      },
      error => {
        console.error('[Auth Fix] Axios request error:', error);
        return Promise.reject(error);
      }
    );
    
    // Response interceptor
    window.axios.interceptors.response.use(
      response => {
        if (response.config.url.includes('/login') && response.status === 200) {
          if (response.data && response.data.user && response.data.user.token) {
            storeToken(response.data.user.token);
            window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { authenticated: true } }));
          }
        }
        return response;
      },
      error => {
        console.error('[Auth Fix] Axios response error:', error);
        return Promise.reject(error);
      }
    );
  }
  
  // Function to create a manual token injection UI
  function createTokenInjectionUI() {
    // Create a floating button that expands to a form
    const button = document.createElement('div');
    button.style.position = 'fixed';
    button.style.bottom = '20px';
    button.style.right = '20px';
    button.style.width = '50px';
    button.style.height = '50px';
    button.style.borderRadius = '50%';
    button.style.backgroundColor = '#2196F3';
    button.style.color = 'white';
    button.style.display = 'flex';
    button.style.justifyContent = 'center';
    button.style.alignItems = 'center';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
    button.style.zIndex = '9999';
    button.style.fontSize = '24px';
    button.innerHTML = '🔑';
    button.title = 'Auth Token Tool';
    
    // Create the form container (initially hidden)
    const form = document.createElement('div');
    form.style.position = 'fixed';
    form.style.bottom = '80px';
    form.style.right = '20px';
    form.style.width = '300px';
    form.style.padding = '15px';
    form.style.backgroundColor = 'white';
    form.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    form.style.borderRadius = '5px';
    form.style.display = 'none';
    form.style.zIndex = '9999';
    
    form.innerHTML = \`
      <h3 style="margin-top: 0; color: #2196F3;">Auth Token Tool</h3>
      <div style="margin-bottom: 10px;">
        <label style="display: block; margin-bottom: 5px;">Current Token:</label>
        <textarea id="current-token" style="width: 100%; height: 60px; margin-bottom: 10px;"></textarea>
      </div>
      <div style="margin-bottom: 10px;">
        <label style="display: block; margin-bottom: 5px;">New Token:</label>
        <textarea id="new-token" style="width: 100%; height: 60px;"></textarea>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <button id="save-token" style="background-color: #4CAF50; color: white; border: none; padding: 8px 15px; border-radius: 3px; cursor: pointer;">Save Token</button>
        <button id="clear-token" style="background-color: #f44336; color: white; border: none; padding: 8px 15px; border-radius: 3px; cursor: pointer;">Clear Token</button>
        <button id="close-form" style="background-color: #9e9e9e; color: white; border: none; padding: 8px 15px; border-radius: 3px; cursor: pointer;">Close</button>
      </div>
    \`;
    
    // Add the elements to the DOM
    document.body.appendChild(button);
    document.body.appendChild(form);
    
    // Toggle form visibility when button is clicked
    button.addEventListener('click', function() {
      if (form.style.display === 'none') {
        form.style.display = 'block';
        // Update current token display
        document.getElementById('current-token').value = getToken() || '';
      } else {
        form.style.display = 'none';
      }
    });
    
    // Handle save token button
    document.getElementById('save-token').addEventListener('click', function() {
      const newToken = document.getElementById('new-token').value.trim();
      if (newToken) {
        storeToken(newToken);
        document.getElementById('current-token').value = newToken;
        document.getElementById('new-token').value = '';
        alert('Token saved successfully!');
        // Dispatch event to notify the application
        window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { authenticated: true } }));
      } else {
        alert('Please enter a token to save');
      }
    });
    
    // Handle clear token button
    document.getElementById('clear-token').addEventListener('click', function() {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      document.getElementById('current-token').value = '';
      document.getElementById('new-token').value = '';
      alert('Token cleared successfully!');
      // Dispatch event to notify the application
      window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { authenticated: false } }));
    });
    
    // Handle close button
    document.getElementById('close-form').addEventListener('click', function() {
      form.style.display = 'none';
    });
    
    console.log('[Auth Fix] Token injection UI created');
  }
  
  // Function to attach listeners to login forms
  function attachLoginFormListeners() {
    // Wait for the DOM to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', findAndAttachToForms);
    } else {
      findAndAttachToForms();
    }
    
    // Also set up a mutation observer to watch for dynamically added forms
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
          findAndAttachToForms();
        }
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    function findAndAttachToForms() {
      // Look for forms that might be login forms
      const forms = document.querySelectorAll('form');
      forms.forEach(function(form) {
        // Check if this form has password fields (likely a login form)
        const passwordFields = form.querySelectorAll('input[type="password"]');
        const emailFields = form.querySelectorAll('input[type="email"], input[type="text"][name*="email"], input[type="text"][placeholder*="email"]');
        
        if (passwordFields.length > 0 && (emailFields.length > 0 || form.innerHTML.toLowerCase().includes('login') || form.innerHTML.toLowerCase().includes('sign in'))) {
          console.log('[Auth Fix] Found potential login form:', form);
          
          // Only attach if we haven't already
          if (!form.dataset.authFixAttached) {
            form.dataset.authFixAttached = 'true';
            
            form.addEventListener('submit', function(event) {
              console.log('[Auth Fix] Login form submitted');
              
              // We don't prevent default because we want the normal login flow to happen
              // Just log that we detected a login attempt
              const formData = new FormData(form);
              const formDataObj = {};
              formData.forEach((value, key) => {
                // Don't log password values
                if (key.toLowerCase().includes('password')) {
                  formDataObj[key] = '********';
                } else {
                  formDataObj[key] = value;
                }
              });
              
              console.log('[Auth Fix] Login attempt with data:', formDataObj);
            });
          }
        }
      });
      
      // Also look for login buttons that might not be in forms
      const loginButtons = Array.from(document.querySelectorAll('button, a, div, span'))
        .filter(el => {
          const text = el.textContent.toLowerCase();
          return text.includes('login') || text.includes('sign in') || text.includes('log in');
        });
      
      loginButtons.forEach(function(button) {
        if (!button.dataset.authFixAttached) {
          button.dataset.authFixAttached = 'true';
          
          button.addEventListener('click', function() {
            console.log('[Auth Fix] Login button clicked:', button);
          });
        }
      });
    }
  }
  
  // Check if we already have a token in storage
  const existingToken = getToken();
  if (existingToken) {
    console.log('%c[Auth Fix] Found existing token in storage', 'color: #2196F3');
    // Dispatch an event to notify the application that we already have authentication
    window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { authenticated: true } }));
  } else {
    console.log('[Auth Fix] No existing token found');
  }
  
  // Add a global error handler to catch any unhandled errors
  window.addEventListener('error', function(event) {
    console.error('[Auth Fix] Unhandled error:', event.error);
  });
  
  // Wait for the DOM to be ready before adding the token injection UI
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      createTokenInjectionUI();
      attachLoginFormListeners();
    });
  } else {
    setTimeout(function() {
      createTokenInjectionUI();
      attachLoginFormListeners();
    }, 500); // Small delay to ensure the DOM is fully processed
  }
  
  console.log('%c[Auth Fix] Enhanced token handling fix applied successfully', 'color: #4CAF50; font-weight: bold');
})();
</script>
  `;
}

// Function to inject the fix script into the index.html file
function injectFixScript() {
  try {
    // Read the index.html file
    const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    
    // Check if the fix has already been applied
    if (indexHtml.includes('[Auth Fix] Applying enhanced token handling fix')) {
      console.log('Enhanced token handling fix already applied to index.html');
      return;
    }
    
    // Create the fix script
    const fixScript = createTokenFixScript();
    
    // Inject the script at the beginning of the <head> tag for earlier execution
    const headTagIndex = indexHtml.indexOf('<head>');
    if (headTagIndex === -1) {
      console.error('Could not find <head> tag in index.html');
      return;
    }
    
    const modifiedHtml = indexHtml.slice(0, headTagIndex + 6) + 
                         '\n' + fixScript + '\n' + 
                         indexHtml.slice(headTagIndex + 6);
    
    // Write the modified HTML back to the file
    fs.writeFileSync(indexHtmlPath, modifiedHtml);
    
    console.log('Enhanced token handling fix successfully injected at the beginning of <head> in index.html');
  } catch (error) {
    console.error('Error injecting token handling fix:', error);
  }
}

// Execute the injection
injectFixScript();
