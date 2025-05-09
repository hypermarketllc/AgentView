import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pg from 'pg';
import url from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const SALT_ROUNDS = 10;

// Supabase environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Supabase URL:', SUPABASE_URL);
console.log('Supabase Anon Key:', SUPABASE_ANON_KEY ? 'Set' : 'Not set');
console.log('Using PostgreSQL for backend');

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
      API_URL: "/crm/api"
    };
  </script>
`;

// Insert the script tag before the closing head tag
indexHtml = indexHtml.replace('</head>', `${envScript}</head>`);

// Helper function to parse JSON body
const parseBody = (req) => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = body ? JSON.parse(body) : {};
        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', (error) => {
      reject(error);
    });
  });
};

// Helper function to authenticate requests
const authenticateToken = async (token) => {
  try {
    if (!token) {
      return { authenticated: false, error: 'Authentication required' };
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
      return { authenticated: false, error: 'User not found' };
    }
    
    return { authenticated: true, user: userResult.rows[0] };
  } catch (error) {
    console.error('Authentication error:', error);
    return { authenticated: false, error: 'Authentication failed' };
  }
};

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // Parse URL
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  
  // Serve static files from dist directory
  if (pathname.startsWith('/crm/assets/')) {
    const filePath = path.join(__dirname, 'dist', pathname.replace('/crm/', ''));
    
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.statusCode = 404;
        res.end('File not found');
        return;
      }
      
      // Set content type based on file extension
      const ext = path.extname(filePath);
      let contentType = 'text/plain';
      
      switch (ext) {
        case '.html':
          contentType = 'text/html';
          break;
        case '.css':
          contentType = 'text/css';
          break;
        case '.js':
          contentType = 'text/javascript';
          break;
        case '.json':
          contentType = 'application/json';
          break;
        case '.png':
          contentType = 'image/png';
          break;
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.svg':
          contentType = 'image/svg+xml';
          break;
      }
      
      res.setHeader('Content-Type', contentType);
      res.end(data);
    });
    return;
  }
  
  // API routes
  if (pathname.startsWith('/crm/api/')) {
    // Set JSON content type for API responses
    res.setHeader('Content-Type', 'application/json');
    
    // Health check endpoint
    if (pathname === '/crm/api/health' && req.method === 'GET') {
      res.statusCode = 200;
      res.end(JSON.stringify({ status: 'ok', timestamp: new Date() }));
      return;
    }
    
    // Login endpoint
    if (pathname === '/crm/api/auth/login' && req.method === 'POST') {
      try {
        const body = await parseBody(req);
        const { email, password } = body;
        
        // Get user data from existing users or use default
        const userData = existingUsers[email] || existingUsers['default'];
        
        // Generate token
        const token = jwt.sign(
          { userId: userData.id, email: email || 'default@example.com' },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        res.statusCode = 200;
        res.end(JSON.stringify({
          user: {
            id: userData.id,
            email: email || 'default@example.com',
            fullName: userData.fullName,
            position: userData.position
          },
          token
        }));
      } catch (error) {
        console.error('Login error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Login failed' }));
      }
      return;
    }
    
    // Register endpoint
    if (pathname === '/crm/api/auth/register' && req.method === 'POST') {
      try {
        const body = await parseBody(req);
        const { email, password, fullName } = body;
        
        // Use default user data
        const userData = existingUsers['default'];
        
        // Generate token
        const token = jwt.sign(
          { userId: userData.id, email: email || 'new@example.com' },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        res.statusCode = 201;
        res.end(JSON.stringify({
          user: {
            id: userData.id,
            email: email || 'new@example.com',
            fullName: fullName || 'New User',
            position: userData.position
          },
          token
        }));
      } catch (error) {
        console.error('Registration error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Registration failed' }));
      }
      return;
    }
    
    // Get current user endpoint
    if (pathname === '/crm/api/auth/me' && req.method === 'GET') {
      try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        const auth = await authenticateToken(token);
        
        if (!auth.authenticated) {
          res.statusCode = 401;
          res.end(JSON.stringify({ error: auth.error }));
          return;
        }
        
        res.statusCode = 200;
        res.end(JSON.stringify({
          id: auth.user.id,
          email: auth.user.email,
          fullName: auth.user.full_name,
          position: {
            id: auth.user.position_id,
            name: auth.user.position_name,
            level: auth.user.position_level
          }
        }));
      } catch (error) {
        console.error('Get current user error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Failed to get current user' }));
      }
      return;
    }
    
    // API endpoint not found
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'API endpoint not found' }));
    return;
  }
  
  // Serve index.html for all other routes under /crm
  if (pathname.startsWith('/crm')) {
    res.setHeader('Content-Type', 'text/html');
    res.statusCode = 200;
    res.end(indexHtml);
    return;
  }
  
  // Redirect root to /crm
  if (pathname === '/') {
    res.statusCode = 302;
    res.setHeader('Location', '/crm');
    res.end();
    return;
  }
  
  // Not found
  res.statusCode = 404;
  res.end('Not found');
});

// Initialize database and start server
async function start() {
  try {
    await initializeDatabase();
    
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`CRM available at: http://localhost:${PORT}/crm`);
      console.log(`API available at: http://localhost:${PORT}/crm/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

start();