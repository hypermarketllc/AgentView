y/**
 * run_server_with_error_logging_fixed.mjs
 * Main entry point for running the server with error logging enabled
 * Connects to PostgreSQL in Docker and serves the frontend locally
 * Converted to ES module format
 */

import http from 'http';
import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;

// Get current file directory (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Set error logging enabled
process.env.ERROR_LOGGING_ENABLED = 'true';

// Create simple 404 handler function
const apply404Handler = (app) => {
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `The requested resource at ${req.path} was not found`
    });
  });
};

// Simple log function (no WebSocket)
const logMessage = (logData) => {
  const logPrefix = logData.type === 'error' ? '[ERROR]' : 
                    logData.type === 'warning' ? '[WARNING]' : 
                    logData.type === 'success' ? '[SUCCESS]' : '[INFO]';
  console.log(`${logPrefix} ${logData.message}`);
  
  if (logData.details) {
    console.log('Details:', logData.details);
  }
};

// Initialize patch log
const patchLogPath = path.join(__dirname, 'logs', 'patch-log.json');
if (!fs.existsSync(path.dirname(patchLogPath))) {
  fs.mkdirSync(path.dirname(patchLogPath), { recursive: true });
}
if (!fs.existsSync(patchLogPath)) {
  fs.writeFileSync(patchLogPath, JSON.stringify({ patches: [], lastRun: null }));
}

// Create Express app
const app = express();
const server = http.createServer(app);

// Add middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create database connection pool
const pool = new Pool({
  host: process.env.DOCKER_ENV === 'true' ? 'db' : (process.env.POSTGRES_HOST || 'localhost'),
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crm_db',
  user: process.env.POSTGRES_USER || 'crm_user',
  password: process.env.POSTGRES_PASSWORD || 'your_strong_password_here'
});

// Log error to database function
const logErrorToDB = async (type, message, details = {}, stack = null) => {
  try {
    const client = await pool.connect();
    const query = `
      INSERT INTO system_errors (type, message, details, stack_trace, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id
    `;
    const values = [type, message, JSON.stringify(details), stack];
    const result = await client.query(query, values);
    client.release();
    return result.rows[0].id;
  } catch (error) {
    console.error('Failed to log error to database:', error);
    return null;
  }
};

// Try to load the React application build
try {
  // In ES modules, we can't use require for dynamic imports
  // Instead, we'll check if the build directory exists
  const buildPath = path.join(__dirname, '../build');
  if (fs.existsSync(buildPath)) {
    logMessage({ type: 'success', message: 'React application build directory found' });
  } else {
    logMessage({ type: 'warning', message: 'React application build directory not found' });
  }
} catch (error) {
  logMessage({ type: 'warning', message: 'Could not check React application build:', details: error.message });
}

// Serve static files
app.use('/static', express.static(path.join(__dirname, '../public')));

// Serve main React application
app.use('/', express.static(path.join(__dirname, '../dist')));

// Serve React app for all routes under /
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Serve React app for all routes under /crm
app.get('/crm/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Serve Console frontend
app.use('/console', express.static(path.join(__dirname, 'frontend')));

// CRM API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// System Health Monitoring Dashboard
app.get('/crm/system-monitoring', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/system-monitoring.html'));
});

// Authentication API route
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simple authentication for demo purposes
  if ((email === 'agent@example.com' || email === 'admin@americancoveragecenter.com') && password === 'Agent123!') {
    // Determine user role and details based on email
    const isAdmin = email === 'admin@americancoveragecenter.com';
    
    res.json({
      token: isAdmin ? 'admin-token-12345' : 'agent-token-12345',
      user: {
        id: isAdmin ? 2 : 1,
        email: email,
        fullName: isAdmin ? 'Admin User' : 'Agent User',
        role: isAdmin ? 'admin' : 'agent'
      }
    });
  } else {
    res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid email or password'
    });
  }
});

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error logging API routes
app.get('/api/errors', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const includeResolved = req.query.includeResolved === 'true';
    
    const query = `
      SELECT * FROM system_errors
      ${!includeResolved ? "WHERE resolved = false" : ""}
      ORDER BY created_at DESC
      LIMIT $1
    `;
    
    const client = await pool.connect();
    const result = await client.query(query, [limit]);
    client.release();
    
    res.json({ errors: result.rows });
  } catch (error) {
    console.error('Error fetching errors:', error);
    
    await logErrorToDB('API_ERROR', 'Error fetching errors', { 
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to fetch errors'
    });
  }
});

