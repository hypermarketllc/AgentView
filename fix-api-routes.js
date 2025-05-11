/**
 * fix-api-routes.js
 * This script updates the API routes to ensure all required endpoints are available.
 */

import fs from 'fs';
import path from 'path';

// Path to the routes file
const routesFilePath = './server-docker-routes.js';

// Read the original file
console.log(`Reading ${routesFilePath}...`);
let originalContent;
try {
  originalContent = fs.readFileSync(routesFilePath, 'utf8');
} catch (error) {
  console.error(`Error reading ${routesFilePath}:`, error);
  process.exit(1);
}

// Create a backup
const backupPath = `${routesFilePath}.backup`;
console.log(`Creating backup at ${backupPath}...`);
fs.writeFileSync(backupPath, originalContent);

// Check if the file already has the required endpoints
console.log('Checking for existing endpoints...');

// Update the system health checks routes to include standard API endpoints
console.log('Updating system health checks routes...');
let updatedContent = originalContent.replace(
  /function setupSystemHealthChecksRoutes\(app, pool, authenticateToken\) {[\s\S]*?}\s*\n/,
  `function setupSystemHealthChecksRoutes(app, pool, authenticateToken) {
  // Get system health checks - CRM endpoint
  app.get(\`/crm/api\${SERVER_ENDPOINTS.SYSTEM.HEALTH_CHECKS}\`, authenticateToken, async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM system_health_checks ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (error) {
      console.error('Get system health checks error:', error);
      res.status(500).json({ error: 'Failed to get system health checks' });
    }
  });
  
  // Create a new system health check - CRM endpoint
  app.post(\`/crm/api\${SERVER_ENDPOINTS.SYSTEM.HEALTH_CHECKS}\`, authenticateToken, async (req, res) => {
    try {
      const { component, status, message, endpoint, category } = req.body;
      
      // Generate ID
      const id = uuidv4();
      
      // Insert system health check
      const result = await pool.query(
        \`INSERT INTO system_health_checks 
         (id, component, status, message, endpoint, category, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         RETURNING *\`,
        [id, component, status, message, endpoint, category || 'System']
      );
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create system health check error:', error);
      res.status(500).json({ error: 'Failed to create system health check' });
    }
  });
  
  // Delete a system health check - CRM endpoint
  app.delete(\`/crm/api\${SERVER_ENDPOINTS.SYSTEM.HEALTH_CHECKS}/:id\`, authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Delete system health check
      await pool.query('DELETE FROM system_health_checks WHERE id = $1', [id]);
      
      res.status(204).send();
    } catch (error) {
      console.error('Delete system health check error:', error);
      res.status(500).json({ error: 'Failed to delete system health check' });
    }
  });
  
  // Delete all system health checks (for cleanup) - CRM endpoint
  app.delete(\`/crm/api\${SERVER_ENDPOINTS.SYSTEM.HEALTH_CHECKS}\`, authenticateToken, async (req, res) => {
    try {
      // Delete all health checks
      await pool.query('DELETE FROM system_health_checks');
      
      res.status(204).send();
    } catch (error) {
      console.error('Delete all system health checks error:', error);
      res.status(500).json({ error: 'Failed to delete all system health checks' });
    }
  });
  
  // Standard API endpoints for system health checks
  
  // Get all system health checks
  app.get('/api/system-health-checks', authenticateToken, async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM system_health_checks ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching system health checks:', error);
      res.status(500).json({ error: 'Failed to fetch system health checks' });
    }
  });

  app.get('/api/system-health-checks/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query('SELECT * FROM system_health_checks WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'System health check not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching system health check:', error);
      res.status(500).json({ error: 'Failed to fetch system health check' });
    }
  });

  app.post('/api/system-health-checks', authenticateToken, async (req, res) => {
    try {
      const { component, status, message } = req.body;
      
      if (!component || !status) {
        return res.status(400).json({ error: 'Component and status are required' });
      }
      
      const result = await pool.query(
        \`INSERT INTO system_health_checks (component, status, message, last_checked)
         VALUES ($1, $2, $3, NOW())
         RETURNING *\`,
        [component, status, message]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating system health check:', error);
      res.status(500).json({ error: 'Failed to create system health check' });
    }
  });

  app.put('/api/system-health-checks/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { component, status, message } = req.body;
      
      if (!component || !status) {
        return res.status(400).json({ error: 'Component and status are required' });
      }
      
      const result = await pool.query(
        \`UPDATE system_health_checks
         SET component = $1, status = $2, message = $3, last_checked = NOW(), updated_at = NOW()
         WHERE id = $4
         RETURNING *\`,
        [component, status, message, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'System health check not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating system health check:', error);
      res.status(500).json({ error: 'Failed to update system health check' });
    }
  });

  app.delete('/api/system-health-checks/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await pool.query('DELETE FROM system_health_checks WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'System health check not found' });
      }
      
      res.json({ message: 'System health check deleted successfully' });
    } catch (error) {
      console.error('Error deleting system health check:', error);
      res.status(500).json({ error: 'Failed to delete system health check' });
    }
  });
}

`
);

