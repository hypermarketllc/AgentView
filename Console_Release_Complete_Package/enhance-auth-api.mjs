/**
 * Enhanced Authentication API
 * This script enhances the auth endpoints to include position data
 * and creates middleware to ensure position data integrity
 */

import express from 'express';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Log a message with color
 * @param {string} message - Message to log
 * @param {string} color - Color to use
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Enhanced get user with position data
 * @param {pg.Client} db - Database client
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User object with position data
 */
async function getUserWithPosition(db, userId) {
  try {
    // Query the user_positions view to get user with position data
    const userQuery = await db.query(`
      SELECT 
        u.*,
        p.id AS position_id,
        p.name AS position_name,
        p.level AS position_level,
        p.permissions,
        p.is_admin
      FROM 
        users u
      LEFT JOIN 
        positions p ON u.position_id = p.id
      WHERE 
        u.id = $1;
    `, [userId]);
    
    if (userQuery.rows.length === 0) {
      return null;
    }
    
    const user = userQuery.rows[0];
    
    // Create a structured position object
    const position = {
      id: user.position_id,
      name: user.position_name,
      level: user.position_level,
      permissions: user.permissions || { dashboard: { view: true } },
      is_admin: user.is_admin || false
    };
    
    // Remove redundant fields
    delete user.position_name;
    delete user.position_level;
    delete user.permissions;
    delete user.is_admin;
    
    // Attach the position object
    user.position = position;
    
    return user;
  } catch (error) {
    console.error('Error fetching user with position:', error);
    
    // Fallback: Get basic user data
    const userQuery = await db.query(`
      SELECT * FROM users WHERE id = $1;
    `, [userId]);
    
    if (userQuery.rows.length === 0) {
      return null;
    }
    
    const user = userQuery.rows[0];
    
    // Create a default position based on role
    if (!user.position_id) {
      user.position_id = user.role === 'admin' ? 6 : 1;
    }
    
    // Create a fallback position object
    user.position = createDefaultPosition(user.role, user.position_id);
    
    return user;
  }
}

/**
 * Create a default position object based on role
 * @param {string} role - User role
 * @param {number} positionId - Position ID
 * @returns {Object} Default position object
 */
function createDefaultPosition(role, positionId) {
  const isAdmin = role === 'admin';
  
  return {
    id: positionId || (isAdmin ? 6 : 1),
    name: isAdmin ? 'Admin' : 'Agent',
    level: isAdmin ? 6 : 1,
    permissions: isAdmin ? 
      { dashboard: { view: true }, users: { view: true }, "post-deal": { view: true }, book: { view: true } } : 
      { dashboard: { view: true }, "post-deal": { view: true }, book: { view: true } },
    is_admin: isAdmin
  };
}

/**
 * Create an enhanced authentication middleware
 * @param {pg.Client} db - Database client
 * @returns {Function} Middleware function
 */
function createEnhancedAuthMiddleware(db) {
  return async function enhancedAuthMiddleware(req, res, next) {
    console.log(`Auth middleware called for path: ${req.path}`);
    console.log(`Request headers:`, JSON.stringify(req.headers, null, 2));
    
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }
      
      const token = authHeader.split(' ')[1];
      console.log(`Token found in request: ${token.substring(0, 20)}...`);
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
      console.log(`Token verified successfully for user: ${decoded.email}`);
      
      // Get user with position data
      const user = await getUserWithPosition(db, decoded.id);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Attach user to request
      req.user = user;
      
      next();
    } catch (error) {
      console.error(`Auth error: ${error.message}`);
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
}

/**
 * Enhance the login endpoint to include position data
 * @param {express.Router} router - Express router
 * @param {pg.Client} db - Database client
 * @param {Function} comparePassword - Password comparison function
 * @returns {void}
 */
function enhanceLoginEndpoint(router, db, comparePassword) {
  // Replace the existing login handler
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      console.log(`Login attempt: { email: '${email}', password: '********' }`);
      console.log(`Authenticating user: ${email}`);
      
      // Find user by email
      const userQuery = await db.query(`
        SELECT * FROM users WHERE email = $1;
      `, [email]);
      
      if (userQuery.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      const user = userQuery.rows[0];
      console.log(`User found: { id: ${user.id}, email: '${user.email}', role: '${user.role}' }`);
      
      // Verify password
      const storedHash = user.password;
      console.log(`Stored password hash: ${storedHash}`);
      
      console.log(`Comparing password with hash...`);
      const passwordValid = await comparePassword(password, storedHash);
      console.log(`Password valid: ${passwordValid}`);
      
      if (!passwordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Ensure user has a position_id
      if (!user.position_id) {
        // Update user with default position_id
        await db.query(`
          UPDATE users
          SET position_id = $1
          WHERE id = $2;
        `, [user.role === 'admin' ? 6 : 1, user.id]);
        
        user.position_id = user.role === 'admin' ? 6 : 1;
      }
      
      // Create token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '24h' }
      );
      
      // Get user with position data
      const userWithPosition = await getUserWithPosition(db, user.id);
      
      // Return token and user data in the format expected by the frontend
      return res.json({
        success: true,
        token,
        user: userWithPosition
      });
    } catch (error) {
      console.error(`Login error: ${error.message}`);
      return res.status(500).json({ message: 'Server error' });
    }
  });
}

/**
 * Enhance the me endpoint to include position data
 * @param {express.Router} router - Express router
 * @param {pg.Client} db - Database client
 * @param {Function} authMiddleware - Authentication middleware
 * @returns {void}
 */
function enhanceMeEndpoint(router, db, authMiddleware) {
  // Replace the existing me handler
  router.get('/me', authMiddleware, async (req, res) => {
    try {
      // Get user with position data
      const user = await getUserWithPosition(db, req.user.id);
      
      // Return user data
      return res.json(user);
    } catch (error) {
      console.error(`Me endpoint error: ${error.message}`);
      return res.status(500).json({ message: 'Server error' });
    }
  });
}

/**
 * Apply enhanced authentication API
 * @param {express.Application} app - Express application
 * @param {pg.Client} db - Database client
 * @param {Object} config - Configuration object
 * @returns {void}
 */
export function applyEnhancedAuthApi(app, db, config) {
  const { comparePassword } = config;
  
  // Create auth router
  const authRouter = express.Router();
  
  // Create enhanced auth middleware
  const authMiddleware = createEnhancedAuthMiddleware(db);
  
  // Enhance endpoints
  enhanceLoginEndpoint(authRouter, db, comparePassword);
  enhanceMeEndpoint(authRouter, db, authMiddleware);
  
  // Register router
  app.use('/crm/api/auth', authRouter);
  
  log(`Enhanced authentication API applied`, colors.green);
}
