/**
 * server-docker-routes.js
 * API routes for the Docker environment (deals, carriers, products, etc.)
 */

import { v4 as uuidv4 } from 'uuid';
import { setupAuthRoutes } from './server-docker-auth.js';

// Setup all API routes
function setupApiRoutes(app, pool, authenticateToken) {
  // Make pool available to middleware
  app.locals.pool = pool;
  
  // Setup authentication routes
  setupAuthRoutes(app, pool);
  
  // Setup data routes
  setupDealsRoutes(app, pool, authenticateToken);
  setupCarriersRoutes(app, pool, authenticateToken);
  setupProductsRoutes(app, pool, authenticateToken);
  setupPositionsRoutes(app, pool, authenticateToken);
}

// Setup deals routes
function setupDealsRoutes(app, pool, authenticateToken) {
  // Get all deals
  app.get('/crm/api/deals', authenticateToken, async (req, res) => {
    try {
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
      
      res.json(result.rows);
    } catch (error) {
      console.error('Get deals error:', error);
      res.status(500).json({ error: 'Failed to get deals' });
    }
  });
  
  // Create a new deal
  app.post('/crm/api/deals', authenticateToken, async (req, res) => {
    try {
      const { carrierId, productId, clientName, annualPremium, appNumber, clientPhone, effectiveDate, fromReferral } = req.body;
      
      // Generate deal ID
      const dealId = uuidv4();
      
      // Insert deal
      const result = await pool.query(
        `INSERT INTO deals 
         (id, agent_id, carrier_id, product_id, client_name, annual_premium, app_number, client_phone, effective_date, from_referral, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
         RETURNING *`,
        [dealId, req.user.id, carrierId, productId, clientName, annualPremium, appNumber, clientPhone, effectiveDate, fromReferral, 'Submitted']
      );
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create deal error:', error);
      res.status(500).json({ error: 'Failed to create deal' });
    }
  });
  
  // Additional deal routes can be added here (update, delete, etc.)
}

// Setup carriers routes
function setupCarriersRoutes(app, pool, authenticateToken) {
  // Get all carriers
  app.get('/crm/api/carriers', authenticateToken, async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM carriers ORDER BY name');
      
      res.json(result.rows);
    } catch (error) {
      console.error('Get carriers error:', error);
      res.status(500).json({ error: 'Failed to get carriers' });
    }
  });
  
  // Additional carrier routes can be added here (create, update, delete, etc.)
}

// Setup products routes
function setupProductsRoutes(app, pool, authenticateToken) {
  // Get products, optionally filtered by carrier
  app.get('/crm/api/products', authenticateToken, async (req, res) => {
    try {
      const carrierId = req.query.carrierId;
      
      let query = 'SELECT * FROM products';
      let params = [];
      
      if (carrierId) {
        query += ' WHERE carrier_id = $1';
        params.push(carrierId);
      }
      
      query += ' ORDER BY name';
      
      const result = await pool.query(query, params);
      
      res.json(result.rows);
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({ error: 'Failed to get products' });
    }
  });
  
  // Additional product routes can be added here (create, update, delete, etc.)
}

// Setup positions routes
function setupPositionsRoutes(app, pool, authenticateToken) {
  // Get all positions
  app.get('/crm/api/positions', authenticateToken, async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM positions ORDER BY level DESC');
      
      res.json(result.rows);
    } catch (error) {
      console.error('Get positions error:', error);
      res.status(500).json({ error: 'Failed to get positions' });
    }
  });
  
  // Additional position routes can be added here (create, update, delete, etc.)
}

// Export API routes setup function
export { setupApiRoutes };
