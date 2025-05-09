/**
 * server-docker-routes.js
 * API routes for the Docker environment (deals, carriers, products, etc.)
 */

import { v4 as uuidv4 } from 'uuid';
import { setupAuthRoutes } from './server-docker-auth.js';
import SERVER_ENDPOINTS from './server-endpoints.js';

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
  setupUserSettingsRoutes(app, pool, authenticateToken);
  setupSystemHealthChecksRoutes(app, pool, authenticateToken);
  setupSettingsRoutes(app, pool, authenticateToken);
}

// Setup deals routes
function setupDealsRoutes(app, pool, authenticateToken) {
  // Get all deals
  app.get(`/crm/api${SERVER_ENDPOINTS.DATA.DEALS}`, authenticateToken, async (req, res) => {
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
  app.post(`/crm/api${SERVER_ENDPOINTS.DATA.DEALS}`, authenticateToken, async (req, res) => {
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
  app.get(`/crm/api${SERVER_ENDPOINTS.DATA.CARRIERS}`, authenticateToken, async (req, res) => {
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
  app.get(`/crm/api${SERVER_ENDPOINTS.DATA.PRODUCTS}`, authenticateToken, async (req, res) => {
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
  app.get(`/crm/api${SERVER_ENDPOINTS.DATA.POSITIONS}`, authenticateToken, async (req, res) => {
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

// Setup user settings routes
function setupUserSettingsRoutes(app, pool, authenticateToken) {
  // Get user settings
  app.get(`/crm/api${SERVER_ENDPOINTS.USER.SETTINGS}`, authenticateToken, async (req, res) => {
    try {
      // Get user details with position
      const userResult = await pool.query(
        `SELECT u.*, p.name as position_name, p.level as position_level 
         FROM users u
         JOIN positions p ON u.position_id = p.id
         WHERE u.id = $1`,
        [req.user.id]
      );
      
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const user = userResult.rows[0];
      
      // Get user account settings
      const accountResult = await pool.query(
        `SELECT * FROM user_accs WHERE user_id = $1`,
        [req.user.id]
      );
      
      const account = accountResult.rows[0] || {
        display_name: user.full_name,
        theme_preference: 'light',
        notification_preferences: {
          email: true,
          push: true,
          deals: true,
          system: true
        }
      };
      
      // Get downline users
      const downlineResult = await pool.query(
        `SELECT id, full_name FROM users WHERE upline_id = $1`,
        [req.user.id]
      );
      
      const downline = downlineResult.rows[0] || null;
      
      // Return combined user data
      res.json({
        ...user,
        user_account: account,
        downline
      });
    } catch (error) {
      console.error('Get user settings error:', error);
      res.status(500).json({ error: 'Failed to get user settings' });
    }
  });
  
  // Update user settings
  app.put(`/crm/api${SERVER_ENDPOINTS.USER.SETTINGS}`, authenticateToken, async (req, res) => {
    try {
      const { user_account, ...userUpdates } = req.body;
      
      // Start transaction
      await pool.query('BEGIN');
      
      // Update user details
      const userResult = await pool.query(
        `UPDATE users
         SET full_name = COALESCE($1, full_name),
             email = COALESCE($2, email),
             phone = $3,
             national_producer_number = $4,
             annual_goal = $5
         WHERE id = $6
         RETURNING *`,
        [
          userUpdates.full_name,
          userUpdates.email,
          userUpdates.phone,
          userUpdates.national_producer_number,
          userUpdates.annual_goal,
          req.user.id
        ]
      );
      
      if (userResult.rows.length === 0) {
        await pool.query('ROLLBACK');
        return res.status(404).json({ error: 'User not found' });
      }
      
      const user = userResult.rows[0];
      
      // Check if user_account exists
      const accountExistsResult = await pool.query(
        `SELECT id FROM user_accs WHERE user_id = $1`,
        [req.user.id]
      );
      
      let account;
      
      if (accountExistsResult.rows.length > 0) {
        // Update existing account
        const accountResult = await pool.query(
          `UPDATE user_accs
           SET display_name = COALESCE($1, display_name),
               theme_preference = COALESCE($2, theme_preference),
               notification_preferences = COALESCE($3, notification_preferences),
               updated_at = NOW()
           WHERE user_id = $4
           RETURNING *`,
          [
            user_account?.display_name,
            user_account?.theme_preference,
            user_account?.notification_preferences,
            req.user.id
          ]
        );
        
        account = accountResult.rows[0];
      } else if (user_account) {
        // Insert new account
        const accountResult = await pool.query(
          `INSERT INTO user_accs
           (user_id, display_name, theme_preference, notification_preferences, created_at, updated_at)
           VALUES ($1, $2, $3, $4, NOW(), NOW())
           RETURNING *`,
          [
            req.user.id,
            user_account.display_name || user.full_name,
            user_account.theme_preference || 'light',
            user_account.notification_preferences || {
              email: true,
              push: true,
              deals: true,
              system: true
            }
          ]
        );
        
        account = accountResult.rows[0];
      }
      
      // Commit transaction
      await pool.query('COMMIT');
      
      // Get position info
      const positionResult = await pool.query(
        `SELECT name as position_name, level as position_level 
         FROM positions 
         WHERE id = $1`,
        [user.position_id]
      );
      
      const position = positionResult.rows[0] || {};
      
      // Return updated user data
      res.json({
        ...user,
        position_name: position.position_name,
        position_level: position.position_level,
        user_account: account
      });
    } catch (error) {
      // Rollback transaction on error
      await pool.query('ROLLBACK');
      
      console.error('Update user settings error:', error);
      res.status(500).json({ error: 'Failed to update user settings' });
    }
  });
  
  // Update user password
  app.put(`/crm/api${SERVER_ENDPOINTS.USER.PASSWORD}`, authenticateToken, async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!password || password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long' });
      }
      
      // Hash password
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Update password
      await pool.query(
        `UPDATE users SET password_hash = $1 WHERE id = $2`,
        [passwordHash, req.user.id]
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error('Update password error:', error);
      res.status(500).json({ error: 'Failed to update password' });
    }
  });
}

// Setup system health checks routes
function setupSystemHealthChecksRoutes(app, pool, authenticateToken) {
  // Get system health checks
  app.get(`/crm/api${SERVER_ENDPOINTS.SYSTEM.HEALTH_CHECKS}`, authenticateToken, async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM system_health_checks ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (error) {
      console.error('Get system health checks error:', error);
      res.status(500).json({ error: 'Failed to get system health checks' });
    }
  });
  
  // Create a new system health check
  app.post(`/crm/api${SERVER_ENDPOINTS.SYSTEM.HEALTH_CHECKS}`, authenticateToken, async (req, res) => {
    try {
      const { test_value } = req.body;
      
      // Generate ID
      const id = uuidv4();
      
      // Insert health check
      const result = await pool.query(
        `INSERT INTO system_health_checks 
         (id, test_value, created_at)
         VALUES ($1, $2, NOW())
         RETURNING *`,
        [id, test_value]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create system health check error:', error);
      res.status(500).json({ error: 'Failed to create system health check' });
    }
  });
  
  // Delete a system health check
  app.delete(`/crm/api${SERVER_ENDPOINTS.SYSTEM.HEALTH_CHECKS}/:id`, authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Delete health check
      await pool.query('DELETE FROM system_health_checks WHERE id = $1', [id]);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Delete system health check error:', error);
      res.status(500).json({ error: 'Failed to delete system health check' });
    }
  });
  
  // Delete all system health checks (for cleanup)
  app.delete(`/crm/api${SERVER_ENDPOINTS.SYSTEM.HEALTH_CHECKS}`, authenticateToken, async (req, res) => {
    try {
      // Delete all health checks
      await pool.query('DELETE FROM system_health_checks');
      
      res.json({ success: true });
    } catch (error) {
      console.error('Delete all system health checks error:', error);
      res.status(500).json({ error: 'Failed to delete all system health checks' });
    }
  });
}

// Setup settings routes
function setupSettingsRoutes(app, pool, authenticateToken) {
  // Get system settings
  app.get(`/crm/api${SERVER_ENDPOINTS.SETTINGS.SYSTEM}`, authenticateToken, async (req, res) => {
    try {
      // Get system settings
      const result = await pool.query(
        `SELECT * FROM settings WHERE category = 'system'`
      );
      
      // Convert array of settings to object
      const settings = {};
      result.rows.forEach(row => {
        settings[row.key] = row.value;
      });
      
      // Add default name if not set
      if (!settings.name) {
        settings.name = 'MyAgentView';
      }
      
      res.json(settings);
    } catch (error) {
      console.error('Get system settings error:', error);
      res.status(500).json({ error: 'Failed to get system settings' });
    }
  });
  
  // Update system settings
  app.put(`/crm/api${SERVER_ENDPOINTS.SETTINGS.SYSTEM}`, authenticateToken, async (req, res) => {
    try {
      const { name, logo_url } = req.body;
      
      // Start transaction
      await pool.query('BEGIN');
      
      // Update or insert name setting
      if (name) {
        await pool.query(
          `INSERT INTO settings (key, value, category)
           VALUES ('name', $1, 'system')
           ON CONFLICT (key, category) DO UPDATE
           SET value = $1`,
          [name]
        );
      }
      
      // Update or insert logo_url setting
      if (logo_url) {
        await pool.query(
          `INSERT INTO settings (key, value, category)
           VALUES ('logo_url', $1, 'system')
           ON CONFLICT (key, category) DO UPDATE
           SET value = $1`,
          [logo_url]
        );
      }
      
      // Commit transaction
      await pool.query('COMMIT');
      
      // Get updated settings
      const result = await pool.query(
        `SELECT * FROM settings WHERE category = 'system'`
      );
      
      // Convert array of settings to object
      const settings = {};
      result.rows.forEach(row => {
        settings[row.key] = row.value;
      });
      
      res.json(settings);
    } catch (error) {
      // Rollback transaction on error
      await pool.query('ROLLBACK');
      
      console.error('Update system settings error:', error);
      res.status(500).json({ error: 'Failed to update system settings' });
    }
  });
}

// Export API routes setup function
export { setupApiRoutes };
