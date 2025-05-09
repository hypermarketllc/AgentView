/**
 * inject-mime-fix.js
 * 
 * This script injects the MIME type fix script into the HTML served by the application.
 * It modifies the HTML to include the fix-mime-types.mjs script before any other scripts.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Injects the MIME type fix script into the HTML
 * @param {string} html - The HTML content to modify
 * @returns {string} - The modified HTML content
 */
export function injectMimeFix(html) {
  // Create script tag for the MIME type fix
  const scriptTag = `
    <script type="module">
      // Inline MIME type fix to ensure it runs before any other scripts
      (function() {
        // Patch fetch to fix MIME type issues
        const originalFetch = window.fetch;
        
        window.fetch = async function(...args) {
          const response = await originalFetch.apply(this, args);
          
          // Clone response to avoid consuming it
          const clone = response.clone();
          
          // Only process JavaScript files
          const url = clone.url || args[0];
          if (typeof url === 'string' && url.endsWith('.js')) {
            // Create a new response with the correct MIME type
            return new Response(await clone.text(), {
              status: response.status,
              statusText: response.statusText,
              headers: new Headers({
                ...Object.fromEntries([...response.headers.entries()]),
                'Content-Type': 'application/javascript'
              })
            });
          }
          
          return response;
        };
        
        console.log('✅ Patched fetch to fix MIME type issues');
      })();
    </script>
  `;
  
  // Insert the script tag before the closing head tag
  return html.replace('</head>', `${scriptTag}</head>`);
}

/**
 * Modifies the HTML file to include the MIME type fix
 * @param {string} htmlPath - Path to the HTML file
 * @returns {boolean} - Whether the modification was successful
 */
export function modifyHtmlFile(htmlPath) {
  try {
    // Read the HTML file
    const html = fs.readFileSync(htmlPath, 'utf8');
    
    // Inject the MIME type fix
    const modifiedHtml = injectMimeFix(html);
    
    // Write the modified HTML back to the file
    fs.writeFileSync(htmlPath, modifiedHtml);
    
    console.log(`✅ Successfully injected MIME type fix into ${htmlPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error modifying HTML file ${htmlPath}:`, error);
    return false;
  }
}

/**
 * Creates a middleware function that injects the MIME type fix into HTML responses
 * and handles JavaScript MIME types
 * @returns {Function} - Express middleware function
 */
export function createMimeFixMiddleware() {
  return function(req, res, next) {
    // Store the original send function
    const originalSend = res.send;
    
    // Override the send function
    res.send = function(body) {
      // Only modify HTML responses
      if (typeof body === 'string' && body.includes('<!DOCTYPE html>')) {
        // Inject the MIME type fix
        body = injectMimeFix(body);
      }
      
      // Call the original send function with the modified body
      return originalSend.call(this, body);
    };
    
    // Handle JavaScript files
    const url = req.url || req.originalUrl || '';
    if (url.endsWith('.js') || url.includes('/assets/') && url.includes('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      console.log(`MIME fix middleware: Set Content-Type for ${url} to application/javascript`);
    }
    
    next();
  };
}

/**
 * Creates a direct middleware to fix MIME types for all JavaScript files
 * @returns {Function} - Express middleware function
 */
export function createDirectMimeTypeMiddleware() {
  return function(req, res, next) {
    const url = req.url || req.originalUrl || '';
    
    // Handle all JavaScript files
    if (url.endsWith('.js') || url.includes('/assets/') && url.includes('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      console.log(`Direct MIME fix: Set Content-Type for ${url} to application/javascript`);
    }
    
    next();
  };
}

// Export the functions
export default {
  injectMimeFix,
  modifyHtmlFile,
  createMimeFixMiddleware
};
