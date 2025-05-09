/**
 * route-registrar.js
 * 
 * Automated route registration system that registers all routes from the API registry.
 * This provides a centralized way to manage API endpoints and ensures consistency.
 */

import { API_REGISTRY, getAllEndpoints } from '../config/api-registry.js';
import { asyncHandler } from './error-handler.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Register all routes from the API registry
 * 
 * @param {Object} app - Express app instance
 * @param {Function} authenticateToken - Authentication middleware
 * @param {Object} handlers - Object containing all handler functions
 * @param {Object} pool - Database connection pool
 */
export function registerAllRoutes(app, authenticateToken, handlers, pool) {
  // Store the API base URL for health checks
  app.locals.apiBaseUrl = process.env.API_BASE_URL || '/crm/api';
  
  // Store the database pool for use in error handling and health checks
  app.locals.pool = pool;
  
  // Add request ID middleware
  app.use((req, res, next) => {
    req.id = uuidv4();
    next();
  });
  
  // Register each endpoint from the registry
  for (const [categoryKey, category] of Object.entries(API_REGISTRY)) {
    for (const [endpointKey, endpoint] of Object.entries(category)) {
      const { path, method, requiresAuth, handler } = endpoint;
      const fullPath = `/crm/api${path}`;
      
      // Skip if handler function doesn't exist
      if (!handlers[handler]) {
        console.warn(`Warning: Handler function '${handler}' not found for endpoint ${method} ${fullPath}`);
        continue;
      }
      
      // Register the route with or without authentication
      if (requiresAuth) {
        app[method.toLowerCase()](
          fullPath, 
          authenticateToken, 
          asyncHandler((req, res) => handlers[handler](req, res))
        );
      } else {
        app[method.toLowerCase()](
          fullPath, 
          asyncHandler((req, res) => handlers[handler](req, res))
        );
      }
      
      console.log(`Registered route: ${method} ${fullPath} -> ${handler}`);
    }
  }
  
  // Log all registered endpoints
  console.log(`Total registered endpoints: ${getAllEndpoints().length}`);
}

/**
 * Check if a user has permission to access a specific endpoint
 * 
 * @param {Object} user - User object with position information
 * @param {String} path - API path
 * @param {String} method - HTTP method
 * @returns {Boolean} - Whether the user has permission
 */
export function checkEndpointPermission(user, path, method) {
  // System health endpoints require admin or owner level (3+)
  if (path.startsWith('/system/') && user.position.level < 3) {
    return false;
  }
  
  // Settings endpoints require admin or owner level (3+)
  if (path.startsWith('/settings/') && user.position.level < 3) {
    return false;
  }
  
  // User can access their own user settings
  if (path.startsWith('/user/')) {
    return true;
  }
  
  // Managers and above can access all data endpoints
  if (path.startsWith('/carriers') || path.startsWith('/products') || 
      path.startsWith('/positions') || path.startsWith('/deals')) {
    return user.position.level >= 2;
  }
  
  // Default allow for authenticated users
  return true;
}

/**
 * Generate API documentation from the registry
 * 
 * @returns {String} - Markdown documentation
 */
export function generateApiDocs() {
  let markdown = '# API Documentation\n\n';
  
  for (const [categoryKey, category] of Object.entries(API_REGISTRY)) {
    markdown += `## ${categoryKey}\n\n`;
    
    for (const [endpointKey, endpoint] of Object.entries(category)) {
      const { path, method, requiresAuth, description } = endpoint;
      
      markdown += `### ${endpointKey}\n\n`;
      markdown += `- **Path:** \`${path}\`\n`;
      markdown += `- **Method:** ${method}\n`;
      markdown += `- **Authentication Required:** ${requiresAuth ? 'Yes' : 'No'}\n`;
      
      if (description) {
        markdown += `- **Description:** ${description}\n`;
      }
      
      markdown += '\n';
    }
  }
  
  return markdown;
}
