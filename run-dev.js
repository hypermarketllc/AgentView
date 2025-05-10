// Disable detect-libc functionality
process.env.DETECT_NODE_PRE_GYP = 'false';

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const SALT_ROUNDS = 10;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// Supabase environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', SUPABASE_URL);
console.log('Supabase Anon Key:', SUPABASE_ANON_KEY ? 'Set' : 'Not set');

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
      VITE_SUPABASE_URL: "${SUPABASE_URL}",
      VITE_SUPABASE_ANON_KEY: "${SUPABASE_ANON_KEY}",
      API_URL: "/crm/api"
    };
  </script>
`;

// Insert the script tag before the closing head tag
indexHtml = indexHtml.replace('</head>', `${envScript}</head>`);

// API routes
// Health check
app.get('/crm/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Login
app.post('/crm/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Get user data from existing users or use default
    const userData = existingUsers[email] || existingUsers['default'];
    
    // Generate token
    const token = jwt.sign(
      { userId: userData.id, email: email || 'default@example.com' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    return res.json({
      user: {
        id: userData.id,
        email: email || 'default@example.com',
        fullName: userData.fullName,
        position: userData.position
      },
      token
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
    
    // Use default user data
    const userData = existingUsers['default'];
    
    // Generate token
    const token = jwt.sign(
      { userId: userData.id, email: email || 'new@example.com' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      user: {
        id: userData.id,
        email: email || 'new@example.com',
        fullName: fullName || 'New User',
        position: userData.position
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get current user
app.get('/crm/api/auth/me', (req, res) => {
  // Get token from header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user data from existing users or use default
    const userData = existingUsers[decoded.email] || existingUsers['default'];
    
    res.json({
      id: userData.id,
      email: decoded.email || 'default@example.com',
      fullName: userData.fullName,
      position: userData.position
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Get deals
app.get('/crm/api/deals', (req, res) => {
  // Return empty array for now
  res.json([]);
});

// Get carriers
app.get('/crm/api/carriers', (req, res) => {
  // Return some mock carriers
  const carriers = [
    { id: '1', name: 'Carrier 1', advance_rate: 0.8, payment_type: 'Monthly', advance_period_months: 12 },
    { id: '2', name: 'Carrier 2', advance_rate: 0.7, payment_type: 'Quarterly', advance_period_months: 6 },
    { id: '3', name: 'Carrier 3', advance_rate: 0.9, payment_type: 'Annual', advance_period_months: 3 }
  ];
  
  res.json(carriers);
});

// Get products
app.get('/crm/api/products', (req, res) => {
  // Return some mock products
  const products = [
    { id: '1', carrier_id: '1', name: 'Product 1' },
    { id: '2', carrier_id: '1', name: 'Product 2' },
    { id: '3', carrier_id: '2', name: 'Product 3' },
    { id: '4', carrier_id: '3', name: 'Product 4' }
  ];
  
  // Filter by carrier_id if provided
  const carrierId = req.query.carrierId;
  const filteredProducts = carrierId 
    ? products.filter(p => p.carrier_id === carrierId)
    : products;
  
  res.json(filteredProducts);
});

// Get positions
app.get('/crm/api/positions', (req, res) => {
  // Return some mock positions
  const positions = [
    { id: '599470e2-3803-41a2-a792-82911e60c2f4', name: 'Admin', level: 3, description: 'Administrator' },
    { id: '8395f610-6c95-4cd5-b778-ee6825ac78d1', name: 'Owner', level: 4, description: 'Owner' },
    { id: 'ec2cfd8f-024d-4b5c-b23d-fd26d951f1bb', name: 'Manager', level: 2, description: 'Manager' },
    { id: '1f1d71c2-beec-43cd-99b2-2048c0afbde4', name: 'Agent', level: 1, description: 'Agent' }
  ];
  
  res.json(positions);
});

// Create deal
app.post('/crm/api/deals', (req, res) => {
  try {
    const dealData = req.body;
    
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Get user data from existing users or use default
      const userData = existingUsers[decoded.email] || existingUsers['default'];
      
      res.status(201).json({
        id: uuidv4(),
        agent_id: userData.id, // Use the existing user ID
        ...dealData,
        status: 'Submitted',
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Error creating deal:', error);
    res.status(500).json({ error: 'Failed to create deal' });
  }
});

// Serve the modified index.html for all routes
app.get('*', (req, res) => {
  res.send(indexHtml);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CRM available at: http://localhost:${PORT}`);
  console.log(`API available at: http://localhost:${PORT}/crm/api`);
});