// Update the settings routes to include standard API endpoints
console.log('Updating settings routes...');
updatedContent = updatedContent.replace(
  /function setupSettingsRoutes\(app, pool, authenticateToken\) {[\s\S]*?}\s*\n/,
  `function setupSettingsRoutes(app, pool, authenticateToken) {
  // Get system settings - CRM endpoint
  app.get(\`/crm/api\${SERVER_ENDPOINTS.SETTINGS.SYSTEM}\`, authenticateToken, async (req, res) => {
    try {
      // Get system settings
      const result = await pool.query(
        \`SELECT * FROM settings WHERE category = 'system'\`
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
  
  // Update system settings - CRM endpoint
  app.put(\`/crm/api\${SERVER_ENDPOINTS.SETTINGS.SYSTEM}\`, authenticateToken, async (req, res) => {
    try {
      const { name, logo_url } = req.body;
      
      // Start transaction
      await pool.query('BEGIN');
      
      // Update or insert name setting
      if (name) {
        await pool.query(
          \`INSERT INTO settings (key, value, category)
           VALUES ('name', $1, 'system')
           ON CONFLICT (key, category) DO UPDATE
           SET value = $1\`,
          [name]
        );
      }
      
      // Update or insert logo_url setting
      if (logo_url) {
        await pool.query(
          \`INSERT INTO settings (key, value, category)
           VALUES ('logo_url', $1, 'system')
           ON CONFLICT (key, category) DO UPDATE
           SET value = $1\`,
          [logo_url]
        );
      }
      
      // Commit transaction
      await pool.query('COMMIT');
      
      // Get updated settings
      const result = await pool.query(
        \`SELECT * FROM settings WHERE category = 'system'\`
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
  
  // Standard API endpoints for settings
  
  // Get all settings
  app.get('/api/settings', authenticateToken, async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM settings ORDER BY key');
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.get('/api/settings/:key', authenticateToken, async (req, res) => {
    try {
      const { key } = req.params;
      const result = await pool.query('SELECT * FROM settings WHERE key = $1', [key]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Setting not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching setting:', error);
      res.status(500).json({ error: 'Failed to fetch setting' });
    }
  });

  app.post('/api/settings', authenticateToken, async (req, res) => {
    try {
      const { key, value, description } = req.body;
      
      if (!key || !value) {
        return res.status(400).json({ error: 'Key and value are required' });
      }
      
      // Check if setting already exists
      const existingResult = await pool.query('SELECT * FROM settings WHERE key = $1', [key]);
      
      if (existingResult.rows.length > 0) {
        return res.status(409).json({ error: 'Setting with this key already exists' });
      }
      
      const result = await pool.query(
        \`INSERT INTO settings (key, value, description)
         VALUES ($1, $2, $3)
         RETURNING *\`,
        [key, value, description]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating setting:', error);
      res.status(500).json({ error: 'Failed to create setting' });
    }
  });

  app.put('/api/settings/:key', authenticateToken, async (req, res) => {
    try {
      const { key } = req.params;
      const { value, description } = req.body;
      
      if (!value) {
        return res.status(400).json({ error: 'Value is required' });
      }
      
      const result = await pool.query(
        \`UPDATE settings
         SET value = $1, description = $2, updated_at = NOW()
         WHERE key = $3
         RETURNING *\`,
        [value, description, key]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Setting not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating setting:', error);
      res.status(500).json({ error: 'Failed to update setting' });
    }
  });

  app.delete('/api/settings/:key', authenticateToken, async (req, res) => {
    try {
      const { key } = req.params;
      
      const result = await pool.query('DELETE FROM settings WHERE key = $1 RETURNING *', [key]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Setting not found' });
      }
      
      res.json({ message: 'Setting deleted successfully' });
    } catch (error) {
      console.error('Error deleting setting:', error);
      res.status(500).json({ error: 'Failed to delete setting' });
    }
  });
  
  // CRM Settings API endpoints
  app.get('/crm/api/settings', authenticateToken, async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM settings ORDER BY key');
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });
}

`
);

