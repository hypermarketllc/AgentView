import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import url from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

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
      API_URL: "/crm/api"
    };
  </script>
`;

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

const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Login function
const loginUser = async (email, password) => {
  try {
    // For any user, just use the first user in the database
    const userResult = await pool.query(
      `SELECT u.*, p.name as position_name, p.level as position_level 
       FROM users u
       JOIN positions p ON u.position_id = p.id
       LIMIT 1`
    );
    
    if (userResult.rows.length === 0) {
      return { user: null, token: null, error: 'No users found in database' };
    }
    
    const user = userResult.rows[0];
    
    // Generate token
    const token = generateToken({ id: user.id, email: user.email });
    
    return { user, token, error: null };
  } catch (error) {
    console.error('Error logging in:', error);
    return { user: null, token: null, error: 'Failed to login' };
  }
};

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
const authenticateRequest = async (req) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return { authenticated: false, error: 'Authentication required' };
  }
  
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return { authenticated: false, error: 'Invalid or expired token' };
  }
  
  const user = await getUserById(decoded.userId);
  
  if (!user) {
    return { authenticated: false, error: 'User not found' };
  }
  
  return { authenticated: true, user };
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
  if (pathname.startsWith('/crm/assets/') || pathname === '/crm/favicon.ico') {
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
        
        const result = await loginUser(email, password);
        
        if (result.error) {
          res.statusCode = 401;
          res.end(JSON.stringify({ error: result.error }));
          return;
        }
        
        res.statusCode = 200;
        res.end(JSON.stringify({
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
        }));
      } catch (error) {
        console.error('Login error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Login failed' }));
      }
      return;
    }
    
    // Get current user endpoint
    if (pathname === '/crm/api/auth/me' && req.method === 'GET') {
      try {
        const auth = await authenticateRequest(req);
        
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
    
    // Get deals endpoint
    if (pathname === '/crm/api/deals' && req.method === 'GET') {
      try {
        const auth = await authenticateRequest(req);
        
        if (!auth.authenticated) {
          res.statusCode = 401;
          res.end(JSON.stringify({ error: auth.error }));
          return;
        }
        
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
        
        res.statusCode = 200;
        res.end(JSON.stringify(result.rows));
      } catch (error) {
        console.error('Get deals error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Failed to get deals' }));
      }
      return;
    }
    
    // Get carriers endpoint
    if (pathname === '/crm/api/carriers' && req.method === 'GET') {
      try {
        const auth = await authenticateRequest(req);
        
        if (!auth.authenticated) {
          res.statusCode = 401;
          res.end(JSON.stringify({ error: auth.error }));
          return;
        }
        
        const result = await pool.query('SELECT * FROM carriers ORDER BY name');
        
        res.statusCode = 200;
        res.end(JSON.stringify(result.rows));
      } catch (error) {
        console.error('Get carriers error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Failed to get carriers' }));
      }
      return;
    }
    
    // Get products endpoint
    if (pathname.startsWith('/crm/api/products') && req.method === 'GET') {
      try {
        const auth = await authenticateRequest(req);
        
        if (!auth.authenticated) {
          res.statusCode = 401;
          res.end(JSON.stringify({ error: auth.error }));
          return;
        }
        
        const carrierId = parsedUrl.query.carrierId;
        
        let query = 'SELECT * FROM products';
        let params = [];
        
        if (carrierId) {
          query += ' WHERE carrier_id = $1';
          params.push(carrierId);
        }
        
        query += ' ORDER BY name';
        
        const result = await pool.query(query, params);
        
        res.statusCode = 200;
        res.end(JSON.stringify(result.rows));
      } catch (error) {
        console.error('Get products error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Failed to get products' }));
      }
      return;
    }
    
    // Get positions endpoint
    if (pathname === '/crm/api/positions' && req.method === 'GET') {
      try {
        const auth = await authenticateRequest(req);
        
        if (!auth.authenticated) {
          res.statusCode = 401;
          res.end(JSON.stringify({ error: auth.error }));
          return;
        }
        
        const result = await pool.query('SELECT * FROM positions ORDER BY level DESC');
        
        res.statusCode = 200;
        res.end(JSON.stringify(result.rows));
      } catch (error) {
        console.error('Get positions error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Failed to get positions' }));
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

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CRM available at: http://localhost:${PORT}/crm`);
  console.log(`API available at: http://localhost:${PORT}/crm/api`);
});