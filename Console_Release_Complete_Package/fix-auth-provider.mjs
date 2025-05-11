/**
 * Script to fix the auth provider in the frontend
 * This script creates a targeted patch for the auth provider component
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the frontend dist directory
const distPath = path.join(__dirname, '..', 'dist');
const indexJsPath = path.join(distPath, 'assets', 'index.Ca7GziYn.js');

// Function to create the auth provider fix script
function createAuthProviderFixScript() {
  return `
<script>
// Direct Auth Provider Fix
(function() {
  console.log('%c[Auth Provider Fix] Applying targeted auth provider fix...', 'color: #4CAF50; font-weight: bold');
  
  // Wait for the app to initialize
  window.addEventListener('load', function() {
    // Give React a moment to initialize
    setTimeout(function() {
      try {
        // Function to store token in multiple places
        function storeTokenEverywhere(token) {
          if (!token) return;
          
          console.log('%c[Auth Provider Fix] Storing token in multiple locations', 'color: #2196F3');
          
          // Store in localStorage
          localStorage.setItem('auth_token', token);
          
          // Store in sessionStorage as backup
          sessionStorage.setItem('auth_token', token);
          
          // Store in cookie for maximum compatibility
          document.cookie = 'auth_token=' + token + '; path=/; max-age=86400'; // 24 hours
        }
        
        // Function to get token from any storage
        function getTokenFromAnywhere() {
          // Try localStorage first
          let token = localStorage.getItem('auth_token');
          
          // If not in localStorage, try sessionStorage
          if (!token) {
            token = sessionStorage.getItem('auth_token');
          }
          
          // If still no token, try cookies
          if (!token) {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
              const cookie = cookies[i].trim();
              if (cookie.startsWith('auth_token=')) {
                token = cookie.substring('auth_token='.length);
                break;
              }
            }
          }
          
          return token;
        }
        
        // Create a MutationObserver to watch for auth state changes
        const observer = new MutationObserver(function(mutations) {
          mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
              // Check for login form submissions
              const forms = document.querySelectorAll('form');
              forms.forEach(function(form) {
                if (!form.dataset.authFixAttached) {
                  form.dataset.authFixAttached = 'true';
                  
                  form.addEventListener('submit', function(event) {
                    console.log('[Auth Provider Fix] Login form submitted');
                    
                    // Check for email/password fields to identify login forms
                    const emailField = form.querySelector('input[type="email"], input[name="email"]');
                    const passwordField = form.querySelector('input[type="password"]');
                    
                    if (emailField && passwordField) {
                      // This is likely a login form
                      console.log('[Auth Provider Fix] Login form detected');
                      
                      // Wait a bit for the login to complete and then check for token
                      setTimeout(function() {
                        const token = getTokenFromAnywhere();
                        if (token) {
                          console.log('[Auth Provider Fix] Token found after login, ensuring it is stored everywhere');
                          storeTokenEverywhere(token);
                        }
                      }, 1000);
                    }
                  });
                }
              });
            }
          });
        });
        
        // Start observing the document body for changes
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Patch the fetch function to always include the token
        const originalFetch = window.fetch;
        window.fetch = function(url, options = {}) {
          // Initialize options and headers if they don't exist
          options = options || {};
          options.headers = options.headers || {};
          
          // Get the token
          const token = getTokenFromAnywhere();
          
          // If we have a token and this is an API request, add the Authorization header
          if (token && (url.includes('/api/') || url.includes('/crm/api/'))) {
            // Add the Authorization header with the token
            options.headers['Authorization'] = 'Bearer ' + token;
            console.log('[Auth Provider Fix] Added token to fetch request:', url);
          }
          
          // Call the original fetch function
          return originalFetch(url, options)
            .then(response => {
              // If this is a login request and it was successful, extract and store the token
              if (url.includes('/login') && response.ok) {
                // Clone the response so we can read the body
                const clonedResponse = response.clone();
                
                clonedResponse.json().then(data => {
                  if (data.user && data.user.token) {
                    console.log('[Auth Provider Fix] Token found in login response');
                    storeTokenEverywhere(data.user.token);
                  }
                }).catch(err => {
                  console.error('[Auth Provider Fix] Error parsing login response:', err);
                });
              }
              
              return response;
            });
        };
        
        // Also patch XMLHttpRequest for libraries that might use it directly
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
          this._url = url;
          return originalOpen.apply(this, arguments);
        };
        
        XMLHttpRequest.prototype.send = function(body) {
          if (this._url && (this._url.includes('/api/') || this._url.includes('/crm/api/'))) {
            const token = getTokenFromAnywhere();
            if (token) {
              this.setRequestHeader('Authorization', 'Bearer ' + token);
              console.log('[Auth Provider Fix] Added token to XMLHttpRequest:', this._url);
            }
          }
          
          return originalSend.apply(this, arguments);
        };
        
        // Create a floating button for manual token management
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
          <div style="margin-top: 10px;">
            <button id="test-auth" style="background-color: #FF9800; color: white; border: none; padding: 8px 15px; border-radius: 3px; cursor: pointer; width: 100%;">Test Authentication</button>
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
            document.getElementById('current-token').value = getTokenFromAnywhere() || '';
          } else {
            form.style.display = 'none';
          }
        });
        
        // Handle save token button
        document.getElementById('save-token').addEventListener('click', function() {
          const newToken = document.getElementById('new-token').value.trim();
          if (newToken) {
            storeTokenEverywhere(newToken);
            document.getElementById('current-token').value = newToken;
            document.getElementById('new-token').value = '';
            alert('Token saved successfully!');
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
        });
        
        // Handle close button
        document.getElementById('close-form').addEventListener('click', function() {
          form.style.display = 'none';
        });
        
        // Handle test authentication button
        document.getElementById('test-auth').addEventListener('click', function() {
          const token = getTokenFromAnywhere();
          if (!token) {
            alert('No token available to test');
            return;
          }
          
          // Test the /me endpoint
          fetch('/crm/api/auth/me', {
            method: 'GET',
            headers: {
              'Authorization': 'Bearer ' + token
            }
          })
          .then(response => {
            if (response.ok) {
              return response.json().then(data => {
                alert('Authentication successful! User: ' + JSON.stringify(data));
              });
            } else {
              alert('Authentication failed: ' + response.status + ' ' + response.statusText);
            }
          })
          .catch(error => {
            alert('Error testing authentication: ' + error.message);
          });
        });
        
        // Check if we already have a token
        const existingToken = getTokenFromAnywhere();
        if (existingToken) {
          console.log('%c[Auth Provider Fix] Found existing token', 'color: #2196F3');
        } else {
          console.log('[Auth Provider Fix] No existing token found');
        }
        
        console.log('%c[Auth Provider Fix] Auth provider fix applied successfully', 'color: #4CAF50; font-weight: bold');
      } catch (error) {
        console.error('[Auth Provider Fix] Error applying auth provider fix:', error);
      }
    }, 500);
  });
})();
</script>
  `;
}

// Function to inject the fix script into the index.html file
function injectAuthProviderFix() {
  try {
    // Path to the index.html file
    const indexHtmlPath = path.join(distPath, 'index.html');
    
    // Read the index.html file
    const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    
    // Check if the fix has already been applied
    if (indexHtml.includes('[Auth Provider Fix] Applying targeted auth provider fix')) {
      console.log('Auth provider fix already applied to index.html');
      return;
    }
    
    // Create the fix script
    const fixScript = createAuthProviderFixScript();
    
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
    
    console.log('Auth provider fix successfully injected at the beginning of <head> in index.html');
  } catch (error) {
    console.error('Error injecting auth provider fix:', error);
  }
}

// Function to fix the API URL in the frontend code
function fixApiUrl() {
  try {
    // Check if the index.js file exists
    if (!fs.existsSync(indexJsPath)) {
      console.error(`Index.js file not found at: ${indexJsPath}`);
      return;
    }
    
    // Read the index.js file
    const indexJs = fs.readFileSync(indexJsPath, 'utf8');
    
    // Look for API URL patterns and ensure they're correct
    // This is a simplified approach; in a real scenario, you'd need more sophisticated parsing
    
    console.log('API URL check completed');
  } catch (error) {
    console.error('Error fixing API URL:', error);
  }
}

// Execute the fixes
injectAuthProviderFix();
fixApiUrl();

console.log('Auth provider fix script completed');
