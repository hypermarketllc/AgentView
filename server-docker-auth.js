/**
 * server-docker-auth.js
 * Authentication middleware and auth routes for the Docker environment
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { SALT_ROUNDS } from './server-docker-db.js';

// JWT Secret from environment or default
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

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
    const userResult = await req.app.locals.pool.query(
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

// Setup authentication routes
function setupAuthRoutes(app, pool) {
  // Login route
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

  // Register route
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

  // Get current user route
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
}

// Export authentication-related functions
export { authenticateToken, setupAuthRoutes, JWT_SECRET };

  // Login endpoint
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      // For test account
      if (email === 'agent@example.com' && password === 'Agent123!') {
        return res.status(200).json({
          user: {
            id: '1',
            email: 'agent@example.com',
            name: 'Test Agent',
            role: 'agent'
          },
          token: 'test-token-123'
        });
      }
      
      // For admin account
      if (email === 'admin@americancoveragecenter.com' && password === 'Admin123!') {
        return res.status(200).json({
          user: {
            id: '2',
            email: 'admin@americancoveragecenter.com',
            name: 'Admin User',
            role: 'admin'
          },
          token: 'admin-token-123'
        });
      }
      
      // Check database for user
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error || !user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Verify password (in a real app, you would use bcrypt to compare hashed passwords)
      // For simplicity, we're just checking if the password field exists
      if (!user.password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Generate a token (in a real app, you would use JWT)
      const token = 'user-token-' + Math.random().toString(36).substring(2, 15);
      
      return res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name || user.email.split('@')[0],
          role: user.role || 'user'
        },
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req, res) => {
    // In a real app, you would invalidate the token
    return res.status(200).json({ message: 'Logged out successfully' });
  });

  // Get current user endpoint
  app.get('/api/auth/user', (req, res) => {
    // In a real app, you would verify the token and get the user from the database
    // For simplicity, we're just returning a test user
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // For test token
    if (token === 'test-token-123') {
      return res.status(200).json({
        user: {
          id: '1',
          email: 'agent@example.com',
          name: 'Test Agent',
          role: 'agent'
        }
      });
    }
    
    // For admin token
    if (token === 'admin-token-123') {
      return res.status(200).json({
        user: {
          id: '2',
          email: 'admin@americancoveragecenter.com',
          name: 'Admin User',
          role: 'admin'
        }
      });
    }
    
    // For other tokens, check the database
    // In a real app, you would verify the token and get the user from the database
    return res.status(401).json({ error: 'Invalid token' });
  });
