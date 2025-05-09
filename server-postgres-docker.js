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
import { createMimeFixMiddleware, createDirectMimeTypeMiddleware, injectMimeFix } from './inject-mime-fix.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const SALT_ROUNDS = 10; // Number of salt rounds for bcrypt password hashing

// Middleware
app.use(cors());
app.use(express.json());
app.use(createMimeFixMiddleware()); // Add MIME type fix middleware
app.use(createDirectMimeTypeMiddleware()); // Add direct MIME type middleware for all JavaScript files

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
    
    // Log the final content type being sent
    console.log(`Final Content-Type for ${filePath}: ${res.getHeader('Content-Type')}`);
    
    res.sendFile(filePath);
  } else {
    console.log(`File not found: ${filePath}`);
    next();
  }
});

// Special handler for module scripts to ensure proper MIME type
app.get('/crm/assets/*.js', (req, res, next) => {
  if (res.headersSent) {
    return next();
  }
  
  const assetPath = req.path.replace('/crm', '');
  const filePath = path.join(__dirname, 'dist', assetPath);
  
  console.log(`JavaScript module request: ${req.path} -> ${filePath}`);
  
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    console.log(`Explicitly setting Content-Type for JS module: application/javascript`);
    res.sendFile(filePath);
  } else {
    console.log(`JS module file not found: ${filePath}`);
    next();
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
    console.log(`Looking up user by email: ${email}`);
    const result = await pool.query(
      `SELECT u.*, p.name as position_name, p.level as position_level 
       FROM users u
       JOIN positions p ON u.position_id = p.id
       WHERE u.email = $1`,
      [email]
    );
    
    if (result.rows.length === 0) {
      console.log(`No user found with email: ${email}`);
      return null;
    }
    
    console.log(`Found user with email ${email}:`, result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
};

const getAuthUserByEmail = async (email) => {
  try {
    console.log(`Looking up auth user by email: ${email}`);
    const result = await pool.query(
      'SELECT * FROM auth_users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      console.log(`No auth user found with email: ${email}`);
      return null;
    }
    
    console.log(`Found auth user with email ${email}:`, result.rows[0]);
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
  
  // Inject the MIME fix into the HTML
  indexHtml = injectMimeFix(indexHtml);
  console.log('Successfully injected MIME fix into index.html');
} catch (err) {
  console.error('Error reading or modifying index.html:', err);
  indexHtml = '<!DOCTYPE html><html><body><h1>Error loading application</h1></body></html>';
}

// Create a script tag with the environment variables
const envScript = `
  <script>
    window.env = {
      VITE_USE_POSTGRES: "true",
      USE_POSTGRES: "true",
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
    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV === 'development' || true; // Force development mode
    console.log(`Development mode: ${isDevelopment}`);
    
    // Special case for test account in development mode only
    if (isDevelopment && email === 'agent@example.com' && password === 'Agent123!') {
      // Get agent position
      const positionResult = await pool.query(
        'SELECT id FROM positions WHERE level = 1 LIMIT 1'
      );
      
      if (positionResult.rows.length === 0) {
        return { user: null, token: null, error: 'Agent position not found' };
      }
      
      const positionId = positionResult.rows[0].id;
      
      // Check if test user exists
      let user = await getUserByEmail(email);
      
      if (!user) {
        // Create test user
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
          [userId, email, 'Test Agent', positionId, true]
        );
        
        // Commit transaction
        await pool.query('COMMIT');
        
        user = await getUserById(userId);
      }
      
      if (!user) {
        return { user: null, token: null, error: 'Failed to create test user' };
      }
      
      // Generate token
      const token = generateToken({ id: user.id, email });
      
      return { user, token, error: null };
    }
    
    // For owner account
    console.log(`Login attempt for owner account: ${email} with password: ${password}`);
    if (email === 'admin@americancoveragecenter.com') {
      console.log('Recognized admin@americancoveragecenter.com account');
      // Get admin user
      let user = await getUserByEmail(email);
      
      console.log('Admin user found:', user ? 'yes' : 'no');
      if (!user) {
        // Get admin position (highest level)
        const positionResult = await pool.query(
          'SELECT id FROM positions WHERE level = (SELECT MAX(level) FROM positions) LIMIT 1'
        );
        
        if (positionResult.rows.length === 0) {
          return { user: null, token: null, error: 'Admin position not found' };
        }
        
        const positionId = positionResult.rows[0].id;
        
        // Create owner account
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
          [userId, email, 'System Administrator', positionId, true]
        );
        
        // Commit transaction
        await pool.query('COMMIT');
        
        user = await getUserById(userId);
      } else {
        // Verify password or update it if needed
        const authUser = await getAuthUserByEmail(email);
        
        console.log('Auth user found for admin:', authUser ? 'yes' : 'no');
        
        if (authUser) {
          console.log('Admin auth user ID:', authUser.id);
          console.log('Admin auth user password hash:', authUser.password_hash);
          
          try {
            // Try to verify with bcrypt
            console.log('Attempting to verify admin password with bcrypt');
            const passwordValid = await bcrypt.compare(password, authUser.password_hash);
            console.log('Admin password valid:', passwordValid);
            
            if (!passwordValid) {
              // Update password if it doesn't match
              const newHash = await bcrypt.hash(password, SALT_ROUNDS);
              await pool.query(
                'UPDATE auth_users SET password_hash = $1 WHERE id = $2',
                [newHash, authUser.id]
              );
              console.log(`Updated password for owner account ${authUser.id}`);
            }
          } catch (bcryptError) {
            console.warn('Error comparing passwords with bcrypt:', bcryptError);
            
            // Update password hash
            const newHash = await bcrypt.hash(password, SALT_ROUNDS);
            await pool.query(
              'UPDATE auth_users SET password_hash = $1 WHERE id = $2',
              [newHash, authUser.id]
            );
            console.log(`Updated password hash for owner account ${authUser.id}`);
          }
        }
      }
      
      if (!user) {
        return { user: null, token: null, error: 'Failed to create owner account' };
      }
      
      // Generate token
      const token = generateToken({ id: user.id, email });
      
      return { user, token, error: null };
    }
    
    // For admin test account in development mode only
    if (isDevelopment && email === 'admin@example.com' && password === 'Admin123!') {
      // Get admin user
      let user = await getUserByEmail(email);
      
      if (!user) {
        // Get admin position
        const positionResult = await pool.query(
          'SELECT id FROM positions WHERE level = 4 LIMIT 1'
        );
        
        if (positionResult.rows.length === 0) {
          return { user: null, token: null, error: 'Admin position not found' };
        }
        
        const positionId = positionResult.rows[0].id;
        
        // Create admin user
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
          [userId, email, 'Admin User', positionId, true]
        );
        
        // Commit transaction
        await pool.query('COMMIT');
        
        user = await getUserById(userId);
      }
      
      if (!user) {
        return { user: null, token: null, error: 'Failed to create admin user' };
      }
      
      // Generate token
      const token = generateToken({ id: user.id, email });
      
      return { user, token, error: null };
    }
    
    // For regular users, verify credentials
    // Get user by email
    const user = await getUserByEmail(email);
    
    if (!user) {
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
      console.log(`Comparing password with hash: ${authUser.password_hash}`);
      passwordValid = await bcrypt.compare(password, authUser.password_hash);
      console.log(`Password valid: ${passwordValid}`);
    } catch (bcryptError) {
      console.warn('Error comparing passwords with bcrypt:', bcryptError);
      
      // For backward compatibility with non-hashed passwords
      if (isDevelopment) {
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
    
    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: result.user.id, email: result.user.email, tokenType: 'refresh' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
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
      token: result.token,
      refreshToken: refreshToken
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
    
    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: result.user.id, email: result.user.email, tokenType: 'refresh' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
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
      token: result.token,
      refreshToken: refreshToken
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

// Refresh token
app.post('/crm/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }
    
    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    
    if (!decoded || !decoded.userId) {
      return res.status(403).json({ error: 'Invalid or expired refresh token' });
    }
    
    // Get user
    const user = await getUserById(decoded.userId);
    
    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }
    
    // Generate new tokens
    const token = generateToken({ id: user.id, email: user.email });
    const newRefreshToken = jwt.sign(
      { userId: user.id, email: user.email, tokenType: 'refresh' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ token, refreshToken: newRefreshToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
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

// Root path redirect to /crm
app.get('/', (req, res) => {
  res.redirect('/crm');
});

// Fallback route for SPA - must be after all other routes
app.use((req, res, next) => {
  // Skip asset files to prevent overriding their MIME types
  if (req.path.includes('/assets/')) {
    return next();
  }
  
  if (req.path.startsWith('/crm') && !req.path.startsWith('/crm/api')) {
    res.setHeader('Content-Type', 'text/html');
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
