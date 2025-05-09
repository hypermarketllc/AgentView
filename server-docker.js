import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pg from 'pg';
import { setupApiRoutes } from './server-docker-routes.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const SALT_ROUNDS = 10;

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// PostgreSQL connection
const { Pool } = pg;
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'db',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'crm_db',
  user: process.env.POSTGRES_USER || 'crm_user',
  password: process.env.POSTGRES_PASSWORD || 'your_strong_password_here'
});

// Initialize database
async function initializeDatabase() {
  try {
    // Test connection
    const res = await pool.query('SELECT NOW()');
    console.log('Database connected:', res.rows[0]);
    
    // Create tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        position_id UUID NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS positions (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        level INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS carriers (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        carrier_id UUID NOT NULL REFERENCES carriers(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deals (
        id UUID PRIMARY KEY,
        agent_id UUID NOT NULL REFERENCES users(id),
        carrier_id UUID NOT NULL REFERENCES carriers(id),
        product_id UUID NOT NULL REFERENCES products(id),
        client_name VARCHAR(255) NOT NULL,
        annual_premium NUMERIC(10, 2) NOT NULL,
        app_number VARCHAR(255),
        client_phone VARCHAR(255),
        effective_date DATE,
        from_referral BOOLEAN DEFAULT FALSE,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    // Check if positions table is empty
    const positionsCount = await pool.query('SELECT COUNT(*) FROM positions');
    if (parseInt(positionsCount.rows[0].count) === 0) {
      // Insert default positions
      await pool.query(`
        INSERT INTO positions (id, name, level) VALUES
        ('8395f610-6c95-4cd5-b778-ee6825ac78d1', 'Owner', 4),
        ('599470e2-3803-41a2-a792-82911e60c2f4', 'Admin', 3),
        ('ec2cfd8f-024d-4b5c-b23d-fd26d951f1bb', 'Manager', 2),
        ('b9a5f115-6c8a-4c0e-8c2b-35c1e8a98a7d', 'Agent', 1)
      `);
    }
    
    // Check if users table is empty
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(usersCount.rows[0].count) === 0) {
      // Insert default admin user
      const adminId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
      const adminEmail = 'admin@example.com';
      const adminPassword = 'Admin123!';
      const adminPasswordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);
      
      await pool.query(`
        INSERT INTO users (id, email, password_hash, full_name, position_id) VALUES
        ($1, $2, $3, $4, $5)
      `, [adminId, adminEmail, adminPasswordHash, 'Admin User', '599470e2-3803-41a2-a792-82911e60c2f4']);
      
      console.log('Default admin user created:');
      console.log('  Email:', adminEmail);
      console.log('  Password:', adminPassword);
    }
    
    // Check if carriers table is empty
    const carriersCount = await pool.query('SELECT COUNT(*) FROM carriers');
    if (parseInt(carriersCount.rows[0].count) === 0) {
      // Insert default carriers
      await pool.query(`
        INSERT INTO carriers (id, name) VALUES
        ('c1d2e3f4-a1b2-c3d4-e5f6-a1b2c3d4e5f6', 'Carrier A'),
        ('d2e3f4g5-b2c3-d4e5-f6g7-b2c3d4e5f6g7', 'Carrier B'),
        ('e3f4g5h6-c3d4-e5f6-g7h8-c3d4e5f6g7h8', 'Carrier C')
      `);
      
      // Insert default products
      await pool.query(`
        INSERT INTO products (id, name, carrier_id) VALUES
        ('f4g5h6i7-d4e5-f6g7-h8i9-d4e5f6g7h8i9', 'Product A1', 'c1d2e3f4-a1b2-c3d4-e5f6-a1b2c3d4e5f6'),
        ('g5h6i7j8-e5f6-g7h8-i9j0-e5f6g7h8i9j0', 'Product A2', 'c1d2e3f4-a1b2-c3d4-e5f6-a1b2c3d4e5f6'),
        ('h6i7j8k9-f6g7-h8i9-j0k1-f6g7h8i9j0k1', 'Product B1', 'd2e3f4g5-b2c3-d4e5-f6g7-b2c3d4e5f6g7'),
        ('i7j8k9l0-g7h8-i9j0-k1l2-g7h8i9j0k1l2', 'Product C1', 'e3f4g5h6-c3d4-e5f6-g7h8-c3d4e5f6g7h8')
      `);
    }
    
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

// Read the index.html file
const indexPath = path.join(__dirname, 'dist', 'index.html');
let indexHtml = '';

