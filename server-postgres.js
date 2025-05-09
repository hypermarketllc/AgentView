// Apply path-to-regexp patch to handle invalid route patterns
import './path-to-regexp-patch-esm.js';

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pg from 'pg';
import bcrypt from 'bcrypt';

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

// Serve static files with proper MIME types
app.use(express.static(path.join(__dirname, 'dist'), {
  setHeaders: (res, filePath) => {
    // Handle JavaScript files - both regular and module scripts
    if (filePath.endsWith('.js') || filePath.includes('assets/index') && filePath.includes('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (filePath.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    } else if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    }
    
    // Log the file path and content type for debugging
    console.log(`Serving ${filePath} with Content-Type: ${res.getHeader('Content-Type')}`);
  }
}));

console.log('Using PostgreSQL for backend');

// Create a connection pool
const { Pool } = pg;
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'crm_db',
  user: process.env.POSTGRES_USER || 'crm_user',
  password: process.env.POSTGRES_PASSWORD || 'your_strong_password_here'
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected:', res.rows[0]);
  }
});

// Auth functions
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const getUserById = async (id) => {
  try {
    const result = await pool.query(
      `SELECT u.*, p.name as position_name, p.level as position_level 
       FROM users u
       JOIN positions p ON u.position_id = p.id
       WHERE u.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
};

const getUserByEmail = async (email) => {
  try {
    const result = await pool.query(
      `SELECT u.*, p.name as position_name, p.level as position_level 
       FROM users u
       JOIN positions p ON u.position_id = p.id
       WHERE u.email = $1`,
      [email]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
};

const getAuthUserByEmail = async (email) => {
  try {
    const result = await pool.query(
      'SELECT * FROM auth_users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error getting auth user by email:', error);
    return null;
  }
};

const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
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
      VITE_USE_POSTGRES: "true",
      USE_POSTGRES: "true",
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

// Login function
const loginUser = async (email, password) => {
  try {
    // Get user by email
    const user = await getUserByEmail(email);
    
    if (!user) {
      // Only allow test account creation in development mode
      if (process.env.NODE_ENV === 'development' && email === 'agent@example.com' && password === 'Agent123!') {
        // Get agent position
        const positionResult = await pool.query(
          'SELECT id FROM positions WHERE level = 1 LIMIT 1'
        );
        
        if (positionResult.rows.length === 0) {
          return { user: null, token: null, error: 'Agent position not found' };
        }
        
        const positionId = positionResult.rows[0].id;
        
        // Create test user
        const userId = uuidv4();
        
        // Begin transaction
        await pool.query('BEGIN');
        
        // Insert into auth_users with a proper password hash
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
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
        
        const newUser = await getUserById(userId);
        
        if (!newUser) {
          return { user: null, token: null, error: 'Failed to create test user' };
        }
        
        // Generate token
        const token = generateToken({ id: newUser.id, email });
        
        return { user: newUser, token, error: null };
      }
      
      return { user: null, token: null, error: 'Invalid email or password' };
    }
    
    // Get auth user to verify password
    const authUser = await getAuthUserByEmail(email);
    
    if (!authUser) {
      return { user: null, token: null, error: 'Invalid email or password' };
    }
    
    // Verify password using bcrypt
    let passwordValid = false;
    
    try {
      // Try to verify with bcrypt first
      passwordValid = await bcrypt.compare(password, authUser.password_hash);
    } catch (bcryptError) {
      console.warn('Error comparing passwords with bcrypt:', bcryptError);
      
      // For backward compatibility with non-hashed passwords
      if (process.env.NODE_ENV === 'development') {
        // In development, allow specific test accounts
        if ((email === 'admin@example.com' && password === 'Admin123!') || 
            (email === 'agent@example.com' && password === 'Agent123!')) {
          passwordValid = true;
        } else if (password === authUser.password_hash) {
          // For legacy accounts with plain text passwords
          passwordValid = true;
          
          // Upgrade to bcrypt hash
          try {
            const newHash = await bcrypt.hash(password, SALT_ROUNDS);
            await pool.query(
              'UPDATE auth_users SET password_hash = $1 WHERE id = $2',
              [newHash, authUser.id]
            );
            console.log(`Upgraded password hash for user ${authUser.id}`);
          } catch (upgradeError) {
            console.error('Error upgrading password hash:', upgradeError);
          }
        }
      }
    }
    
    if (!passwordValid) {
      return { user: null, token: null, error: 'Invalid email or password' };
    }
    
    // Generate token
    const token = generateToken({ id: user.id, email: user.email });
    
    return { user, token, error: null };
  } catch (error) {
    console.error('Error logging in:', error);
    return { user: null, token: null, error: 'Failed to login' };
  }
};

// Create user function
const createUser = async (email, password, fullName, positionId) => {
  try {
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    
    if (existingUser) {
      return { user: null, token: null, error: 'User already exists' };
    }
    
    // Generate user ID
    const userId = uuidv4();
    
    // Begin transaction
    await pool.query('BEGIN');
    
    // Hash the password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Insert into auth_users
    await pool.query(
      'INSERT INTO auth_users (id, email, password_hash) VALUES ($1, $2, $3)',
      [userId, email, passwordHash]
    );
    
    // Insert into users
    await pool.query(
      'INSERT INTO users (id, email, full_name, position_id, is_active) VALUES ($1, $2, $3, $4, $5)',
      [userId, email, fullName, positionId, true]
    );
    
    // Commit transaction
    await pool.query('COMMIT');
    
    // Get created user
    const user = await getUserById(userId);
    
    if (!user) {
      return { user: null, token: null, error: 'Failed to create user' };
    }
    
    // Generate token
    const token = generateToken({ id: userId, email });
    
    return { user, token, error: null };
  } catch (error) {
    // Rollback transaction
    await pool.query('ROLLBACK');
    
    console.error('Error creating user:', error);
    return { user: null, token: null, error: 'Failed to create user' };
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

// Get all users
app.get('/crm/api/users', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.*, p.name as position_name, p.level as position_level,
              d.full_name as downline_name
       FROM users u
       JOIN positions p ON u.position_id = p.id
       LEFT JOIN users d ON u.id = d.upline_id
       ORDER BY u.full_name`
    );
    
    // Format the response to match the expected structure
    const users = result.rows.map(user => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      position_id: user.position_id,
      upline_id: user.upline_id,
      national_producer_number: user.national_producer_number,
      annual_goal: user.annual_goal,
      is_active: user.is_active,
      positions: {
        id: user.position_id,
        name: user.position_name,
        level: user.position_level
      },
      downline: user.downline_name ? {
        id: user.upline_id,
        full_name: user.downline_name
      } : null
    }));
    
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Update user
app.put('/crm/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      fullName, 
      email, 
      phone, 
      positionId, 
      uplineId, 
      nationalProducerNumber, 
      annualGoal, 
      isActive 
    } = req.body;
    
    // Begin transaction
    await pool.query('BEGIN');
    
    // Update user
    const result = await pool.query(
      `UPDATE users 
       SET full_name = $1, 
           email = $2, 
           phone = $3, 
           position_id = $4, 
           upline_id = $5, 
           national_producer_number = $6, 
           annual_goal = $7, 
           is_active = $8
       WHERE id = $9
       RETURNING *`,
      [fullName, email, phone, positionId, uplineId, nationalProducerNumber, annualGoal, isActive, id]
    );
    
    // Update auth_users email if it changed
    if (email) {
      await pool.query(
        `UPDATE auth_users 
         SET email = $1
         WHERE id = $2`,
        [email, id]
      );
    }
    
    // Commit transaction
    await pool.query('COMMIT');
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    // Rollback transaction
    await pool.query('ROLLBACK');
    
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user with cascade
app.delete('/crm/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Begin transaction
    await pool.query('BEGIN');
    
    // Delete user's deals
    await pool.query('DELETE FROM deals WHERE agent_id = $1', [id]);
    
    // Delete user's commissions
    await pool.query('DELETE FROM commissions WHERE agent_id = $1', [id]);
    
    // Update any users that had this user as upline
    await pool.query(
      'UPDATE users SET upline_id = NULL WHERE upline_id = $1',
      [id]
    );
    
    // Delete from auth_users
    await pool.query('DELETE FROM auth_users WHERE id = $1', [id]);
    
    // Delete from users
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [id]
    );
    
    // Commit transaction
    await pool.query('COMMIT');
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, id });
  } catch (error) {
    // Rollback transaction
    await pool.query('ROLLBACK');
    
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
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

// Create carrier
app.post('/crm/api/carriers', authenticateToken, async (req, res) => {
  try {
    const { name, advance_rate, advance_period_months, payment_type } = req.body;
    
    // Generate carrier ID
    const carrierId = uuidv4();
    
    // Insert carrier
    const result = await pool.query(
      `INSERT INTO carriers 
       (id, name, advance_rate, advance_period_months, payment_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [carrierId, name, advance_rate, advance_period_months, payment_type]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating carrier:', error);
    res.status(500).json({ error: 'Failed to create carrier' });
  }
});

// Update carrier
app.put('/crm/api/carriers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, advance_rate, advance_period_months, payment_type } = req.body;
    
    // Update carrier
    const result = await pool.query(
      `UPDATE carriers 
       SET name = $1, advance_rate = $2, advance_period_months = $3, payment_type = $4
       WHERE id = $5
       RETURNING *`,
      [name, advance_rate, advance_period_months, payment_type, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Carrier not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating carrier:', error);
    res.status(500).json({ error: 'Failed to update carrier' });
  }
});

// Delete carrier
app.delete('/crm/api/carriers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Begin transaction
    await pool.query('BEGIN');
    
    // Get all products for this carrier
    const productsResult = await pool.query(
      'SELECT id FROM products WHERE carrier_id = $1',
      [id]
    );
    
    const productIds = productsResult.rows.map(p => p.id);
    
    // Delete commission splits for all products
    if (productIds.length > 0) {
      await pool.query(
        'DELETE FROM commission_splits WHERE product_id = ANY($1::uuid[])',
        [productIds]
      );
    }
    
    // Delete products
    await pool.query(
      'DELETE FROM products WHERE carrier_id = $1',
      [id]
    );
    
    // Delete carrier
    const result = await pool.query(
      'DELETE FROM carriers WHERE id = $1 RETURNING *',
      [id]
    );
    
    // Commit transaction
    await pool.query('COMMIT');
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Carrier not found' });
    }
    
    res.json({ success: true, id });
  } catch (error) {
    // Rollback transaction
    await pool.query('ROLLBACK');
    
    console.error('Error deleting carrier:', error);
    res.status(500).json({ error: 'Failed to delete carrier' });
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

// Create product
app.post('/crm/api/products', authenticateToken, async (req, res) => {
  try {
    const { name, carrier_id } = req.body;
    
    // Generate product ID
    const productId = uuidv4();
    
    // Insert product
    const result = await pool.query(
      `INSERT INTO products 
       (id, name, carrier_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [productId, name, carrier_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
app.put('/crm/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    // Update product
    const result = await pool.query(
      `UPDATE products 
       SET name = $1
       WHERE id = $2
       RETURNING *`,
      [name, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
app.delete('/crm/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Begin transaction
    await pool.query('BEGIN');
    
    // Delete commission splits for this product
    await pool.query(
      'DELETE FROM commission_splits WHERE product_id = $1',
      [id]
    );
    
    // Delete product
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING *',
      [id]
    );
    
    // Commit transaction
    await pool.query('COMMIT');
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ success: true, id });
  } catch (error) {
    // Rollback transaction
    await pool.query('ROLLBACK');
    
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
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

// Create position
app.post('/crm/api/positions', authenticateToken, async (req, res) => {
  try {
    const { name, level, description } = req.body;
    
    // Generate position ID
    const positionId = uuidv4();
    
    // Insert position
    const result = await pool.query(
      `INSERT INTO positions 
       (id, name, level, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [positionId, name, level, description]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating position:', error);
    res.status(500).json({ error: 'Failed to create position' });
  }
});

// Update position
app.put('/crm/api/positions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, level, description } = req.body;
    
    // Update position
    const result = await pool.query(
      `UPDATE positions 
       SET name = $1, level = $2, description = $3
       WHERE id = $4
       RETURNING *`,
      [name, level, description, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Position not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating position:', error);
    res.status(500).json({ error: 'Failed to update position' });
  }
});

// Delete position
app.delete('/crm/api/positions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Begin transaction
    await pool.query('BEGIN');
    
    // Delete commission splits for this position
    await pool.query(
      'DELETE FROM commission_splits WHERE position_id = $1',
      [id]
    );
    
    // Delete position
    const result = await pool.query(
      'DELETE FROM positions WHERE id = $1 RETURNING *',
      [id]
    );
    
    // Commit transaction
    await pool.query('COMMIT');
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Position not found' });
    }
    
    res.json({ success: true, id });
  } catch (error) {
    // Rollback transaction
    await pool.query('ROLLBACK');
    
    console.error('Error deleting position:', error);
    res.status(500).json({ error: 'Failed to delete position' });
  }
});

// Get commission splits
app.get('/crm/api/commission-splits', authenticateToken, async (req, res) => {
  try {
    const productId = req.query.productId;
    
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    
    const result = await pool.query(
      `SELECT cs.*, p.name as position_name, p.level as position_level
       FROM commission_splits cs
       JOIN positions p ON cs.position_id = p.id
       WHERE cs.product_id = $1`,
      [productId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting commission splits:', error);
    res.status(500).json({ error: 'Failed to get commission splits' });
  }
});

// Create commission split
app.post('/crm/api/commission-splits', authenticateToken, async (req, res) => {
  try {
    const { product_id, position_id, percentage } = req.body;
    
    // Generate commission split ID
    const splitId = uuidv4();
    
    // Insert commission split
    const result = await pool.query(
      `INSERT INTO commission_splits 
       (id, product_id, position_id, percentage)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [splitId, product_id, position_id, percentage]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating commission split:', error);
    res.status(500).json({ error: 'Failed to create commission split' });
  }
});

// Update commission split
app.put('/crm/api/commission-splits/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { percentage } = req.body;
    
    // Update commission split
    const result = await pool.query(
      `UPDATE commission_splits 
       SET percentage = $1
       WHERE id = $2
       RETURNING *`,
      [percentage, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Commission split not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating commission split:', error);
    res.status(500).json({ error: 'Failed to update commission split' });
  }
});

// Delete commission split
app.delete('/crm/api/commission-splits/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete commission split
    const result = await pool.query(
      'DELETE FROM commission_splits WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Commission split not found' });
    }
    
    res.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting commission split:', error);
    res.status(500).json({ error: 'Failed to delete commission split' });
  }
});

// Add a diagnostic endpoint to check MIME type handling
app.get('/crm/api/check-mime', (req, res) => {
  res.json({
    status: 'ok',
    message: 'MIME type handling is active',
    supportedTypes: {
      '.js': 'application/javascript; charset=utf-8',
      '.mjs': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.html': 'text/html; charset=utf-8'
    }
  });
});

// Ensure all routes under /crm/assets are properly handled
app.get('/crm/assets/*', (req, res, next) => {
  const assetPath = req.path.replace('/crm', '');
  const filePath = path.join(__dirname, 'dist', assetPath);
  
  console.log(`Asset request: ${req.path} -> ${filePath}`);
  
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    // Handle JavaScript files - both regular and module scripts
    if (ext === '.js' || ext === '.mjs' || filePath.includes('assets/index') && filePath.includes('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      console.log(`Setting Content-Type for ${filePath}: application/javascript`);
    } else if (ext === '.css') {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
      console.log(`Setting Content-Type for ${filePath}: text/css`);
    }
    res.sendFile(filePath);
  } else {
    console.log(`File not found: ${filePath}`);
    next();
  }
});

// Special handler for the index.js file
app.get('/crm/assets/index*.js', (req, res) => {
  const assetPath = req.path.replace('/crm', '');
  const filePath = path.join(__dirname, 'dist', assetPath);
  
  console.log(`Module script request: ${req.path} -> ${filePath}`);
  
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    console.log(`Setting Content-Type for module script: application/javascript`);
    res.sendFile(filePath);
  } else {
    console.log(`Module script not found: ${filePath}`);
    res.status(404).send('Not found');
  }
});

// Serve the modified index.html for all routes under /crm
app.get('/crm', (req, res) => {
  res.send(indexHtml);
});

app.get('/crm/*', (req, res, next) => {
  // Skip API and assets routes
  if (req.path.startsWith('/crm/api') || req.path.startsWith('/crm/assets')) {
    return next();
  }
  res.send(indexHtml);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CRM available at: http://localhost:${PORT}/crm`);
  console.log(`API available at: http://localhost:${PORT}/crm/api`);
});
