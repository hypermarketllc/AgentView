# MIME Type Fix Technical Documentation

## Technical Overview

This document provides a detailed technical explanation of the MIME type fixes implemented to address issues when migrating from Supabase to PostgreSQL. It's intended for developers who need to maintain or extend the code.

## Problem Analysis

### MIME Type Error Details

Modern browsers enforce strict MIME type checking for ES modules, requiring them to be served with the `application/javascript` MIME type. When the server responds with an incorrect MIME type (such as `text/html`), browsers reject the module with an error:

```
Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "text/html". Strict MIME type checking is enforced for module scripts per HTML spec.
```

This error occurs in several scenarios:

1. When the server doesn't explicitly set the Content-Type header for JavaScript files
2. When the server sets an incorrect Content-Type header
3. When middleware or other server components override the correct Content-Type header

### Root Causes in Our Application

1. **Express Static File Serving**: The default Express static file server wasn't explicitly setting the correct MIME type for JavaScript modules.
2. **Route Handling**: Custom route handlers for assets weren't consistently setting the correct MIME type.
3. **SPA Fallback**: The SPA fallback route was sending HTML content for requests that should have received JavaScript.

## Technical Solution

### 1. `inject-mime-fix.js` Implementation

This file implements a comprehensive solution with three layers of protection:

#### Client-Side MIME Type Patching

```javascript
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
```

This function:
1. Creates a script tag containing code that patches the `fetch` API
2. The patch intercepts fetch responses for JavaScript files
3. It creates a new Response object with the correct MIME type
4. The script is injected into the HTML before the closing `</head>` tag

#### HTML Response Modification Middleware

```javascript
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
```

This middleware:
1. Overrides the `res.send` method to intercept responses
2. Injects the MIME type fix into HTML responses
3. Sets the correct Content-Type header for JavaScript files
4. Logs the Content-Type setting for debugging

#### Direct MIME Type Middleware

```javascript
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
```

This middleware:
1. Directly sets the Content-Type header for all JavaScript files
2. Uses pattern matching to identify JavaScript files in various locations
3. Logs the Content-Type setting for debugging

### 2. Server Integration

The server integrates these fixes at multiple levels:

#### Middleware Integration

```javascript
import { createMimeFixMiddleware, createDirectMimeTypeMiddleware, injectMimeFix } from './inject-mime-fix.js';

// Middleware
app.use(cors());
app.use(express.json());
app.use(createMimeFixMiddleware()); // Add MIME type fix middleware
app.use(createDirectMimeTypeMiddleware()); // Add direct MIME type middleware for all JavaScript files
```

#### Static File Serving Enhancement

```javascript
// Serve static files with proper MIME types
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, filePath) => {
    // Handle JavaScript files - both regular and module scripts
    if (filePath.endsWith('.js') || filePath.includes('assets/index') && filePath.includes('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (filePath.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    } else if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
    
    // Log the file path and content type for debugging
    console.log(`Serving ${filePath} with Content-Type: ${res.getHeader('Content-Type')}`);
  }
}));
```

#### Asset Route Handling

```javascript
// Ensure all routes under /crm/assets are properly handled
app.get('/crm/assets/*', (req, res, next) => {
  const assetPath = req.path.replace('/crm', '');
  const filePath = path.join(__dirname, 'dist', assetPath);
  
  console.log(`Asset request: ${req.path} -> ${filePath}`);
  
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    // Handle JavaScript files - both regular and module scripts
    if (ext === '.js' || ext === '.mjs' || filePath.includes('assets/index') && filePath.includes('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      console.log(`Setting Content-Type for ${filePath}: application/javascript`);
    } else if (ext === '.css') {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
      console.log(`Setting Content-Type for ${filePath}: text/css`);
    }
    
    // Log the final content type being sent
    console.log(`Final Content-Type for ${filePath}: ${res.getHeader('Content-Type')}`);
    
    res.sendFile(filePath);
  } else {
    console.log(`File not found: ${filePath}`);
    next();
  }
});
```

#### Special JavaScript Module Handling

