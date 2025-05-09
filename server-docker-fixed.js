/**
 * server-docker-fixed.js
 * 
 * This is a fixed version of the server-docker.js file that properly implements
 * the missing API routes for user settings and system settings.
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config({ path: '.env.postgres' });
dotenv.config(); // Also load .env as fallback

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection configuration
const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'postgres',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// Create a new PostgreSQL client
const client = new pg.Client(dbConfig);

// Connect to the database
async function connectToDatabase() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');
    return true;
  } catch (error) {
    console.error('Error connecting to PostgreSQL database:', error);
    return false;
  }
}

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    req.user = user;
    next();
  });
}

// API routes
const apiRouter = express.Router();

// Auth routes
apiRouter.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const userResult = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = userResult.rows[0];
    
    // In a real app, you would check the password hash here
    // For simplicity, we're just checking if the password matches
    if (password !== user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User settings route - FIXED
apiRouter.get('/user/settings', authenticateToken, async (req, res) => {
  try {
    // Get user account settings
    const userAccountResult = await client.query(
      'SELECT * FROM user_accs WHERE user_id = $1',
      [req.user.id]
    );
    
    if (userAccountResult.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found' });
    }
    
    const userAccount = userAccountResult.rows[0];
    
    res.json({
      user_account: {
        id: userAccount.id,
        display_name: userAccount.display_name,
        theme_preference: userAccount.theme_preference,
        notification_settings: userAccount.notification_settings
      }
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// System settings route - FIXED
apiRouter.get('/settings/system', authenticateToken, async (req, res) => {
  try {
    // Get system settings
    const systemSettingsResult = await client.query(
      'SELECT * FROM settings WHERE type = $1',
      ['system']
    );
    
    if (systemSettingsResult.rows.length === 0) {
      return res.status(404).json({ error: 'System settings not found' });
    }
    
    const systemSettings = systemSettingsResult.rows[0];
    
    res.json({
      id: systemSettings.id,
      name: systemSettings.name || 'CRM System',
      logo_url: systemSettings.logo_url,
      theme: systemSettings.theme,
      features: systemSettings.features
    });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Deals route
apiRouter.get('/deals', authenticateToken, async (req, res) => {
  try {
    const dealsResult = await client.query('SELECT * FROM deals');
    res.json(dealsResult.rows);
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Carriers route
apiRouter.get('/carriers', authenticateToken, async (req, res) => {
  try {
    const carriersResult = await client.query('SELECT * FROM carriers');
    res.json(carriersResult.rows);
  } catch (error) {
    console.error('Error fetching carriers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Products route
apiRouter.get('/products', authenticateToken, async (req, res) => {
  try {
    const productsResult = await client.query('SELECT * FROM products');
    res.json(productsResult.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Positions route
apiRouter.get('/positions', authenticateToken, async (req, res) => {
  try {
    const positionsResult = await client.query('SELECT * FROM positions');
    res.json(positionsResult.rows);
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// System health checks route
apiRouter.get('/system-health-checks', authenticateToken, async (req, res) => {
  try {
    const healthChecksResult = await client.query(
      'SELECT * FROM system_health_checks ORDER BY created_at DESC LIMIT 100'
    );
    res.json(healthChecksResult.rows);
  } catch (error) {
    console.error('Error fetching system health checks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add system health check route
apiRouter.post('/system-health-checks', authenticateToken, async (req, res) => {
  try {
    const { test_value } = req.body;
    const id = uuidv4();
    
    await client.query(
      'INSERT INTO system_health_checks (id, test_value, created_at) VALUES ($1, $2, NOW())',
      [id, test_value]
    );
    
    res.status(201).json({ id });
  } catch (error) {
    console.error('Error adding system health check:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete system health check route
apiRouter.delete('/system-health-checks/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await client.query(
      'DELETE FROM system_health_checks WHERE id = $1',
      [id]
    );
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting system health check:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mount API router
app.use('/crm/api', apiRouter);

// Serve static files
app.use('/crm', express.static(path.join(__dirname, 'dist')));

// Catch-all route for SPA
app.get('/crm/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;

async function startServer() {
  // Connect to the database
  const connected = await connectToDatabase();
  
  if (!connected) {
    console.error('Failed to connect to the database. Server will not start.');
    process.exit(1);
  }
  
  // Start the server
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/crm/api`);
    console.log(`Frontend available at http://localhost:${PORT}/crm`);
  });
}

// Start the server
startServer();
