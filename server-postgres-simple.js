import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pg from 'pg';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Middleware
app.use(cors());
app.use(express.json());

// Supabase environment variables (still needed for frontend)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Supabase URL:', SUPABASE_URL);
console.log('Supabase Anon Key:', SUPABASE_ANON_KEY ? 'Set' : 'Not set');
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
      VITE_SUPABASE_URL: "${SUPABASE_URL.replace(/"/g, '\\"')}",
      VITE_SUPABASE_ANON_KEY: "${SUPABASE_ANON_KEY.replace(/"/g, '\\"')}",
      VITE_USE_POSTGRES: "true",
      API_URL: "/crm/api",
      BASE_PATH: "/crm"
    };
  </script>
`;

// Fix module script type issues
indexHtml = indexHtml.replace(/<script type="module" crossorigin/g, '<script type="module" crossorigin="anonymous"');

// Fix asset paths
indexHtml = indexHtml.replace(/src="\/assets\//g, 'src="/crm/assets/');
indexHtml = indexHtml.replace(/href="\/assets\//g, 'href="/crm/assets/');

// Insert the script tag before the closing head tag
indexHtml = indexHtml.replace('</head>', `${envScript}</head>`);

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

// Role-based access control
const checkPermission = (requiredLevel) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userLevel = req.user.position_level || 0;
    
    if (userLevel < requiredLevel) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

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

// Serve static files with proper MIME types
app.use('/crm/assets', express.static(path.join(__dirname, 'dist', 'assets'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (filePath.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    }
  }
}));

// API Routes
app.get('/crm/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Generate tokens
const generateTokens = (user) => {
  // Access token - short lived (24 hours)
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  // Refresh token - longer lived (7 days)
  const refreshToken = jwt.sign(
    { userId: user.id, email: user.email, tokenType: 'refresh' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Login
app.post('/crm/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Get auth user
    const authUserResult = await pool.query(
      'SELECT * FROM auth_users WHERE email = $1',
      [email]
    );
    
    if (authUserResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const authUser = authUserResult.rows[0];
    
    // Verify password using bcrypt
    const bcrypt = await import('bcrypt');
    const passwordMatch = await bcrypt.compare(password, authUser.password_hash);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Get user details
    const userResult = await pool.query(
      `SELECT u.*, p.name as position_name, p.level as position_level 
       FROM users u
       JOIN positions p ON u.position_id = p.id
       WHERE u.id = $1`,
      [authUser.id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);
    
    return res.json({
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
      token: accessToken,
      refreshToken: refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
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

// Refresh token
app.post('/crm/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }
    
    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    
    if (!decoded || decoded.tokenType !== 'refresh') {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }
    
    // Get user
    const user = await getUserById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate new tokens
    const tokens = generateTokens(user);
    
    res.json({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Get deals
app.get('/crm/api/deals', authenticateToken, async (req, res) => {
  try {
    // Add filtering options
    const { agentId, carrierId, status, startDate, endDate } = req.query;
    
    let query = `
      SELECT d.*, 
              u.full_name as agent_name, 
              c.name as carrier_name, 
              p.name as product_name
       FROM deals d
       JOIN users u ON d.agent_id = u.id
       JOIN carriers c ON d.carrier_id = c.id
       JOIN products p ON d.product_id = p.id
    `;
    
    const queryParams = [];
    const conditions = [];
    
    // Add filters
    if (agentId) {
      queryParams.push(agentId);
      conditions.push(`d.agent_id = $${queryParams.length}`);
    }
    
    if (carrierId) {
      queryParams.push(carrierId);
      conditions.push(`d.carrier_id = $${queryParams.length}`);
    }
    
    if (status) {
      queryParams.push(status);
      conditions.push(`d.status = $${queryParams.length}`);
    }
    
    if (startDate) {
      queryParams.push(startDate);
      conditions.push(`d.created_at >= $${queryParams.length}`);
    }
    
    if (endDate) {
      queryParams.push(endDate);
      conditions.push(`d.created_at <= $${queryParams.length}`);
    }
    
    // If not admin/manager, only show own deals
    if (req.user.position_level < 3) {
      queryParams.push(req.user.id);
      conditions.push(`d.agent_id = $${queryParams.length}`);
    }
    
    // Add WHERE clause if there are conditions
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ' ORDER BY d.created_at DESC';
    
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting deals:', error);
    res.status(500).json({ error: 'Failed to get deals' });
  }
});

// Create deal
app.post('/crm/api/deals', authenticateToken, async (req, res) => {
  try {
    const {
      client_name,
      client_email,
      client_phone,
      policy_number,
      premium_amount,
      commission_amount,
      status,
      notes,
      carrier_id,
      product_id
    } = req.body;
    
    // Validate required fields
    if (!client_name || !carrier_id || !product_id || !premium_amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Use the current user as the agent if not specified
    const agent_id = req.body.agent_id || req.user.id;
    
    // Check if user has permission to create deals for other agents
    if (agent_id !== req.user.id && req.user.position_level < 3) {
      return res.status(403).json({ error: 'Insufficient permissions to create deals for other agents' });
    }
    
    // Insert the deal
    const result = await pool.query(
      `INSERT INTO deals (
        id,
        client_name,
        client_email,
        client_phone,
        policy_number,
        premium_amount,
        commission_amount,
        status,
        notes,
        agent_id,
        carrier_id,
        product_id,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *`,
      [
        uuidv4(),
        client_name,
        client_email || null,
        client_phone || null,
        policy_number || null,
        premium_amount,
        commission_amount || null,
        status || 'Pending',
        notes || null,
        agent_id,
        carrier_id,
        product_id
      ]
    );
    
    // Get the created deal with related info
    const dealResult = await pool.query(
      `SELECT d.*, 
              u.full_name as agent_name, 
              c.name as carrier_name, 
              p.name as product_name
       FROM deals d
       JOIN users u ON d.agent_id = u.id
       JOIN carriers c ON d.carrier_id = c.id
       JOIN products p ON d.product_id = p.id
       WHERE d.id = $1`,
      [result.rows[0].id]
    );
    
    // Create commission record if commission amount is provided
    if (commission_amount) {
      // Get commission split percentage for the agent
      const splitResult = await pool.query(
        `SELECT percentage FROM commission_splits 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [agent_id]
      );
      
      const percentage = splitResult.rows.length > 0 ? splitResult.rows[0].percentage : 100;
      
      await pool.query(
        `INSERT INTO commissions (
          id,
          user_id,
          deal_id,
          amount,
          percentage,
          status,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [
          uuidv4(),
          agent_id,
          result.rows[0].id,
          commission_amount,
          percentage,
          'Pending'
        ]
      );
    }
    
    res.status(201).json(dealResult.rows[0]);
  } catch (error) {
    console.error('Error creating deal:', error);
    res.status(500).json({ error: 'Failed to create deal' });
  }
});

// Update deal
app.put('/crm/api/deals/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if deal exists and get current agent_id
    const dealCheck = await pool.query('SELECT agent_id FROM deals WHERE id = $1', [id]);
    
    if (dealCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    // Check if user has permission to update this deal
    const currentAgentId = dealCheck.rows[0].agent_id;
    if (currentAgentId !== req.user.id && req.user.position_level < 3) {
      return res.status(403).json({ error: 'Insufficient permissions to update this deal' });
    }
    
    const {
      client_name,
      client_email,
      client_phone,
      policy_number,
      premium_amount,
      commission_amount,
      status,
      notes,
      agent_id,
      carrier_id,
      product_id
    } = req.body;
    
    // Build update query dynamically
    const updates = [];
    const values = [id];
    let paramIndex = 2;
    
    if (client_name !== undefined) {
      updates.push(`client_name = $${paramIndex++}`);
      values.push(client_name);
    }
    
    if (client_email !== undefined) {
      updates.push(`client_email = $${paramIndex++}`);
      values.push(client_email);
    }
    
    if (client_phone !== undefined) {
      updates.push(`client_phone = $${paramIndex++}`);
      values.push(client_phone);
    }
    
    if (policy_number !== undefined) {
      updates.push(`policy_number = $${paramIndex++}`);
      values.push(policy_number);
    }
    
    if (premium_amount !== undefined) {
      updates.push(`premium_amount = $${paramIndex++}`);
      values.push(premium_amount);
    }
    
    if (commission_amount !== undefined) {
      updates.push(`commission_amount = $${paramIndex++}`);
      values.push(commission_amount);
    }
    
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    
    if (notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(notes);
    }
    
    if (agent_id !== undefined) {
      // Check if user has permission to change agent
      if (req.user.position_level < 3) {
        return res.status(403).json({ error: 'Insufficient permissions to change deal agent' });
      }
      updates.push(`agent_id = $${paramIndex++}`);
      values.push(agent_id);
    }
    
    if (carrier_id !== undefined) {
      updates.push(`carrier_id = $${paramIndex++}`);
      values.push(carrier_id);
    }
    
    if (product_id !== undefined) {
      updates.push(`product_id = $${paramIndex++}`);
      values.push(product_id);
    }
    
    // Add updated_at
    updates.push(`updated_at = NOW()`);
    
    // If no updates, return the deal
    if (updates.length === 1) { // Only updated_at
      const result = await pool.query(
        `SELECT d.*, 
                u.full_name as agent_name, 
                c.name as carrier_name, 
                p.name as product_name
         FROM deals d
         JOIN users u ON d.agent_id = u.id
         JOIN carriers c ON d.carrier_id = c.id
         JOIN products p ON d.product_id = p.id
         WHERE d.id = $1`,
        [id]
      );
      
      return res.json(result.rows[0]);
    }
    
    // Update the deal
    await pool.query(
      `UPDATE deals SET ${updates.join(', ')} WHERE id = $1`,
      values
    );
    
    // Update commission if commission_amount changed
    if (commission_amount !== undefined) {
      // Check if commission exists
      const commissionCheck = await pool.query(
        'SELECT id FROM commissions WHERE deal_id = $1',
        [id]
      );
      
      if (commissionCheck.rows.length > 0) {
        // Update existing commission
        await pool.query(
          `UPDATE commissions SET amount = $1, updated_at = NOW() WHERE deal_id = $2`,
          [commission_amount, id]
        );
      } else {
        // Create new commission
        const agentToUse = agent_id || currentAgentId;
        
        // Get commission split percentage for the agent
        const splitResult = await pool.query(
          `SELECT percentage FROM commission_splits 
           WHERE user_id = $1 
           ORDER BY created_at DESC 
           LIMIT 1`,
          [agentToUse]
        );
        
        const percentage = splitResult.rows.length > 0 ? splitResult.rows[0].percentage : 100;
        
        await pool.query(
          `INSERT INTO commissions (
            id,
            user_id,
            deal_id,
            amount,
            percentage,
            status,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
          [
            uuidv4(),
            agentToUse,
            id,
            commission_amount,
            percentage,
            'Pending'
          ]
        );
      }
    }
    
    // Get the updated deal with related info
    const result = await pool.query(
      `SELECT d.*, 
              u.full_name as agent_name, 
              c.name as carrier_name, 
              p.name as product_name
       FROM deals d
       JOIN users u ON d.agent_id = u.id
       JOIN carriers c ON d.carrier_id = c.id
       JOIN products p ON d.product_id = p.id
       WHERE d.id = $1`,
      [id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating deal:', error);
    res.status(500).json({ error: 'Failed to update deal' });
  }
});

