import express from 'express';
import path from 'path';
import pg from 'pg';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const SALT_ROUNDS = 10;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Supabase environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Use existing user IDs from the database
const existingUsers = {
  'admin@example.com': {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    fullName: 'Admin User',
    position: {
      id: '599470e2-3803-41a2-a792-82911e60c2f4',
      name: 'Admin',
      level: 3
    }
  },
  'admin@americancoveragecenter.com': {
    id: 'a9692c3e-a415-4fc3-a3e0-30c8eb652f09',
    fullName: 'American Coverage Center',
    position: {
      id: '8395f610-6c95-4cd5-b778-ee6825ac78d1',
      name: 'Owner',
      level: 4
    }
  },
  'adam@americancoveragecenter.com': {
    id: '322f6f66-d38f-404a-a2cb-76e7e2f2ae4c',
    fullName: 'Adam Yoder',
    position: {
      id: 'ec2cfd8f-024d-4b5c-b23d-fd26d951f1bb',
      name: 'Manager',
      level: 2
    }
  },
  'test@test.com': {
    id: 'fde405d9-03f2-4141-b619-5ebff6c641e4',
    fullName: 'Test Test',
    position: {
      id: '599470e2-3803-41a2-a792-82911e60c2f4',
      name: 'Admin',
      level: 3
    }
  },
  'default': {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // Admin User as default
    fullName: 'Default User',
    position: {
      id: '599470e2-3803-41a2-a792-82911e60c2f4',
      name: 'Agent',
      level: 1
    }
  }
};

// PostgreSQL connection
const { Pool } = pg;
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
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
    
    // Create auth_users table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS auth_users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

// Initialize database
await initializeDatabase();

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      
      try {
        // Get user from database
        const userResult = await pool.query(
          `SELECT u.*, p.name as position_name, p.level as position_level 
           FROM users u
           JOIN positions p ON u.position_id = p.id
           WHERE u.id = $1`,
          [decoded.userId]
        );
        
        if (userResult.rows.length === 0) {
          return res.status(403).json({ error: 'User not found' });
        }
        
        // Set user in request
        req.user = userResult.rows[0];
        
        next();
      } catch (error) {
        console.error('Error getting user:', error);
        return res.status(500).json({ error: 'Authentication failed' });
      }
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

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
      VITE_SUPABASE_URL: "${SUPABASE_URL}",
      VITE_SUPABASE_ANON_KEY: "${SUPABASE_ANON_KEY}",
      API_URL: "/crm/api"
    };
  </script>
`;

// Insert the script tag before the closing head tag
indexHtml = indexHtml.replace('</head>', `${envScript}</head>`);

// Serve static files
app.use('/crm', express.static(path.join(__dirname, 'dist')));

// API routes
// Health check
app.get('/crm/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Login
app.post('/crm/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Special case for test account
    if (email === 'agent@example.com' && password === 'Agent123!') {
      // Get agent position
      const positionResult = await pool.query(
        'SELECT id FROM positions WHERE level = 1 LIMIT 1'
      );
      
      if (positionResult.rows.length === 0) {
        return res.status(500).json({ error: 'Agent position not found' });
      }
      
      const positionId = positionResult.rows[0].id;
      
      // Check if test user exists
      const userResult = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      
      let userId;
      
      if (userResult.rows.length === 0) {
        // Create test user
        userId = uuidv4();
        
        // Hash password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        
        // Begin transaction
        await pool.query('BEGIN');
        
        // Insert into auth_users
        await pool.query(
          'INSERT INTO auth_users (id, email, password_hash) VALUES ($1, $2, $3)',
          [userId, email, passwordHash]
        );
        
        // Insert into users
        await pool.query(
          'INSERT INTO users (id, email, full_name, position_id, is_active) VALUES ($1, $2, $3, $4, $5)',
          [userId, email, 'Test Agent', positionId, true]
        );
        
        // Commit transaction
        await pool.query('COMMIT');
      } else {
        userId = userResult.rows[0].id;
      }
      
      // Get user
      const user = await pool.query(
        `SELECT u.*, p.name as position_name, p.level as position_level 
         FROM users u
         JOIN positions p ON u.position_id = p.id
         WHERE u.id = $1`,
        [userId]
      );
      
      if (user.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Generate token
      const token = jwt.sign(
        { userId, email },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      return res.json({
        user: {
          id: user.rows[0].id,
          email: user.rows[0].email,
          fullName: user.rows[0].full_name,
          position: {
            id: user.rows[0].position_id,
            name: user.rows[0].position_name,
            level: user.rows[0].position_level
          }
        },
        token
      });
    }
    
    // Get user data from existing users or use default
    const userData = existingUsers[email] || existingUsers['default'];
    
    // Generate token
    const token = jwt.sign(
      { userId: userData.id, email: email || 'default@example.com' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    return res.json({
      user: {
        id: userData.id,
        email: email || 'default@example.com',
        fullName: userData.fullName,
        position: userData.position
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Register
app.post('/crm/api/auth/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    
    // Use default user data
    const userData = existingUsers['default'];
    
    // Generate token
    const token = jwt.sign(
      { userId: userData.id, email: email || 'new@example.com' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      user: {
        id: userData.id,
        email: email || 'new@example.com',
        fullName: fullName || 'New User',
        position: userData.position
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get current user
app.get('/crm/api/auth/me', authenticateToken, (req, res) => {
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
});

// Get deals
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
    console.error('Error getting deals:', error);
    res.status(500).json({ error: 'Failed to get deals' });
  }
});

// Get carriers
app.get('/crm/api/carriers', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM carriers ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting carriers:', error);
    res.status(500).json({ error: 'Failed to get carriers' });
  }
});

// Get products
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
    console.error('Error getting products:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

// Get positions
app.get('/crm/api/positions', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM positions ORDER BY level DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting positions:', error);
    res.status(500).json({ error: 'Failed to get positions' });
  }
});

// Create deal
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
    console.error('Error creating deal:', error);
    res.status(500).json({ error: 'Failed to create deal' });
  }
});

// Serve the modified index.html for all routes under /crm
app.get('/crm', (req, res) => {
  res.send(indexHtml);
});

app.get('/crm/*', (req, res) => {
  res.send(indexHtml);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CRM available at: http://localhost:${PORT}/crm`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log(`Supabase Anon Key: ${SUPABASE_ANON_KEY ? 'Set' : 'Not set'}`);
});