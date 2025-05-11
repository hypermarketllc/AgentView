/**
 * Database-based authentication module
 * Provides functions for user authentication, token generation, and validation
 */

import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// JWT secret key - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

// PostgreSQL connection configuration
const pgConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crm_db',
  user: process.env.POSTGRES_USER || 'crm_user',
  password: process.env.POSTGRES_PASSWORD || 'your_strong_password_here'
};

// Create a new PostgreSQL connection pool
const pool = new Pool(pgConfig);

/**
 * Authenticate a user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User object with token and position data
 */
export async function authenticateUser(email, password) {
  const client = await pool.connect();
  
  try {
    console.log('Authenticating user:', email);
    
    // Log all users in the database for debugging
    const allUsers = await client.query('SELECT id, email, role FROM users');
    console.log('All users in database:', allUsers.rows);
    
    // Find user by email with position data (case-insensitive)
    const result = await client.query(`
      SELECT 
        u.id, 
        u.email, 
        u.password, 
        u.full_name, 
        u.role,
        u.position_id,
        p.name AS position_name,
        p.level AS position_level,
        p.permissions,
        p.is_admin,
        p.can_manage_users,
        p.can_manage_deals,
        p.can_view_analytics,
        p.can_manage_settings
      FROM 
        users u
      LEFT JOIN 
        positions p ON u.position_id = p.id
      WHERE 
        LOWER(u.email) = LOWER($1)
    `, [email]);
    
    // Check if user exists
    if (result.rows.length === 0) {
      console.log('User not found in database:', email);
      throw new Error('User not found');
    }
    
    const user = result.rows[0];
    console.log('User found:', { id: user.id, email: user.email, role: user.role });
    console.log('Stored password hash:', user.password);
    
    // Compare password with hash
    console.log('Comparing password with hash...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }
    
    // Update last login timestamp
    await client.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Create a position object from the position fields
    const position = user.position_id ? {
      id: user.position_id,
      name: user.position_name,
      level: user.position_level,
      permissions: user.permissions || {},
      is_admin: user.is_admin || false,
      can_manage_users: user.can_manage_users || false,
      can_manage_deals: user.can_manage_deals || false,
      can_view_analytics: user.can_view_analytics || false,
      can_manage_settings: user.can_manage_settings || false
    } : null;
    
    // Remove position fields and password from the user object
    const {
      password: _, position_name, position_level, permissions, is_admin,
      can_manage_users, can_manage_deals, can_view_analytics, can_manage_settings,
      ...userData
    } = user;
    
    // Return user data with position and token
    return {
      ...userData,
      position,
      token
    };
  } finally {
    client.release();
  }
}

/**
 * Generate a JWT token for a user
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
export function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify a JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * Get user by ID with position data
 * @param {number} id - User ID
 * @returns {Promise<Object>} User object with position data
 */
export async function getUserById(id) {
  const client = await pool.connect();
  
  try {
    console.log('Getting user by ID:', id);
    
    // Log all users in the database for debugging
    const allUsers = await client.query('SELECT id, email, role FROM users');
    console.log('All users in database for getUserById:', allUsers.rows);
    
    // Query user data with position information using a JOIN
    const result = await client.query(`
      SELECT 
        u.id, 
        u.email, 
        u.full_name, 
        u.role, 
        u.created_at, 
        u.updated_at, 
        u.last_login,
        u.position_id,
        p.name AS position_name,
        p.level AS position_level,
        p.permissions,
        p.is_admin,
        p.can_manage_users,
        p.can_manage_deals,
        p.can_view_analytics,
        p.can_manage_settings
      FROM 
        users u
      LEFT JOIN 
        positions p ON u.position_id = p.id
      WHERE 
        u.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }
    
    // Format the user object with position data
    const user = result.rows[0];
    
    // Create a position object from the position fields
    const position = user.position_id ? {
      id: user.position_id,
      name: user.position_name,
      level: user.position_level,
      permissions: user.permissions || {},
      is_admin: user.is_admin || false,
      can_manage_users: user.can_manage_users || false,
      can_manage_deals: user.can_manage_deals || false,
      can_view_analytics: user.can_view_analytics || false,
      can_manage_settings: user.can_manage_settings || false
    } : null;
    
    // Remove position fields from the user object and add the position object
    const {
      position_name, position_level, permissions, is_admin,
      can_manage_users, can_manage_deals, can_view_analytics, can_manage_settings,
      ...userData
    } = user;
    
    return {
      ...userData,
      position
    };
  } finally {
    client.release();
  }
}

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
export async function createUser(userData) {
  const { email, password, full_name, role = 'agent' } = userData;
  
  // Validate required fields
  if (!email || !password || !full_name) {
    throw new Error('Email, password, and full name are required');
  }
  
  const client = await pool.connect();
  
  try {
    // Check if user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      throw new Error('User with this email already exists');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user
    const result = await client.query(
      `INSERT INTO users (email, password, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, role, created_at`,
      [email, hashedPassword, full_name, role]
    );
    
    return result.rows[0];
  } finally {
    client.release();
  }
}

/**
 * Update user password
 * @param {number} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<boolean>} Success status
 */
export async function updatePassword(userId, currentPassword, newPassword) {
  const client = await pool.connect();
  
  try {
    // Get current user data
    const userResult = await client.query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }
    
    const user = userResult.rows[0];
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await client.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, userId]
    );
    
    return true;
  } finally {
    client.release();
  }
}

/**
 * Middleware to authenticate requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function authMiddleware(req, res, next) {
  console.log('Auth middleware called for path:', req.path);
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No valid authorization header found');
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  console.log('Token found in request:', token.substring(0, 20) + '...');
  
  try {
    // Verify token
    const decoded = verifyToken(token);
    console.log('Token verified successfully for user:', decoded.email);
    
    // Add user data to request
    req.user = decoded;
    
    next();
  } catch (error) {
    console.log('Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Middleware to check if user has admin role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  next();
}
