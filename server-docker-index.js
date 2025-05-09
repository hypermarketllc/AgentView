/**
 * server-docker-index.js
 * Main entry point for the modularized Docker server
 * This file provides backward compatibility with the original server-docker.js
 */

// Import and re-export all components
import { app, start, JWT_SECRET } from './server-docker-core.js';
import { pool, initializeDatabase, SALT_ROUNDS } from './server-docker-db.js';
import { authenticateToken, setupAuthRoutes } from './server-docker-auth.js';
import { setupApiRoutes } from './server-docker-routes.js';
import { setupStaticFiles, getMimeType, mimeTypes } from './server-docker-static.js';

// Export everything for potential external use
export {
  app,
  start,
  JWT_SECRET,
  pool,
  initializeDatabase,
  SALT_ROUNDS,
  authenticateToken,
  setupAuthRoutes,
  setupApiRoutes,
  setupStaticFiles,
  getMimeType,
  mimeTypes
};

// Start the server if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}