try {
  indexHtml = fs.readFileSync(indexPath, 'utf8');
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

// Helper function to authenticate requests
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database
    const userResult = await pool.query(
      `SELECT u.*, p.name as position_name, p.level as position_level 
       FROM users u
       JOIN positions p ON u.position_id = p.id
       WHERE u.id = $1`,
      [decoded.userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = userResult.rows[0];
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// API routes
app.get('/crm/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.post('/crm/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Get user from database
    const userResult = await pool.query(
      `SELECT u.*, p.name as position_name, p.level as position_level 
       FROM users u
       JOIN positions p ON u.position_id = p.id
       WHERE u.email = $1`,
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = userResult.rows[0];
    
    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        position: {
          id: user.position_id,
          name: user.position_name,
          level: user.position_level
        }
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/crm/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName, positionId } = req.body;
    
    // Check if email already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Generate user ID
    const userId = uuidv4();
    
    // Insert user
    await pool.query(
      `INSERT INTO users (id, email, password_hash, full_name, position_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, email, passwordHash, fullName, positionId || 'b9a5f115-6c8a-4c0e-8c2b-35c1e8a98a7d']
    );
    
    // Get user with position
    const userResult = await pool.query(
      `SELECT u.*, p.name as position_name, p.level as position_level 
       FROM users u
       JOIN positions p ON u.position_id = p.id
       WHERE u.id = $1`,
      [userId]
    );
    
    const user = userResult.rows[0];
    
    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        position: {
          id: user.position_id,
          name: user.position_name,
          level: user.position_level
        }
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.get('/crm/api/auth/me', authenticateToken, (req, res) => {
  try {
    res.json({
      id: req.user.id,
      email: req.user.email,
      fullName: req.user.full_name,
      position: {
        id: req.user.position_id,
        name: req.user.position_name,
        level: req.user.position_level
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get current user' });
  }
});

app.get('/crm/api/deals', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, 
              u.full_name as agent_name, 
              c.name as carrier_name, 
              p.name as product_name
       FROM deals d
       JOIN users u ON d.agent_id = u.id
       JOIN carriers c ON d.carrier_id = c.id
       JOIN products p ON d.product_id = p.id
       ORDER BY d.created_at DESC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get deals error:', error);
    res.status(500).json({ error: 'Failed to get deals' });
  }
});

app.get('/crm/api/carriers', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM carriers ORDER BY name');
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get carriers error:', error);
    res.status(500).json({ error: 'Failed to get carriers' });
  }
});

app.get('/crm/api/products', authenticateToken, async (req, res) => {
  try {
    const carrierId = req.query.carrierId;
    
    let query = 'SELECT * FROM products';
    let params = [];
    
    if (carrierId) {
      query += ' WHERE carrier_id = $1';
      params.push(carrierId);
    }
    
    query += ' ORDER BY name';
    
    const result = await pool.query(query, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

app.get('/crm/api/positions', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM positions ORDER BY level DESC');
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get positions error:', error);
    res.status(500).json({ error: 'Failed to get positions' });
  }
});

app.post('/crm/api/deals', authenticateToken, async (req, res) => {
  try {
    const { carrierId, productId, clientName, annualPremium, appNumber, clientPhone, effectiveDate, fromReferral } = req.body;
    
    // Generate deal ID
    const dealId = uuidv4();
    
    // Insert deal
    const result = await pool.query(
      `INSERT INTO deals 
       (id, agent_id, carrier_id, product_id, client_name, annual_premium, app_number, client_phone, effective_date, from_referral, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
       RETURNING *`,
      [dealId, req.user.id, carrierId, productId, clientName, annualPremium, appNumber, clientPhone, effectiveDate, fromReferral, 'Submitted']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create deal error:', error);
    res.status(500).json({ error: 'Failed to create deal' });
  }
});

// Serve static files from the dist directory
app.use('/crm/assets', express.static(path.join(__dirname, 'dist', 'assets')));

// Serve index.html for all other routes under /crm
app.get('/crm*', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(indexHtml);
});

// Redirect root to /crm
app.get('/', (req, res) => {
  res.redirect('/crm');
});

// Initialize database and start server
async function start() {
  try {
    await initializeDatabase();
    
    // Setup API routes from server-docker-routes.js
    setupApiRoutes(app, pool, authenticateToken);
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`CRM available at: http://localhost:${PORT}/crm`);
      console.log(`API available at: http://localhost:${PORT}/crm/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

start();