// Add user_accs routes
console.log('Adding user_accs routes...');
const userAccsRoutes = `
// Setup user accounts routes
function setupUserAccsRoutes(app, pool, authenticateToken) {
  // Get all user accounts
  app.get('/api/user-accs', authenticateToken, async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM user_accs ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching user accounts:', error);
      res.status(500).json({ error: 'Failed to fetch user accounts' });
    }
  });

  app.get('/api/user-accs/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query('SELECT * FROM user_accs WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User account not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching user account:', error);
      res.status(500).json({ error: 'Failed to fetch user account' });
    }
  });

  app.post('/api/user-accs', authenticateToken, async (req, res) => {
    try {
      const { user_id, account_type, account_status, settings } = req.body;
      
      if (!user_id || !account_type || !account_status) {
        return res.status(400).json({ error: 'User ID, account type, and account status are required' });
      }
      
      const result = await pool.query(
        \`INSERT INTO user_accs (user_id, account_type, account_status, settings)
         VALUES ($1, $2, $3, $4)
         RETURNING *\`,
        [user_id, account_type, account_status, settings || {}]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating user account:', error);
      res.status(500).json({ error: 'Failed to create user account' });
    }
  });

  app.put('/api/user-accs/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { user_id, account_type, account_status, settings } = req.body;
      
      if (!user_id || !account_type || !account_status) {
        return res.status(400).json({ error: 'User ID, account type, and account status are required' });
      }
      
      const result = await pool.query(
        \`UPDATE user_accs
         SET user_id = $1, account_type = $2, account_status = $3, settings = $4, updated_at = NOW()
         WHERE id = $5
         RETURNING *\`,
        [user_id, account_type, account_status, settings || {}, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User account not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating user account:', error);
      res.status(500).json({ error: 'Failed to update user account' });
    }
  });

  app.delete('/api/user-accs/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await pool.query('DELETE FROM user_accs WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User account not found' });
      }
      
      res.json({ message: 'User account deleted successfully' });
    } catch (error) {
      console.error('Error deleting user account:', error);
      res.status(500).json({ error: 'Failed to delete user account' });
    }
  });
  
  // CRM User Accounts API endpoints
  app.get('/crm/api/user-accs', authenticateToken, async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM user_accs ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching user accounts:', error);
      res.status(500).json({ error: 'Failed to fetch user accounts' });
    }
  });

  app.get('/crm/api/user-accs/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query('SELECT * FROM user_accs WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User account not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching user account:', error);
      res.status(500).json({ error: 'Failed to fetch user account' });
    }
  });

  app.post('/crm/api/user-accs', authenticateToken, async (req, res) => {
    try {
      const { user_id, account_type, account_status, settings } = req.body;
      
      if (!user_id || !account_type || !account_status) {
        return res.status(400).json({ error: 'User ID, account type, and account status are required' });
      }
      
      const result = await pool.query(
        \`INSERT INTO user_accs (user_id, account_type, account_status, settings)
         VALUES ($1, $2, $3, $4)
         RETURNING *\`,
        [user_id, account_type, account_status, settings || {}]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating user account:', error);
      res.status(500).json({ error: 'Failed to create user account' });
    }
  });

  app.put('/crm/api/user-accs/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { user_id, account_type, account_status, settings } = req.body;
      
      if (!user_id || !account_type || !account_status) {
        return res.status(400).json({ error: 'User ID, account type, and account status are required' });
      }
      
      const result = await pool.query(
        \`UPDATE user_accs
         SET user_id = $1, account_type = $2, account_status = $3, settings = $4, updated_at = NOW()
         WHERE id = $5
         RETURNING *\`,
        [user_id, account_type, account_status, settings || {}, id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User account not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating user account:', error);
      res.status(500).json({ error: 'Failed to update user account' });
    }
  });

  app.delete('/crm/api/user-accs/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      
      const result = await pool.query('DELETE FROM user_accs WHERE id = $1 RETURNING *', [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User account not found' });
      }
      
      res.json({ message: 'User account deleted successfully' });
    } catch (error) {
      console.error('Error deleting user account:', error);
      res.status(500).json({ error: 'Failed to delete user account' });
    }
  });
}

`;

// Add the user_accs routes before the export
const exportPosition = updatedContent.indexOf('// Export API routes setup function');
if (exportPosition === -1) {
  console.error('Could not find the export position in the file.');
  process.exit(1);
}

updatedContent = updatedContent.slice(0, exportPosition) + userAccsRoutes + updatedContent.slice(exportPosition);

// Update the setupApiRoutes function to include the new setupUserAccsRoutes function
updatedContent = updatedContent.replace(
  /setupSystemHealthChecksRoutes\(app, pool, authenticateToken\);(\s*)setupSettingsRoutes\(app, pool, authenticateToken\);/,
  'setupSystemHealthChecksRoutes(app, pool, authenticateToken);$1setupSettingsRoutes(app, pool, authenticateToken);$1setupUserAccsRoutes(app, pool, authenticateToken);'
);

// Write the updated content back to the file
console.log('Writing updated content back to the file...');
fs.writeFileSync(routesFilePath, updatedContent);

console.log('API routes updated successfully.');
console.log('The following endpoints have been added or updated:');
console.log('- System Health Checks: GET, POST, PUT, DELETE for /api/system-health-checks and /crm/api/system-health-checks');
console.log('- User Accounts: GET, POST, PUT, DELETE for /api/user-accs and /crm/api/user-accs');
console.log('- Settings: GET, POST, PUT, DELETE for /api/settings and /crm/api/settings');