// Console API routes
app.get('/api/console/status', async (req, res) => {
  try {
    // Check database connection
    let dbStatus = 'error';
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      dbStatus = 'healthy';
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      dbStatus = 'error';
    }
    
    // Check API status
    const apiStatus = 'healthy'; // Since we're responding, API is up
    
    // Check frontend status
    const frontendStatus = fs.existsSync(path.join(__dirname, '../dist/index.html')) ? 'healthy' : 'error';
    
    // Check route registry and environment variables - disabled due to TypeScript compilation issues
    const routeStatus = 'unknown';
    const envStatus = 'unknown';
    
    res.json({
      status: 'ok',
      components: {
        database: dbStatus,
        api: apiStatus,
        frontend: frontendStatus,
        routes: routeStatus,
        environment: envStatus
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting console status:', error);
    
    await logErrorToDB('CONSOLE_STATUS_ERROR', 'Error getting console status', { 
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to get console status'
    });
  }
});

// Patch API route
app.post('/api/console/patch', async (req, res) => {
  try {
    logMessage({
      type: 'info',
      message: 'Running patches...'
    });
    
    // Run all patches - disabled due to TypeScript compilation issues
    const result = {
      success: true,
      errors: [],
      messages: ['Patch system disabled in Docker environment']
    };
    
    // Log patch execution
    const patchLog = JSON.parse(fs.readFileSync(patchLogPath, 'utf8'));
    patchLog.patches.push({
      timestamp: new Date().toISOString(),
      result: result
    });
    patchLog.lastRun = new Date().toISOString();
    fs.writeFileSync(patchLogPath, JSON.stringify(patchLog, null, 2));
    
    res.json(result);
  } catch (error) {
    console.error('Error running patches:', error);
    
    await logErrorToDB('PATCH_ERROR', 'Error running patches', { 
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to run patches'
    });
  }
});

// Get patch log
app.get('/api/console/patch/log', (req, res) => {
  try {
    const patchLog = JSON.parse(fs.readFileSync(patchLogPath, 'utf8'));
    res.json(patchLog);
  } catch (error) {
    console.error('Error reading patch log:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to read patch log'
    });
  }
});

// Apply 404 handler
apply404Handler(app);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  // Log the error to the database
  logErrorToDB('UNHANDLED_ERROR', err.message, { 
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent')
  }, err.stack).catch(logErr => {
    console.error('Failed to log error to DB:', logErr);
  });
  
  // Log the error (no WebSocket)
  logMessage({
    type: 'error',
    message: `Unhandled error: ${err.message}`,
    details: {
      path: req.path,
      method: req.method,
      stack: err.stack
    }
  });
  
  // Send error response
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  logMessage({
    type: 'success',
    message: `Server started on port ${PORT}`,
    details: {
      errorLoggingEnabled: process.env.ERROR_LOGGING_ENABLED === 'true',
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// Handle process termination
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  
  try {
    // Close database pool
    await pool.end();
    console.log('Database pool closed');
    
    // Close HTTP server
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error('Uncaught exception:', error);
  
  try {
    // Log the error to the database
    await logErrorToDB('UNCAUGHT_EXCEPTION', error.message, {}, error.stack);
    
    // Log the error (no WebSocket)
    logMessage({
      type: 'error',
      message: `Uncaught exception: ${error.message}`,
      details: {
        stack: error.stack
      }
    });
  } catch (logError) {
    console.error('Failed to log uncaught exception:', logError);
  }
  
  // Exit the process
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled promise rejection:', reason);
  
  try {
    // Log the error to the database
    await logErrorToDB('UNHANDLED_REJECTION', reason.message || 'Unknown reason', {}, reason.stack);
    
    // Log the error (no WebSocket)
    logMessage({
      type: 'error',
      message: `Unhandled promise rejection: ${reason.message || 'Unknown reason'}`,
      details: {
        stack: reason.stack
      }
    });
  } catch (logError) {
    console.error('Failed to log unhandled rejection:', logError);
  }
});
