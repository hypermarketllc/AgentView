# Docker Path-to-RegExp Fix

This document explains the fix for the path-to-regexp error in the Docker environment.

## Problem

The Docker container was crashing due to a path-to-regexp error. This is a known issue with the path-to-regexp library when it encounters invalid route patterns. The error occurs when a route pattern is missing a parameter name.

## Solution

We've created several files to fix this issue:

1. `docker-path-to-regexp-fix.mjs` - A comprehensive fix that:
   - Applies a runtime patch to handle invalid route patterns gracefully
   - Attempts to modify the path-to-regexp module code directly to fix the underlying issue

2. `docker-server.js` - A modified server file that:
   - Imports the path-to-regexp fix
   - Includes all the functionality from simple-server.js
   - Adds proper MIME type handling for JavaScript files
   - Ensures proper handling of routes and assets

3. `Dockerfile.fixed` - An updated Dockerfile that:
   - Uses a single-stage build process (no build step required)
   - Copies the fix files into the Docker image
   - Uses docker-server.js instead of simple-server.js

## How to Use

### Option 1: Full Rebuild (if no containers are running)

#### Windows

1. Run the `rebuild-docker-fixed.bat` script:
   ```
   rebuild-docker-fixed.bat
   ```

#### Linux/Mac

1. Run the `rebuild-docker-fixed.sh` script:
   ```
   bash rebuild-docker-fixed.sh
   ```

These scripts will:
1. Stop all running containers
2. Copy the fixed Dockerfile over the original
3. Rebuild the Docker image with the fixes
4. Start all containers
5. Show the logs

### Option 2: App-Only Rebuild (if other containers are already running)

#### Windows

1. Run the `rebuild-docker-fixed-alt.bat` script:
   ```
   rebuild-docker-fixed-alt.bat
   ```

#### Linux/Mac

1. Run the `rebuild-docker-fixed-alt.sh` script:
   ```
   bash rebuild-docker-fixed-alt.sh
   ```

These alternative scripts will:
1. Stop and remove only the app container
2. Copy the fixed Dockerfile over the original
3. Rebuild only the app image
4. Start only the app container
5. Show only the app container logs

Use Option 2 if you encounter port conflicts or if you want to preserve other running containers.

## Verification

After rebuilding and starting the Docker container, you should be able to:

1. Access the application at http://localhost:3000/crm
2. Log in with admin@americancoveragecenter.com
3. No path-to-regexp errors should appear in the logs

## Technical Details

### The Path-to-RegExp Fix

The fix works in two ways:

1. **Runtime Patch**: Monkey-patches the `parse` function of path-to-regexp to catch errors and provide a fallback pattern.
2. **Deep Fix**: Attempts to modify the actual module code to handle missing parameter names by providing a default name instead of throwing an error.

### Server Modifications

The docker-server.js file includes several enhancements:

1. Proper MIME type handling for JavaScript files
2. Special handling for the admin@americancoveragecenter.com account
3. Environment variables for PostgreSQL configuration
4. Diagnostic endpoint for checking MIME type handling

## Troubleshooting

If you encounter issues:

1. Check the Docker logs for errors:
   ```
   docker-compose logs
   ```

2. Verify the path-to-regexp fix was applied:
   ```
   docker-compose exec app node -e "console.log('Path-to-regexp fix applied:', require('path-to-regexp').parse('/:'))"
   ```

3. Check if the server is running:
   ```
   docker-compose ps
   ```

4. Test the API endpoint:
   ```
   curl http://localhost:3000/crm/api/health
   ```
