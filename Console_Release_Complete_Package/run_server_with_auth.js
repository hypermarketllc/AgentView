/**
 * Server with database authentication
 * This server uses PostgreSQL for authentication and error logging
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');
const logErrorToDB = require('./utils/logErrorToDB');
const authRoutes = require('./server/routes/auth-routes');

// Load environment variables
require('dotenv').config();

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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
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

// Catch-all route to serve the frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log(`Authentication API available at http://localhost:${PORT}/api/auth`);
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
