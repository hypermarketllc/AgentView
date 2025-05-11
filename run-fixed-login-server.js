/**
 * run-fixed-login-server.js
 * This script runs the server with the fixed login route.
 */

import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

// Configuration
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const SALT_ROUNDS = 10;

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection
const pool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres',
  // Increase connection timeout
  connectionTimeoutMillis: 10000,
  // Increase query timeout
  statement_timeout: 10000
});

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files
app.use(express.static('public'));

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    req.user = user;
    next();
  });
};

// Login route
app.post('/crm/api/auth/login', async (req, res) => {
  try {
    console.log('Login attempt received:', req.body);
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Get user from auth_users table
    const authUserResult = await pool.query(
      'SELECT * FROM auth_users WHERE email = $1',
      [email]
    );
    
    if (authUserResult.rows.length === 0) {
      console.log('User not found in auth_users table:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const authUser = authUserResult.rows[0];
    
    // Check password
    try {
      const passwordMatch = await bcrypt.compare(password, authUser.password_hash);
      
      if (!passwordMatch) {
        console.log('Password does not match for user:', email);
        return res.status(401).json({ error: 'Invalid email or password' });
      }
    } catch (passwordError) {
      console.error('Error comparing passwords:', passwordError);
      return res.status(500).json({ error: 'Login failed', details: 'Error verifying password' });
    }
    
    // Get user details from users table
    const userResult = await pool.query(
      `SELECT u.*, p.name as position_name, p.level as position_level 
       FROM users u
       JOIN positions p ON u.position_id = p.id
       WHERE u.email = $1`,
      [email]
    );
    
    if (userResult.rows.length === 0) {
      console.error('User found in auth_users but not in users table:', email);
      return res.status(500).json({ error: 'User account incomplete' });
    }
    
    const user = userResult.rows[0];
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        position: user.position_name,
        level: user.position_level
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('Login successful for user:', email);
    
    // Return user info and token
    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        position: user.position_name,
        level: user.position_level,
        isActive: user.is_active
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Protected route example
app.get('/crm/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userResult = await pool.query(
      `SELECT u.*, p.name as position_name, p.level as position_level 
       FROM users u
       JOIN positions p ON u.position_id = p.id
       WHERE u.id = $1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    res.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      position: user.position_name,
      level: user.position_level,
      isActive: user.is_active
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile', details: error.message });
  }
});

// Ensure auth_users table exists
async function ensureAuthUsersTable() {
  try {
    console.log('Checking if auth_users table exists...');
    
    const client = await pool.connect();
    
    const tableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'auth_users'
      );
    `);
    
    const tableExists = tableCheckResult.rows[0].exists;
    
    if (!tableExists) {
      console.log('auth_users table does not exist. Creating it...');
      
      await client.query(`
        CREATE TABLE auth_users (
          id UUID PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      console.log('auth_users table created successfully.');
    } else {
      console.log('auth_users table exists.');
    }
    
    client.release();
    return true;
  } catch (error) {
    console.error('Error ensuring auth_users table:', error);
    return false;
  }
}

// Start the server
async function start() {
  try {
    // Ensure auth_users table exists
    await ensureAuthUsersTable();
    
    // Create HTTP server
    const server = createServer(app);
    
    // Start listening
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Login endpoint: http://localhost:${PORT}/crm/api/auth/login`);
      console.log('You can log in with the following credentials:');
      console.log('  Admin: admin@americancoveragecenter.com / Discord101!');
      console.log('  Test Agent: agent@example.com / Agent123!');
    });
    
    // Handle server errors
    server.on('error', (error) => {
      console.error('Server error:', error);
    });
    
    return server;
  } catch (error) {
    console.error('Error starting server:', error);
    throw error;
  }
}

// Start the server if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  start().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export { app, start, pool, authenticateToken };
