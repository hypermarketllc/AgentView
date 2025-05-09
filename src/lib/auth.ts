import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import pool from './postgres';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  position_id: string;
  position_name?: string;
  position_level?: number;
  is_active: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  password_hash: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const SALT_ROUNDS = 10;

// Generate JWT tokens
export const generateTokens = (user: { id: string; email: string }): { accessToken: string; refreshToken: string } => {
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

// Generate JWT token (legacy function for backward compatibility)
export const generateToken = (user: { id: string; email: string }): string => {
  return generateTokens(user).accessToken;
};

// Verify JWT token
export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

// Verify password
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// Get user by ID
export const getUserById = async (id: string): Promise<User | null> => {
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
    
    return result.rows[0] as User;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
};

// Get user by email
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
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
    return result.rows[0] as User;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
};

// Get auth user by email
export const getAuthUserByEmail = async (email: string): Promise<AuthUser | null> => {
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
    return result.rows[0] as AuthUser;
  } catch (error) {
    console.error('Error getting auth user by email:', error);
    return null;
  }
};

// Create user with authentication
export const createUser = async (
  email: string,
  password: string,
  fullName: string,
  positionId: string
): Promise<{ user: User | null; token: string | null; refreshToken: string | null; error: string | null }> => {
  try {
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    
    if (existingUser) {
      return { user: null, token: null, refreshToken: null, error: 'User already exists' };
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Generate user ID
    const userId = uuidv4();
    
    // Begin transaction
    await pool.query('BEGIN');
    
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
      return { user: null, token: null, refreshToken: null, error: 'Failed to create user' };
    }
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({ id: userId, email });
    
    return { user, token: accessToken, refreshToken, error: null };
  } catch (error) {
    // Rollback transaction
    await pool.query('ROLLBACK');
    
    console.error('Error creating user:', error);
    return { user: null, token: null, refreshToken: null, error: 'Failed to create user' };
  }
};

// Refresh token
export const refreshToken = async (refreshToken: string): Promise<{ token: string | null; refreshToken: string | null; error: string | null }> => {
  try {
    // Call the refresh token endpoint
    const response = await fetch('/crm/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { token: null, refreshToken: null, error: data.error || 'Failed to refresh token' };
    }
    
    return { token: data.token, refreshToken: data.refreshToken, error: null };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return { token: null, refreshToken: null, error: 'Failed to refresh token' };
  }
};

// Login user
export const loginUser = async (
  email: string,
  password: string
): Promise<{ user: User | null; token: string | null; refreshToken: string | null; error: string | null }> => {
  try {
    console.log(`Login attempt for: ${email}`);
    // Special case for test account in development mode only
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment && email === 'agent@example.com' && password === 'Agent123!') {
      console.log('Processing test account login');
      // Get agent position
      const positionResult = await pool.query(
        'SELECT id FROM positions WHERE level = 1 LIMIT 1'
      );
      
      if (positionResult.rows.length === 0) {
        return { user: null, token: null, refreshToken: null, error: 'Agent position not found' };
      }
      
      const positionId = positionResult.rows[0].id;
      
      // Check if test user exists
      let user = await getUserByEmail(email);
      
      if (!user) {
        // Create test user
        const createResult = await createUser(email, password, 'Test Agent', positionId);
        
        if (createResult.error) {
          return createResult;
        }
        
        user = createResult.user;
      }
      
      if (!user) {
        return { user: null, token: null, refreshToken: null, error: 'Failed to create test user' };
      }
      
      // Generate tokens
      const { accessToken, refreshToken } = generateTokens({ id: user.id, email });
      
      return { user, token: accessToken, refreshToken, error: null };
    }
    
    // Get user first
    const user = await getUserByEmail(email);
    
    if (!user) {
      console.log(`Login failed: No user found with email ${email}`);
      return { user: null, token: null, refreshToken: null, error: 'Account not found. Please check your email or register.' };
    }
    
    // Get auth user
    const authUser = await getAuthUserByEmail(email);
    
    if (!authUser) {
      console.error(`Authentication error: User ${email} exists but has no auth record`);
      return { user: null, token: null, refreshToken: null, error: 'Authentication error. Please contact support.' };
    }
    
    // Verify password
    const passwordMatch = await verifyPassword(password, authUser.password_hash);
    
    if (!passwordMatch) {
      console.log(`Login failed: Invalid password for ${email}`);
      return { user: null, token: null, refreshToken: null, error: 'Invalid password. Please try again.' };
    }
    
    console.log(`Login successful for ${email}`);
    
    // Generate tokens
    const { accessToken, refreshToken } = generateTokens({ id: user.id, email });
    
    return { user, token: accessToken, refreshToken, error: null };
  } catch (error) {
    console.error('Error logging in:', error);
    return { user: null, token: null, refreshToken: null, error: 'Failed to login' };
  }
};