// Delete deal
app.delete('/crm/api/deals/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if deal exists and get current agent_id
    const dealCheck = await pool.query('SELECT agent_id FROM deals WHERE id = $1', [id]);
    
    if (dealCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    // Check if user has permission to delete this deal
    const currentAgentId = dealCheck.rows[0].agent_id;
    if (currentAgentId !== req.user.id && req.user.position_level < 4) { // Only admin can delete other's deals
      return res.status(403).json({ error: 'Insufficient permissions to delete this deal' });
    }
    
    // Delete associated commissions first
    await pool.query('DELETE FROM commissions WHERE deal_id = $1', [id]);
    
    // Delete the deal
    await pool.query('DELETE FROM deals WHERE id = $1', [id]);
    
    res.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    console.error('Error deleting deal:', error);
    res.status(500).json({ error: 'Failed to delete deal' });
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
app.get('/crm/api/positions', authenticateToken, checkPermission(3), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM positions ORDER BY level DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting positions:', error);
    res.status(500).json({ error: 'Failed to get positions' });
  }
});

// Get users (agents)
app.get('/crm/api/users', authenticateToken, checkPermission(2), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.national_producer_number, u.annual_goal, u.phone, u.is_active,
              p.id as position_id, p.name as position_name, p.level as position_level
       FROM users u
       JOIN positions p ON u.position_id = p.id
       ORDER BY u.full_name`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get commissions
app.get('/crm/api/commissions', authenticateToken, async (req, res) => {
  try {
    // If user is not admin or manager, only show their own commissions
    let query = `
      SELECT c.*, 
             d.client_name, d.policy_number, d.premium_amount,
             u.full_name as user_name,
             ca.name as carrier_name,
             p.name as product_name
      FROM commissions c
      JOIN deals d ON c.deal_id = d.id
      JOIN users u ON c.user_id = u.id
      JOIN carriers ca ON d.carrier_id = ca.id
      JOIN products p ON d.product_id = p.id
    `;
    
    const params = [];
    
    // If not admin/manager, only show own commissions
    if (req.user.position_level < 3) {
      query += ' WHERE c.user_id = $1';
      params.push(req.user.id);
    }
    
    query += ' ORDER BY c.created_at DESC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting commissions:', error);
    res.status(500).json({ error: 'Failed to get commissions' });
  }
});

// Get commission splits
app.get('/crm/api/commission-splits', authenticateToken, checkPermission(3), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cs.*, 
              u.full_name as user_name,
              p.name as position_name
       FROM commission_splits cs
       JOIN users u ON cs.user_id = u.id
       JOIN positions p ON cs.position_id = p.id
       ORDER BY p.level DESC, u.full_name`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting commission splits:', error);
    res.status(500).json({ error: 'Failed to get commission splits' });
  }
});