```javascript
// Special handler for module scripts to ensure proper MIME type
app.get('/crm/assets/*.js', (req, res, next) => {
  if (res.headersSent) {
    return next();
  }
  
  const assetPath = req.path.replace('/crm', '');
  const filePath = path.join(__dirname, 'dist', assetPath);
  
  console.log(`JavaScript module request: ${req.path} -> ${filePath}`);
  
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    console.log(`Explicitly setting Content-Type for JS module: application/javascript`);
    res.sendFile(filePath);
  } else {
    console.log(`JS module file not found: ${filePath}`);
    next();
  }
});
```

#### HTML Modification

```javascript
// Read the index.html file
const indexPath = path.join(__dirname, 'dist', 'index.html');
let indexHtml = '';

try {
  indexHtml = fs.readFileSync(indexPath, 'utf8');
  console.log('Successfully read index.html');
  
  // Inject the MIME fix into the HTML
  indexHtml = injectMimeFix(indexHtml);
  console.log('Successfully injected MIME fix into index.html');
} catch (err) {
  console.error('Error reading or modifying index.html:', err);
  indexHtml = '<!DOCTYPE html><html><body><h1>Error loading application</h1></body></html>';
}
```

### 3. Run Scripts Implementation

#### Node.js Script (`run-fixed-postgres-docker.js`)

```javascript
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if required files exist
const mimeFixPath = path.join(__dirname, 'fix-mime-types.mjs');
const injectMimeFixPath = path.join(__dirname, 'inject-mime-fix.js');
const serverPath = path.join(__dirname, 'server-postgres-docker.js');

// Check files and run server
if (!fs.existsSync(mimeFixPath) || !fs.existsSync(injectMimeFixPath) || !fs.existsSync(serverPath)) {
  console.error('❌ Required files not found');
  process.exit(1);
}

// Run the server
const server = spawn('node', ['server-postgres-docker.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: '--experimental-modules --es-module-specifier-resolution=node'
  }
});
```

#### Shell Script (`run-fixed-postgres-docker.sh`)

```bash
#!/bin/bash

# Check if required files exist
if [ ! -f "fix-mime-types.mjs" ] || [ ! -f "inject-mime-fix.js" ] || [ ! -f "server-postgres-docker.js" ]; then
  echo "❌ Required files not found"
  exit 1
fi

# Run the server with experimental modules flag
NODE_OPTIONS="--experimental-modules --es-module-specifier-resolution=node" node server-postgres-docker.js
```

#### Batch Script (`run-fixed-postgres-docker.bat`)

```batch
@echo off
REM Check if required files exist
if not exist fix-mime-types.mjs (
  echo ❌ Required files not found
  exit /b 1
)

REM Run the server with experimental modules flag
set NODE_OPTIONS=--experimental-modules --es-module-specifier-resolution=node
node server-postgres-docker.js
```

## Technical Considerations

### 1. Multi-layered Defense Strategy

The solution employs a multi-layered defense strategy:

1. **Server-side header setting**: Multiple points in the request handling pipeline set the correct Content-Type header.
2. **Client-side fetch patching**: A client-side patch ensures JavaScript files have the correct MIME type even if the server fails to set it.
3. **HTML response modification**: The client-side patch is injected into all HTML responses to ensure it's always available.

This approach provides redundancy and ensures that JavaScript modules are handled correctly even if one layer fails.

### 2. Performance Considerations

- The client-side patch only intercepts fetch requests for JavaScript files, minimizing performance impact.
- The server-side middleware uses efficient pattern matching to identify JavaScript files.
- The HTML modification is performed once at server startup for the main index.html file.

### 3. Compatibility

- The solution is compatible with modern browsers that support ES modules.
- The client-side patch uses standard Web APIs (fetch, Response) that are widely supported.
- The server-side middleware is compatible with Express.js.

### 4. Debugging and Maintenance

- Extensive logging helps diagnose MIME type issues.
- The diagnostic endpoint provides a way to check MIME type handling.
- The modular design makes it easy to update or extend the solution.

## Future Improvements

1. **Caching**: Add caching headers to improve performance.
2. **Content Security Policy**: Update CSP headers to allow inline scripts for the MIME type fix.
3. **Service Worker**: Consider using a service worker for more advanced MIME type handling.
4. **Configuration**: Make the MIME type handling configurable via environment variables.

## Conclusion

The MIME type fix implementation provides a robust solution to the issues encountered when migrating from Supabase to PostgreSQL. The multi-layered approach ensures that JavaScript modules are handled correctly in all scenarios, while the extensive logging and diagnostic features facilitate troubleshooting and maintenance.
