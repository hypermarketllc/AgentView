/**
 * Authentication routes
 * Provides endpoints for user authentication and management
 */

const express = require('express');
const router = express.Router();
const authDb = require('../../utils/auth-db');

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and get token
 * @access Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await authDb.authenticateUser(email, password);
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Login error:', error);
    
    // Provide a user-friendly error message
    if (error.message === 'User not found' || error.message === 'Invalid password') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * @route GET /api/auth/me
 * @desc Get current user data
 * @access Private
 */
router.get('/me', authDb.authMiddleware, async (req, res) => {
  try {
    const user = await authDb.getUserById(req.user.id);
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Private (Admin only)
 */
router.post('/register', authDb.authMiddleware, authDb.adminMiddleware, async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;
    
    const newUser = await authDb.createUser({
      email,
      password,
      full_name,
      role
    });
    
    res.status(201).json({
      success: true,
      user: newUser
    });
  } catch (error) {
    console.error('Register error:', error);
    
    if (error.message === 'User with this email already exists') {
      return res.status(400).json({ error: error.message });
    }
    
    if (error.message === 'Email, password, and full name are required') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * @route PUT /api/auth/change-password
 * @desc Change user password
 * @access Private
 */
router.put('/change-password', authDb.authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    await authDb.updatePassword(req.user.id, currentPassword, newPassword);
    
    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    
    if (error.message === 'Current password is incorrect') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to update password' });
  }
});

/**
 * @route POST /api/auth/verify-token
 * @desc Verify JWT token
 * @access Public
 */
router.post('/verify-token', (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }
    
    const decoded = authDb.verifyToken(token);
    
    res.json({
      success: true,
      user: decoded
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