// User Settings API

// Get user settings
app.get('/crm/api/user-settings', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.national_producer_number, u.annual_goal, u.phone, u.is_active,
              p.id as position_id, p.name as position_name, p.level as position_level
       FROM users u
       JOIN positions p ON u.position_id = p.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting user settings:', error);
    res.status(500).json({ error: 'Failed to get user settings' });
  }
});

// Update user settings
app.put('/crm/api/user-settings', authenticateToken, async (req, res) => {
  try {
    const {
      full_name,
      email,
      phone,
      national_producer_number,
      annual_goal,
      current_password,
      new_password
    } = req.body;
    
    // Build update query dynamically
    const updates = [];
    const values = [req.user.id];
    let paramIndex = 2;
    
    if (full_name !== undefined) {
      updates.push(`full_name = $${paramIndex++}`);
      values.push(full_name);
    }
    
    if (email !== undefined) {
      // Check if email is already in use by another user
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, req.user.id]
      );
      
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email is already in use' });
      }
      
      updates.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }
    
    if (national_producer_number !== undefined) {
      updates.push(`national_producer_number = $${paramIndex++}`);
      values.push(national_producer_number);
    }
    
    if (annual_goal !== undefined) {
      updates.push(`annual_goal = $${paramIndex++}`);
      values.push(annual_goal);
    }
    
    // Add updated_at
    updates.push(`updated_at = NOW()`);
    
    // If no updates or only password change, skip user update
    if (updates.length > 1) { // More than just updated_at
      // Update the user
      await pool.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $1`,
        values
      );
    }
    
    // Handle password change if requested
    if (new_password && current_password) {
      // Get auth user
      const authUserResult = await pool.query(
        'SELECT * FROM auth_users WHERE id = $1',
        [req.user.id]
      );
      
      if (authUserResult.rows.length === 0) {
        return res.status(404).json({ error: 'Auth user not found' });
      }
      
      const authUser = authUserResult.rows[0];
      
      // Verify current password
      const bcrypt = await import('bcrypt');
      const passwordMatch = await bcrypt.compare(current_password, authUser.password_hash);
      
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      
      // Hash new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(new_password, saltRounds);
      
      // Update password
      await pool.query(
        'UPDATE auth_users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [hashedPassword, req.user.id]
      );
    }
    
    // Get updated user
    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.national_producer_number, u.annual_goal, u.phone, u.is_active,
              p.id as position_id, p.name as position_name, p.level as position_level
       FROM users u
       JOIN positions p ON u.position_id = p.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ error: 'Failed to update user settings' });
  }
});

// Configuration API

// Create carrier
app.post('/crm/api/carriers', authenticateToken, checkPermission(4), async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Carrier name is required' });
    }
    
    // Check if carrier already exists
    const carrierCheck = await pool.query(
      'SELECT id FROM carriers WHERE name = $1',
      [name]
    );
    
    if (carrierCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Carrier already exists' });
    }
    
    // Create carrier
    const result = await pool.query(
      `INSERT INTO carriers (id, name, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       RETURNING *`,
      [uuidv4(), name]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating carrier:', error);
    res.status(500).json({ error: 'Failed to create carrier' });
  }
});

// Update carrier
app.put('/crm/api/carriers/:id', authenticateToken, checkPermission(4), async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Carrier name is required' });
    }
    
    // Check if carrier exists
    const carrierCheck = await pool.query(
      'SELECT id FROM carriers WHERE id = $1',
      [id]
    );
    
    if (carrierCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Carrier not found' });
    }
    
    // Check if name is already in use by another carrier
    const nameCheck = await pool.query(
      'SELECT id FROM carriers WHERE name = $1 AND id != $2',
      [name, id]
    );
    
    if (nameCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Carrier name is already in use' });
    }
    
    // Update carrier
    const result = await pool.query(
      `UPDATE carriers SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [name, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating carrier:', error);
    res.status(500).json({ error: 'Failed to update carrier' });
  }
});

