/**
 * run-fixed-auth-server.js
 * This script runs the server with the authentication endpoint fixes applied.
 */

import { app, start, pool, setupApiRoutes } from './server-docker-index.js';
import './fix-auth-endpoints.js';

console.log('Starting server with authentication endpoint fixes...');

// Set up API routes (which includes auth routes)
setupApiRoutes(app, pool);

// Start the server
start();

console.log('Server started with authentication endpoint fixes applied.');
console.log('Both /api/auth/login and /crm/api/auth/login should now work.');
