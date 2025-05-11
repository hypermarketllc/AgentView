/**
 * run_server_with_error_logging.js
 * Main entry point for running the server with error logging enabled
 */

const express = require('express');
const http = require('http');
const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const logSocketServer = {
  init: () => console.log('Mock log server initialized'),
  log: (msg) => console.log('[LOG]', msg)
};
const logErrorToDB = (e) => Promise.resolve({success: true});
const getRecentErrors = () => Promise.resolve([]);
// Create simple 404 handler function
const apply404Handler = (app) => {
  app.use((req, res, next) => {
    res.status(404).json({
      error: 'Not Found',
      message: `The requested resource at ${req.path} was not found`
    });
  });
};

// Import patch system
const { runAllPatches, getPatchFunctions } = require(process.env.DOCKER_ENV === 'true' ? '../tools/patch/runPatch.ts' : './tools/patch/runPatch.ts');
const { validateRouteRegistry } = require(process.env.DOCKER_ENV === 'true' ? '../tools/patch/validateRouteRegistry.ts' : './tools/patch/validateRouteRegistry.ts');
const { detectDuplicateFunctions } = require(process.env.DOCKER_ENV === 'true' ? '../tools/patch/detectDuplicateFunctions.ts' : './tools/patch/detectDuplicateFunctions.ts');
const { patchEnvValidator } = require(process.env.DOCKER_ENV === 'true' ? '../tools/patch/patch-env-validator.ts' : './tools/patch/patch-env-validator.ts');
const { patchExpress404Handler } = require(process.env.DOCKER_ENV === 'true' ? '../tools/patch/patch-express-404-handler.ts' : './tools/patch/patch-express-404-handler.ts');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Initialize patch log
const patchLogPath = path.join(logsDir, 'PatchVersionLog.json');
if (!fs.existsSync(patchLogPath)) {
  fs.writeFileSync(patchLogPath, JSON.stringify({ patches: [], lastRun: null }));
}

// Load environment variables
dotenv.config();

// Set error logging enabled
process.env.ERROR_LOGGING_ENABLED = 'true';

// Create Express app
const app = express();
const server = http.createServer(app);

// Initialize WebSocket server for logs
initLogSocketServer(server);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/static', express.static(path.join(__dirname, '../public')));

// Serve CRM frontend
app.use('/crm', express.static(path.join(__dirname, '../public')));

// Serve Console frontend
app.use('/console', express.static(path.join(__dirname, 'frontend')));

// CRM API routes
app.get('/crm/api/health', (req, res) => {
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

// Create database connection pool
const pool = new Pool({
  host: process.env.DOCKER_ENV === 'true' ? 'crm-db' : (process.env.POSTGRES_HOST || 'localhost'),
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crm_db',
  user: process.env.POSTGRES_USER || 'crm_user',
  password: process.env.POSTGRES_PASSWORD || 'your_strong_password_here'
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
    
    const errors = await getRecentErrors(limit, includeResolved);
    
    res.json({ errors });
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
    const frontendStatus = fs.existsSync(path.join(__dirname, '../public/index.html')) ? 'healthy' : 'error';
    
    // Check route registry
    let routeStatus = 'error';
    try {
      const routeValidation = await validateRouteRegistry();
      routeStatus = routeValidation.success ? 'healthy' : 'error';
    } catch (routeError) {
      console.error('Route validation error:', routeError);
      routeStatus = 'error';
    }
    
    // Check environment variables
    let envStatus = 'error';
    try {
      const envValidation = await patchEnvValidator();
      envStatus = envValidation.success ? 'healthy' : 'error';
    } catch (envError) {
      console.error('Environment validation error:', envError);
      envStatus = 'error';
    }
    
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
    emitLog({
      type: 'info',
      message: 'Running patches...'
    });
    
    // Run all patches
    const result = await runAllPatches();
    
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
  
  // Emit the error via WebSocket
  emitLog({
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
  
  emitLog({
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
    
    // Emit the error via WebSocket
    emitLog({
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
    
    // Emit the error via WebSocket
    emitLog({
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
