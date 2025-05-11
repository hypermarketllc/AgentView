# Authentication System Patch Documentation

## Overview

This document describes the central patch system created to fix authentication issues in the application. The patch system provides a centralized way to apply fixes to multiple files, making it easier to track changes and maintain the codebase.

## Problem

The login functionality was not working due to several issues:

1. The `authenticateToken` middleware was not being properly passed to the `setupApiRoutes` function in `run-fixed-auth-server.js`.
2. This caused route handlers in `server-docker-routes.js` to receive an undefined middleware, resulting in the error:
   ```
   Error: Route.get() requires a callback function but got a [object Undefined]
   ```
3. The authentication system was looking for password hashes in the wrong table.

## Solution

The central patch system (`auth-system-patch.js`) applies fixes to multiple files in a controlled and documented way:

1. **Patch for `run-fixed-auth-server.js`**:
   - Adds the import for `authenticateToken` from `server-docker-index.js`
   - Passes the `authenticateToken` middleware to the `setupApiRoutes` function

2. **Patch for `server-docker-routes.js`**:
   - Adds a fallback mechanism to handle cases where `authenticateToken` might be undefined
   - Ensures route handlers always receive a valid middleware function

## Files Created

1. **`auth-system-patch.js`**: The central patch system that applies fixes to multiple files
2. **`run-auth-patch.js`**: A script that applies the patches and starts the server

## How to Use

To apply the patches and start the server:

```bash
node run-auth-patch.js
```

This will:
1. Apply all patches in the correct order
2. Set up API routes with the proper authentication middleware
3. Start the server

## Patch Registry

The patch system maintains a registry of patches with metadata:

```javascript
const patches = [
  {
    id: 'run-fixed-auth-server-fix',
    targetFile: './run-fixed-auth-server.js',
    description: 'Fix authenticateToken middleware import and usage in run-fixed-auth-server.js',
    priority: 1
  },
  {
    id: 'server-docker-routes-fix',
    targetFile: './server-docker-routes.js',
    description: 'Fix route handler in setupDealsRoutes function',
    priority: 2
  }
];
```

Each patch includes:
- **id**: A unique identifier for the patch
- **targetFile**: The file to be patched
- **description**: A description of what the patch does
- **priority**: The order in which patches should be applied

## Adding New Patches

To add a new patch:

1. Add an entry to the `patches` array in `auth-system-patch.js`
2. Create a patch function for the specific file
3. Add a case in the switch statement in the `applyPatches` function

Example:

```javascript
// Add to patches array
{
  id: 'new-patch',
  targetFile: './path/to/file.js',
  description: 'Description of the patch',
  priority: 3
}

// Create patch function
function patchNewFile(content) {
  console.log('Patching new file...');
  
  // Apply patch
  let patchedContent = content.replace(
    "old code",
    "new code"
  );
  
  return patchedContent;
}

// Add to switch statement
case 'new-patch':
  patchedContent = patchNewFile(content);
  break;
```

## Benefits of the Central Patch System

1. **Centralized Management**: All patches are defined and managed in one place
2. **Documentation**: Each patch includes metadata describing its purpose
3. **Prioritization**: Patches are applied in a specific order to avoid conflicts
4. **Backup**: Original files are backed up before patching
5. **Extensibility**: New patches can be easily added to the system
6. **Traceability**: Changes are tracked and documented

## Authentication System Architecture

The authentication system uses a dual-table approach:
1. `users` table - Stores user profile information (name, email, position, etc.)
2. `auth_users` table - Stores authentication credentials (user ID, email, password hash)

The login process:
1. User submits email and password
2. System queries the `auth_users` table to find the user by email
3. If found, it retrieves the corresponding user details from the `users` table
4. Password is verified by comparing the hash in `auth_users` with the provided password
5. On successful verification, a JWT token is generated and returned
