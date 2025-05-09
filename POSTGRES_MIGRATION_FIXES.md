# PostgreSQL Migration Fixes Documentation

## Overview

This document details the issues encountered during the migration from Supabase to PostgreSQL and the solutions implemented to resolve them. The primary focus was on fixing MIME type issues that prevented the frontend from loading JavaScript modules correctly.

## Issues Identified

### 1. MIME Type Errors

**Problem**: When migrating from Supabase to PostgreSQL, the frontend JavaScript modules failed to load with the following error:

```
Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "text/html". Strict MIME type checking is enforced for module scripts per HTML spec.
```

This occurred because the server was not correctly setting the MIME type headers for JavaScript files, particularly module scripts. Modern browsers enforce strict MIME type checking for ES modules, requiring them to be served with the `application/javascript` MIME type.

### 2. Path-to-RegExp Warnings

**Problem**: Warnings related to path-to-regexp were observed:

```
Warning: Missing parameter name at 13: https://git.new/pathToRegexpError
```

These warnings indicated potential issues with route pattern handling but were not critical to the application's functionality.

## Solutions Implemented

### 1. MIME Type Fix Implementation

We created a comprehensive solution to address the MIME type issues:

#### a. Created `inject-mime-fix.js`

This file provides three key functionalities:

1. **Client-side MIME type patching**: Injects a script into HTML responses that patches the `fetch` API to ensure JavaScript files are handled with the correct MIME type.

2. **HTML response modification middleware**: Creates middleware that injects the MIME type fix into HTML responses.

3. **Direct MIME type middleware**: Provides middleware that explicitly sets the correct Content-Type header for all JavaScript files.

```javascript
// Key functions in inject-mime-fix.js
export function injectMimeFix(html) {
  // Injects client-side MIME type fix into HTML
}

export function createMimeFixMiddleware() {
  // Creates middleware to modify HTML responses
}

export function createDirectMimeTypeMiddleware() {
  // Creates middleware to directly set MIME types for JS files
}
```

#### b. Updated `server-postgres-docker.js`

Modified the server to use both middleware solutions:

```javascript
import { createMimeFixMiddleware, createDirectMimeTypeMiddleware, injectMimeFix } from './inject-mime-fix.js';

// Middleware
app.use(cors());
app.use(express.json());
app.use(createMimeFixMiddleware()); // Add MIME type fix middleware
app.use(createDirectMimeTypeMiddleware()); // Add direct MIME type middleware for all JavaScript files
```

Also enhanced the static file serving to explicitly set the correct MIME types:

```javascript
// Serve static files with proper MIME types
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, filePath) => {
    // Handle JavaScript files - both regular and module scripts
    if (filePath.endsWith('.js') || filePath.includes('assets/index') && filePath.includes('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    }
    // Other MIME types...
  }
}));
```

#### c. Created Run Scripts

Created convenient scripts to run the server with the MIME type fixes:

1. `run-fixed-postgres-docker.js` - Node.js script
2. `run-fixed-postgres-docker.sh` - Shell script for Unix-based systems
3. `run-fixed-postgres-docker.bat` - Batch script for Windows

These scripts check for the required files and run the server with the necessary Node.js options.

### 2. Path-to-RegExp Fix

Imported a patch for path-to-regexp to handle invalid route patterns:

```javascript
// Apply path-to-regexp patch to handle invalid route patterns
import './path-to-regexp-patch-esm.js';
```

## Implementation Details

### Multi-layered MIME Type Fix Approach

Our solution uses a multi-layered approach to ensure JavaScript modules are served correctly:

1. **Server-side header setting**: Explicitly sets the Content-Type header for all JavaScript files.
2. **Client-side fetch patching**: Modifies the fetch API to ensure JavaScript responses have the correct MIME type.
3. **HTML response modification**: Injects the client-side fix into all HTML responses.

This comprehensive approach ensures that JavaScript modules are handled correctly regardless of how they are loaded.

### Debugging Enhancements

Added extensive logging to help diagnose MIME type issues:

```javascript
console.log(`MIME fix middleware: Set Content-Type for ${url} to application/javascript`);
console.log(`Direct MIME fix: Set Content-Type for ${url} to application/javascript`);
console.log(`Serving ${filePath} with Content-Type: ${res.getHeader('Content-Type')}`);
```

Also added a diagnostic endpoint to check MIME type handling:

```javascript
app.get('/crm/api/check-mime', (req, res) => {
  res.json({
    status: 'ok',
    message: 'MIME type handling is active',
    supportedTypes: {
      '.js': 'application/javascript; charset=utf-8',
      '.mjs': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.html': 'text/html; charset=utf-8'
    }
  });
});
```

## Testing and Verification

The fixes were tested by:

1. Running the server with `node run-fixed-postgres-docker.js`
2. Accessing the application at `http://localhost:3000/crm`
3. Verifying that JavaScript modules loaded correctly without MIME type errors
4. Confirming that the frontend application functioned as expected

## Files Created/Modified

1. **Created**:
   - `inject-mime-fix.js` - MIME type fix implementation
   - `run-fixed-postgres-docker.js` - Node.js run script
   - `run-fixed-postgres-docker.sh` - Unix shell run script
   - `run-fixed-postgres-docker.bat` - Windows batch run script

2. **Modified**:
   - `server-postgres-docker.js` - Updated to use MIME type fixes

## Conclusion

The migration from Supabase to PostgreSQL required addressing MIME type issues that prevented JavaScript modules from loading correctly. By implementing a comprehensive solution that addresses both server-side and client-side aspects of the problem, we successfully fixed the issues and enabled the application to run correctly with PostgreSQL as the backend database.

The multi-layered approach ensures robustness, while the added logging and diagnostic endpoints facilitate future troubleshooting if needed.
