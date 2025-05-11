/**
 * Server with database authentication
 * This server uses PostgreSQL for authentication and error logging
 */

import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import logErrorToDB from './utils/logErrorToDB.mjs';
import authRoutes from './server/routes/auth-routes.mjs';

// Create a positions router
const createPositionsRouter = (pool) => {
  const router = express.Router();
  
  // Get all positions
  router.get('/', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM positions ORDER BY level');
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching positions:', error);
      res.status(500).json({ error: 'Failed to fetch positions' });
    }
  });
  
  // Get user's position (must come before /:id route to avoid conflict)
  router.get('/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Query the user_positions view
      const result = await pool.query(
        'SELECT * FROM user_positions WHERE user_id = $1',
        [userId]
      );
      
      if (result.rows.length === 0) {
        // If no position found in the view, try to get from positions table using user's position_id
        const userResult = await pool.query(
          'SELECT position_id FROM users WHERE id = $1',
          [userId]
        );
        
        if (userResult.rows.length === 0 || !userResult.rows[0].position_id) {
          return res.status(404).json({ error: 'User or position not found' });
        }
        
        const positionId = userResult.rows[0].position_id;
        const positionResult = await pool.query(
          'SELECT * FROM positions WHERE id = $1',
          [positionId]
        );
        
        if (positionResult.rows.length === 0) {
          return res.status(404).json({ error: 'Position not found' });
        }
        
        return res.json(positionResult.rows[0]);
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching user position:', error);
      res.status(500).json({ error: 'Failed to fetch user position' });
    }
  });
  
  // Get position by ID (must come after more specific routes)
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query('SELECT * FROM positions WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Position not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching position:', error);
      res.status(500).json({ error: 'Failed to fetch position' });
    }
  });
  
  return router;
};

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL connection configuration
const pgConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crm_db',
  user: process.env.POSTGRES_USER || 'crm_user',
  password: process.env.POSTGRES_PASSWORD || 'your_strong_password_here'
};

// Create a new PostgreSQL connection pool
const pool = new Pool(pgConfig);

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Serve static files from the dist directory for the CRM application
app.use('/crm', express.static(join(__dirname, '..', 'dist')));

// Serve static files from the public directory for other content
app.use(express.static(join(__dirname, '..', 'public')));

// API routes
app.use('/crm/api/auth', authRoutes);
app.use('/crm/api/positions', createPositionsRouter(pool));

// Health check endpoint
app.get('/crm/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  // Log error to database
  logErrorToDB(pool, {
    error_message: err.message,
    error_stack: err.stack,
    error_type: err.name,
    request_path: req.path,
    request_method: req.method,
    request_ip: req.ip,
    request_user_agent: req.get('User-Agent'),
    timestamp: new Date()
  }).catch(logErr => {
    console.error('Error logging to database:', logErr);
  });
  
  res.status(500).json({ error: 'Internal server error' });
});

// Catch-all route for CRM paths to serve the React app
app.get('/crm/*', (req, res) => {
  res.sendFile(join(__dirname, '..', 'dist', 'index.html'));
});

// Catch-all route for other paths
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '..', 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/crm/api`);
  console.log(`Authentication API available at http://localhost:${PORT}/crm/api/auth`);
  console.log(`Positions API available at http://localhost:${PORT}/crm/api/positions`);
  console.log(`Frontend available at http://localhost:${PORT}`);
});

// Handle process termination
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  
  try {
    await pool.end();
    console.log('Database connections closed');
  } catch (err) {
    console.error('Error closing database connections:', err);
  }
  
  process.exit(0);
});
