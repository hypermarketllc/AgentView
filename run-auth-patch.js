/**
 * run-auth-patch.js
 * This script applies the authentication system patches and then starts the server.
 */

import { applyPatches } from './auth-system-patch.js';
import { app, start, pool, setupApiRoutes, authenticateToken } from './server-docker-index.js';

console.log('Starting authentication system patch and server...');

// Apply all patches
applyPatches();

// Set up API routes with the authenticateToken middleware
console.log('Setting up API routes with authentication middleware...');
setupApiRoutes(app, pool, authenticateToken);

// Start the server
console.log('Starting server...');
start();

console.log('Server started with authentication patches applied.');
console.log('Both /api/auth/login and /crm/api/auth/login should now work.');
