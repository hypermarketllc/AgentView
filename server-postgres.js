import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { loginUser, createUser, getUserById, verifyToken } from './src/lib/auth.js';
import pool from './src/lib/postgres.js';
import { v4 as uuidv4 } from 'uuid';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Supabase environment variables (still needed for frontend)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', SUPABASE_URL);
console.log('Supabase Anon Key:', SUPABASE_ANON_KEY ? 'Set' : 'Not set');
console.log('Using PostgreSQL for backend');

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

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    const user = await getUserById(decoded.userId);
    
    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// API routes
// Health check
app.get('/crm/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Login
app.post('/crm/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await loginUser(email, password);
    
    if (result.error) {
      return res.status(401).json({ error: result.error });
    }
    
    return res.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.full_name,
        position: {
          id: result.user.position_id,
          name: result.user.position_name,
          level: result.user.position_level
        }
      },
      token: result.token
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
    
    // Get default position (Agent)
    const positionResult = await pool.query(
      'SELECT id FROM positions WHERE level = 1 LIMIT 1'
    );
    
    if (positionResult.rows.length === 0) {
      return res.status(500).json({ error: 'Default position not found' });
    }
    
    const positionId = positionResult.rows[0].id;
    
    const result = await createUser(email, password, fullName, positionId);
    
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    
    return res.status(201).json({
      user: {
        id: result.user.id,
        email: result.user.email,
        fullName: result.user.full_name,
        position: {
          id: result.user.position_id,
          name: result.user.position_name,
          level: result.user.position_level
        }
      },
      token: result.token
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
  console.log(`API available at: http://localhost:${PORT}/crm/api`);
});