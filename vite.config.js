import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'mock-api',
      configureServer(server) {
        // JWT Secret
        const JWT_SECRET = 'your_jwt_secret';

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

        // Login endpoint
        server.middlewares.use('/crm/api/auth/login', (req, res, next) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            req.on('end', () => {
              try {
                const { email, password } = JSON.parse(body);
                
                // Get user data from existing users or use default
                const userData = existingUsers[email] || existingUsers['default'];
                
                // Generate token
                const token = jwt.sign(
                  { userId: userData.id, email: email || 'default@example.com' },
                  JWT_SECRET,
                  { expiresIn: '24h' }
                );
                
                res.setHeader('Content-Type', 'application/json');
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
            });
          } else {
            next();
          }
        });

        // Register endpoint
        server.middlewares.use('/crm/api/auth/register', (req, res, next) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            req.on('end', () => {
              try {
                const { email, password, fullName } = JSON.parse(body);
                
                // Use default user data
                const userData = existingUsers['default'];
                
                // Generate token
                const token = jwt.sign(
                  { userId: userData.id, email: email || 'new@example.com' },
                  JWT_SECRET,
                  { expiresIn: '24h' }
                );
                
                res.statusCode = 201;
                res.setHeader('Content-Type', 'application/json');
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
            });
          } else {
            next();
          }
        });

        // Get current user endpoint
        server.middlewares.use('/crm/api/auth/me', (req, res, next) => {
          if (req.method === 'GET') {
            try {
              // Get token from header
              const authHeader = req.headers['authorization'];
              const token = authHeader && authHeader.split(' ')[1];
              
              if (!token) {
                res.statusCode = 401;
                res.end(JSON.stringify({ error: 'Authentication required' }));
                return;
              }
              
              try {
                // Verify token
                const decoded = jwt.verify(token, JWT_SECRET);
                
                // Get user data from existing users or use default
                const userData = existingUsers[decoded.email] || existingUsers['default'];
                
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  id: userData.id,
                  email: decoded.email || 'default@example.com',
                  fullName: userData.fullName,
                  position: userData.position
                }));
              } catch (error) {
                console.error('Authentication error:', error);
                res.statusCode = 401;
                res.end(JSON.stringify({ error: 'Invalid token' }));
              }
            } catch (error) {
              console.error('Auth/me error:', error);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: 'Server error' }));
            }
          } else {
            next();
          }
        });

        // Get deals endpoint
        server.middlewares.use('/crm/api/deals', (req, res, next) => {
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify([]));
          } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk.toString();
            });
            req.on('end', () => {
              try {
                const dealData = JSON.parse(body);
                
                // Get token from header
                const authHeader = req.headers['authorization'];
                const token = authHeader && authHeader.split(' ')[1];
                
                if (!token) {
                  res.statusCode = 401;
                  res.end(JSON.stringify({ error: 'Authentication required' }));
                  return;
                }
                
                try {
                  // Verify token
                  const decoded = jwt.verify(token, JWT_SECRET);
                  
                  // Get user data from existing users or use default
                  const userData = existingUsers[decoded.email] || existingUsers['default'];
                  
                  res.statusCode = 201;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    id: uuidv4(),
                    agent_id: userData.id, // Use the existing user ID
                    ...dealData,
                    status: 'Submitted',
                    created_at: new Date().toISOString()
                  }));
                } catch (error) {
                  console.error('Token verification error:', error);
                  res.statusCode = 401;
                  res.end(JSON.stringify({ error: 'Invalid token' }));
                }
              } catch (error) {
                console.error('Create deal error:', error);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Failed to create deal' }));
              }
            });
          } else {
            next();
          }
        });

        // Get carriers endpoint
        server.middlewares.use('/crm/api/carriers', (req, res, next) => {
          if (req.method === 'GET') {
            // Return some mock carriers
            const carriers = [
              { id: '1', name: 'Carrier 1', advance_rate: 0.8, payment_type: 'Monthly', advance_period_months: 12 },
              { id: '2', name: 'Carrier 2', advance_rate: 0.7, payment_type: 'Quarterly', advance_period_months: 6 },
              { id: '3', name: 'Carrier 3', advance_rate: 0.9, payment_type: 'Annual', advance_period_months: 3 }
            ];
            
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(carriers));
          } else {
            next();
          }
        });

        // Get products endpoint
        server.middlewares.use('/crm/api/products', (req, res, next) => {
          if (req.method === 'GET') {
            // Return some mock products
            const products = [
              { id: '1', carrier_id: '1', name: 'Product 1' },
              { id: '2', carrier_id: '1', name: 'Product 2' },
              { id: '3', carrier_id: '2', name: 'Product 3' },
              { id: '4', carrier_id: '3', name: 'Product 4' }
            ];
            
            // Filter by carrier_id if provided
            const carrierId = req.url.split('?')[1]?.split('=')[1];
            const filteredProducts = carrierId 
              ? products.filter(p => p.carrier_id === carrierId)
              : products;
            
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(filteredProducts));
          } else {
            next();
          }
        });

        // Get positions endpoint
        server.middlewares.use('/crm/api/positions', (req, res, next) => {
          if (req.method === 'GET') {
            // Return some mock positions
            const positions = [
              { id: '599470e2-3803-41a2-a792-82911e60c2f4', name: 'Admin', level: 3, description: 'Administrator' },
              { id: '8395f610-6c95-4cd5-b778-ee6825ac78d1', name: 'Owner', level: 4, description: 'Owner' },
              { id: 'ec2cfd8f-024d-4b5c-b23d-fd26d951f1bb', name: 'Manager', level: 2, description: 'Manager' },
              { id: '1f1d71c2-beec-43cd-99b2-2048c0afbde4', name: 'Agent', level: 1, description: 'Agent' }
            ];
            
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(positions));
          } else {
            next();
          }
        });

        // Health check endpoint
        server.middlewares.use('/crm/api/health', (req, res, next) => {
          if (req.method === 'GET') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'ok', timestamp: new Date() }));
          } else {
            next();
          }
        });

        console.log('Mock API server is running at /crm/api');
      }
    }
  ],
  server: {
    port: 5173,
    strictPort: true,
    base: '/crm/',
    open: '/crm/'
  },
  base: '/crm/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  }
});