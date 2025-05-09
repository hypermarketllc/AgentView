/**
 * server-docker-core.js
 * Core server setup, middleware, and startup for the Docker environment
 */

import express from 'express';
import robustPatch, { errorUtils, fsUtils } from './robust-patch.js';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Import other modules
import { initializeDatabase, pool } from './server-docker-db.js';
import { authenticateToken } from './server-docker-auth.js';
import { setupApiRoutes } from './server-docker-routes.js';
import { setupStaticFiles } from './server-docker-static.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Read the index.html file
const indexPath = path.join(__dirname, 'dist', 'index.html');
let indexHtml = '';

try {
  indexHtml = fsUtils.safeReadFile(indexPath) || '<!DOCTYPE html><html><body><h1>Error loading application</h1></body></html>';
  console.log('Successfully read index.html');
} catch (err) {
  console.error('Error reading index.html:', err);
  indexHtml = '<!DOCTYPE html><html><body><h1>Error loading application</h1></body></html>';
}

// Create a script tag with the environment variables
const envScript = `
  <script>
    window.env = {
      VITE_SUPABASE_URL: "${process.env.VITE_SUPABASE_URL || ''}",
      VITE_SUPABASE_ANON_KEY: "${process.env.VITE_SUPABASE_ANON_KEY || ''}",
      API_URL: "/crm/api"
    };
  </script>
`;

// Insert the script tag before the closing head tag
indexHtml = indexHtml.replace('</head>', `${envScript}</head>`);

// Health check endpoint
app.get('/crm/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Setup API routes
setupApiRoutes(app, pool, authenticateToken);

// Setup static file serving
setupStaticFiles(app, __dirname, indexHtml);

// Redirect root to /crm
app.get('/', (req, res) => {
  res.redirect('/crm');
});

// Initialize database and start server
async function start() {
  try {
    // Try to initialize the database
    const initDb = errorUtils.withRetry(async () => {
      return await initializeDatabase(pool);
    }, 3, 2000);
    
    try {
      await initDb();
      console.log('Database connection successful');
    } catch (error) {
      console.error('Database initialization error:', error);
      console.warn('Starting server without database connection. Some features may not work.');
      
      // If we're in development mode, we can continue without a database
      if (process.env.NODE_ENV !== 'production') {
        console.log('Development mode: Continuing without database connection');
      } else {
        // In production, we might want to exit if database connection fails
        // But for now, we'll continue to allow testing
        console.warn('Production mode: Continuing without database connection (not recommended)');
      }
    }
    
    // Start the server regardless of database connection status
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`CRM available at: http://localhost:${PORT}/crm`);
      console.log(`API available at: http://localhost:${PORT}/crm/api`);
    });
  } catch (err) {
    console.error('Fatal error starting server:', err);
    process.exit(1);
  }
}

// Export for potential testing or external use
export { app, start, JWT_SECRET };

// Start the server if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}
