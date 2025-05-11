/**
 * Enhanced Authentication Server
 * This script runs the authentication server with all position fixes applied
 */

import express from 'express';
import pg from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from 'cors';

// Import enhanced modules
import { applyEnhancedAuthApi } from './enhance-auth-api.mjs';
// Note: position-verify-api.mjs is not available, so we'll create a simple implementation
const createPositionVerificationRouter = (db) => {
  const router = express.Router();
  
  // Get position by ID
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await db.query('SELECT * FROM positions WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Position not found' });
      }
      
      return res.json(result.rows[0]);
    } catch (error) {
      console.error(`Error fetching position: ${error.message}`);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get all positions
  router.get('/', async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM positions ORDER BY level');
      return res.json(result.rows);
    } catch (error) {
      console.error(`Error fetching positions: ${error.message}`);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  return router;
};

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database connection configuration
const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crm_db',
  user: process.env.POSTGRES_USER || 'crm_user',
  password: process.env.POSTGRES_PASSWORD || 'your_strong_password_here'
};

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/crm', express.static(path.join(__dirname, '..', 'dist')));

// Connect to the database
const db = new pg.Client(dbConfig);

async function startServer() {
  try {
    // Connect to the database
    await db.connect();
    console.log('Connected to PostgreSQL database');
    
    // Helper functions
    const comparePassword = async (password, hash) => {
      return await bcrypt.compare(password, hash);
    };
    
    // Apply enhanced auth API
    applyEnhancedAuthApi(app, db, { comparePassword });
    
    // Add position verification API
    app.use('/crm/api/positions', createPositionVerificationRouter(db));
    
    // API routes
    app.use('/crm/api', createApiRouter());
    
    // Catch-all route for SPA
    app.get('/crm/*', (req, res) => {
      res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
    });
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/crm/api`);
      console.log(`Authentication API available at http://localhost:${PORT}/crm/api/auth`);
      console.log(`Frontend available at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(`Server error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Create the API router
 * @returns {express.Router} API router
 */
function createApiRouter() {
  const router = express.Router();
  
  // Define additional API endpoints
  router.get('/settings/system', (req, res) => {
    res.json({
      system_name: 'CRM System',
      version: '2.0.0',
      features: {
        enhanced_position_system: true,
        error_recovery: true
      }
    });
  });
  
  // Add other API endpoints
  
  return router;
}

// Start the server
startServer();
