import { Request, Response, NextFunction } from 'express';
import { verifyToken, getUserById } from '../lib/auth';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Authentication middleware
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
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
    
    // Set user in request
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// Admin authorization middleware
export const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.position_level < 4) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};

// Manager authorization middleware
export const authorizeManager = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.position_level < 3) {
    return res.status(403).json({ error: 'Manager access required' });
  }
  
  next();
};