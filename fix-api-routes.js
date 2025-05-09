/**
 * fix-api-routes.js
 * 
 * This script fixes the API routes for user settings and system settings.
 * It creates a new server file with the correct routes.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a new server file with the fixed routes
async function fixApiRoutes() {
  try {
    console.log('Fixing API routes...');
    
    // Read the server-docker-routes.js file
    const routesFilePath = path.join(__dirname, 'server-docker-routes.js');
    const routesContent = fs.readFileSync(routesFilePath, 'utf8');
    
    // Create a new server file with the fixed routes
    const fixedServerFilePath = path.join(__dirname, 'server-docker-fixed.js');
    
    // Read the server-docker.js file
    const serverFilePath = path.join(__dirname, 'server-docker.js');
    const serverContent = fs.readFileSync(serverFilePath, 'utf8');
    
    // Add direct route handlers for user settings and system settings
    const fixedServerContent = serverContent.replace(
      'app.get(\'/crm/api/positions\', authenticateToken, async (req, res) => {',
      `// User settings route
app.get('/crm/api/user/settings', authenticateToken, async (req, res) => {
  try {
    // Get user details with position
    const userResult = await pool.query(
      \`SELECT u.*, p.name as position_name, p.level as position_level 
       FROM users u
       JOIN positions p ON u.position_id = p.id
       WHERE u.id = $1\`,
      [req.user.id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Get user account settings
    const accountResult = await pool.query(
      \`SELECT * FROM user_accs WHERE user_id = $1\`,
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
      \`SELECT id, full_name FROM users WHERE upline_id = $1\`,
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

// System settings route
app.get('/crm/api/settings/system', authenticateToken, async (req, res) => {
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

app.get('/crm/api/positions', authenticateToken, async (req, res) => {`
    );
    
    // Write the fixed server file
    fs.writeFileSync(fixedServerFilePath, fixedServerContent);
    
    console.log('API routes fixed successfully');
    console.log(`Fixed server file created at: ${fixedServerFilePath}`);
    
    return true;
  } catch (error) {
    console.error('Error fixing API routes:', error);
    return false;
  }
}

// Run the function
fixApiRoutes();