// Delete carrier
app.delete('/crm/api/carriers/:id', authenticateToken, checkPermission(4), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if carrier exists
    const carrierCheck = await pool.query(
      'SELECT id FROM carriers WHERE id = $1',
      [id]
    );
    
    if (carrierCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Carrier not found' });
    }
    
    // Check if carrier is in use
    const productCheck = await pool.query(
      'SELECT id FROM products WHERE carrier_id = $1 LIMIT 1',
      [id]
    );
    
    if (productCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete carrier that has products' });
    }
    
    // Delete carrier
    await pool.query('DELETE FROM carriers WHERE id = $1', [id]);
    
    res.json({ message: 'Carrier deleted successfully' });
  } catch (error) {
    console.error('Error deleting carrier:', error);
    res.status(500).json({ error: 'Failed to delete carrier' });
  }
});

// Create product
app.post('/crm/api/products', authenticateToken, checkPermission(4), async (req, res) => {
  try {
    const { name, carrier_id } = req.body;
    
    if (!name || !carrier_id) {
      return res.status(400).json({ error: 'Product name and carrier ID are required' });
    }
    
    // Check if carrier exists
    const carrierCheck = await pool.query(
      'SELECT id FROM carriers WHERE id = $1',
      [carrier_id]
    );
    
    if (carrierCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Carrier not found' });
    }
    
    // Check if product already exists for this carrier
    const productCheck = await pool.query(
      'SELECT id FROM products WHERE name = $1 AND carrier_id = $2',
      [name, carrier_id]
    );
    
    if (productCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Product already exists for this carrier' });
    }
    
    // Create product
    const result = await pool.query(
      `INSERT INTO products (id, name, carrier_id, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING *`,
      [uuidv4(), name, carrier_id]
    );
    
    // Get product with carrier name
    const productResult = await pool.query(
      `SELECT p.*, c.name as carrier_name
       FROM products p
       JOIN carriers c ON p.carrier_id = c.id
       WHERE p.id = $1`,
      [result.rows[0].id]
    );
    
    res.status(201).json(productResult.rows[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
app.put('/crm/api/products/:id', authenticateToken, checkPermission(4), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, carrier_id } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Product name is required' });
    }
    
    // Check if product exists
    const productCheck = await pool.query(
      'SELECT id FROM products WHERE id = $1',
      [id]
    );
    
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Build update query dynamically
    const updates = [];
    const values = [id];
    let paramIndex = 2;
    
    updates.push(`name = $${paramIndex++}`);
    values.push(name);
    
    if (carrier_id) {
      // Check if carrier exists
      const carrierCheck = await pool.query(
        'SELECT id FROM carriers WHERE id = $1',
        [carrier_id]
      );
      
      if (carrierCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Carrier not found' });
      }
      
      updates.push(`carrier_id = $${paramIndex++}`);
      values.push(carrier_id);
    }
    
    // Add updated_at
    updates.push(`updated_at = NOW()`);
    
    // Update product
    await pool.query(
      `UPDATE products SET ${updates.join(', ')} WHERE id = $1`,
      values
    );
    
    // Get updated product with carrier name
    const result = await pool.query(
      `SELECT p.*, c.name as carrier_name
       FROM products p
       JOIN carriers c ON p.carrier_id = c.id
       WHERE p.id = $1`,
      [id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
app.delete('/crm/api/products/:id', authenticateToken, checkPermission(4), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if product exists
    const productCheck = await pool.query(
      'SELECT id FROM products WHERE id = $1',
      [id]
    );
    
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Check if product is in use
    const dealCheck = await pool.query(
      'SELECT id FROM deals WHERE product_id = $1 LIMIT 1',
      [id]
    );
    
    if (dealCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete product that is used in deals' });
    }
    
    // Delete product
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Create/update commission split
app.post('/crm/api/commission-splits', authenticateToken, checkPermission(4), async (req, res) => {
  try {
    const { user_id, position_id, percentage } = req.body;
    
    if (!user_id || !position_id || percentage === undefined) {
      return res.status(400).json({ error: 'User ID, position ID, and percentage are required' });
    }
    
    // Check if user exists
    const userCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1',
      [user_id]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if position exists
    const positionCheck = await pool.query(
      'SELECT id FROM positions WHERE id = $1',
      [position_id]
    );
    
    if (positionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Position not found' });
    }
    
    // Create commission split
    const result = await pool.query(
      `INSERT INTO commission_splits (id, user_id, position_id, percentage, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [uuidv4(), user_id, position_id, percentage]
    );
    
    // Get commission split with user and position names
    const splitResult = await pool.query(
      `SELECT cs.*, 
              u.full_name as user_name,
              p.name as position_name
       FROM commission_splits cs
       JOIN users u ON cs.user_id = u.id
       JOIN positions p ON cs.position_id = p.id
       WHERE cs.id = $1`,
      [result.rows[0].id]
    );
    
    res.status(201).json(splitResult.rows[0]);
  } catch (error) {
    console.error('Error creating commission split:', error);
    res.status(500).json({ error: 'Failed to create commission split' });
  }
});

// Serve the SPA for all routes under /crm
app.get('/crm', (req, res) => {
  res.send(indexHtml);
});

// Root path redirect to /crm
app.get('/', (req, res) => {
  res.redirect('/crm');
});

// Catch-all route for SPA
app.use((req, res, next) => {
  if (req.path.startsWith('/crm') && !req.path.startsWith('/crm/api')) {
    res.send(indexHtml);
  } else {
    next();
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CRM available at: http://localhost:${PORT}/crm`);
  console.log(`API available at: http://localhost:${PORT}/crm/api`);
});
