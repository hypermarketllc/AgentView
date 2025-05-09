/**
 * system-status-handlers.js
 * 
 * Handlers for system status API endpoints.
 * These handlers provide functionality for retrieving health check data,
 * running health checks, and retrieving error statistics.
 */

import { HealthMonitorService } from '../services/health-monitor-service.js';
import { getErrorStats, getErrorDetails, AuthorizationError } from '../lib/error-handler.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get basic health status
 */
export async function handleGetHealth(req, res) {
  res.json({ status: 'ok', timestamp: new Date() });
}

/**
 * Get system health summary
 */
export async function handleGetHealthSummary(req, res) {
  // Check if user has owner/admin access (level 3+)
  if (req.user.position.level < 3) {
    throw new AuthorizationError('Only admin or owner can access system health summary');
  }
  
  const { timeframe = '24h' } = req.query;
  const healthMonitor = new HealthMonitorService(req.app.locals.pool, req.app.locals.apiBaseUrl);
  
  const summary = await healthMonitor.getHealthSummary({ timeframe });
  res.json(summary);
}

/**
 * Get system health history
 */
export async function handleGetHealthHistory(req, res) {
  // Check if user has owner/admin access (level 3+)
  if (req.user.position.level < 3) {
    throw new AuthorizationError('Only admin or owner can access system health history');
  }
  
  const { timeframe = '24h', category, endpoint, limit = 100 } = req.query;
  const healthMonitor = new HealthMonitorService(req.app.locals.pool, req.app.locals.apiBaseUrl);
  
  const history = await healthMonitor.getHealthHistory({ 
    timeframe, 
    category, 
    endpoint, 
    limit: parseInt(limit) 
  });
  
  res.json(history);
}

/**
 * Run health checks
 */
export async function handleRunHealthChecks(req, res) {
  // Check if user has owner/admin access (level 3+)
  if (req.user.position.level < 3) {
    throw new AuthorizationError('Only admin or owner can run health checks');
  }
  
  const healthMonitor = new HealthMonitorService(req.app.locals.pool, req.app.locals.apiBaseUrl);
  
  const results = await healthMonitor.runAllChecks();
  res.json(results);
}

/**
 * Get error statistics
 */
export async function handleGetErrorStats(req, res) {
  // Check if user has owner/admin access (level 3+)
  if (req.user.position.level < 3) {
    throw new AuthorizationError('Only admin or owner can access error statistics');
  }
  
  const { timeframe = '24h', limit = 10 } = req.query;
  
  const stats = await getErrorStats(req.app.locals.pool, { 
    timeframe, 
    limit: parseInt(limit) 
  });
  
  res.json(stats);
}

/**
 * Get error details
 */
export async function handleGetErrorDetails(req, res) {
  // Check if user has owner/admin access (level 3+)
  if (req.user.position.level < 3) {
    throw new AuthorizationError('Only admin or owner can access error details');
  }
  
  const { id } = req.params;
  
  const details = await getErrorDetails(req.app.locals.pool, id);
  
  if (!details) {
    return res.status(404).json({ error: 'Error not found' });
  }
  
  res.json(details);
}

/**
 * Get system health checks
 */
export async function handleGetHealthChecks(req, res) {
  // Check if user has owner/admin access (level 3+)
  if (req.user.position.level < 3) {
    throw new AuthorizationError('Only admin or owner can access health checks');
  }
  
  const { limit = 100, offset = 0 } = req.query;
  
  const result = await req.app.locals.pool.query(
    `SELECT * FROM system_health_checks 
     ORDER BY created_at DESC 
     LIMIT $1 OFFSET $2`,
    [parseInt(limit), parseInt(offset)]
  );
  
  res.json(result.rows);
}

/**
 * Create a health check
 */
export async function handleCreateHealthCheck(req, res) {
  // Check if user has owner/admin access (level 3+)
  if (req.user.position.level < 3) {
    throw new AuthorizationError('Only admin or owner can create health checks');
  }
  
  const { endpoint, category, status, responseTime, statusCode, errorMessage } = req.body;
  
  // Validate required fields
  if (!endpoint || !category || !status) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const result = await req.app.locals.pool.query(
    `INSERT INTO system_health_checks (
      id, endpoint, category, status, response_time, 
      status_code, error_message, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    RETURNING *`,
    [
      uuidv4(),
      endpoint,
      category,
      status,
      responseTime || null,
      statusCode || null,
      errorMessage || null
    ]
  );
  
  res.status(201).json(result.rows[0]);
}

/**
 * Delete a health check
 */
export async function handleDeleteHealthCheck(req, res) {
  // Check if user has owner/admin access (level 3+)
  if (req.user.position.level < 3) {
    throw new AuthorizationError('Only admin or owner can delete health checks');
  }
  
  const { id } = req.params;
  
  const result = await req.app.locals.pool.query(
    'DELETE FROM system_health_checks WHERE id = $1 RETURNING id',
    [id]
  );
  
  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Health check not found' });
  }
  
  res.json({ message: 'Health check deleted successfully' });
}

/**
 * Delete all health checks
 */
export async function handleDeleteAllHealthChecks(req, res) {
  // Check if user has owner/admin access (level 3+)
  if (req.user.position.level < 3) {
    throw new AuthorizationError('Only admin or owner can delete all health checks');
  }
  
  const result = await req.app.locals.pool.query(
    'DELETE FROM system_health_checks RETURNING id'
  );
  
  res.json({ 
    message: 'All health checks deleted successfully',
    count: result.rowCount
  });
}

/**
 * Get user settings
 */
export async function handleGetUserSettings(req, res) {
  const result = await req.app.locals.pool.query(
    'SELECT * FROM user_accs WHERE user_id = $1',
    [req.user.id]
  );
  
  if (result.rows.length === 0) {
    // Create default settings if they don't exist
    const newSettings = await req.app.locals.pool.query(
      `INSERT INTO user_accs (
        id, user_id, theme, notification_preferences, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *`,
      [
        uuidv4(),
        req.user.id,
        'light',
        JSON.stringify({ email: true, sms: false, push: true })
      ]
    );
    
    return res.json(newSettings.rows[0]);
  }
  
  res.json(result.rows[0]);
}

/**
 * Update user settings
 */
export async function handleUpdateUserSettings(req, res) {
  const { theme, notificationPreferences, dashboardLayout } = req.body;
  
  // Check if settings exist
  const existingResult = await req.app.locals.pool.query(
    'SELECT * FROM user_accs WHERE user_id = $1',
    [req.user.id]
  );
  
  if (existingResult.rows.length === 0) {
    // Create new settings
    const newSettings = await req.app.locals.pool.query(
      `INSERT INTO user_accs (
        id, user_id, theme, notification_preferences, dashboard_layout, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *`,
      [
        uuidv4(),
        req.user.id,
        theme || 'light',
        notificationPreferences ? JSON.stringify(notificationPreferences) : JSON.stringify({ email: true, sms: false, push: true }),
        dashboardLayout ? JSON.stringify(dashboardLayout) : null
      ]
    );
    
    return res.json(newSettings.rows[0]);
  }
  
  // Update existing settings
  const updateResult = await req.app.locals.pool.query(
    `UPDATE user_accs
     SET theme = COALESCE($1, theme),
         notification_preferences = COALESCE($2, notification_preferences),
         dashboard_layout = COALESCE($3, dashboard_layout),
         updated_at = NOW()
     WHERE user_id = $4
     RETURNING *`,
    [
      theme || null,
      notificationPreferences ? JSON.stringify(notificationPreferences) : null,
      dashboardLayout ? JSON.stringify(dashboardLayout) : null,
      req.user.id
    ]
  );
  
  res.json(updateResult.rows[0]);
}

/**
 * Get system settings
 */
export async function handleGetSystemSettings(req, res) {
  // Check if user has owner/admin access (level 3+)
  if (req.user.position.level < 3) {
    throw new AuthorizationError('Only admin or owner can access system settings');
  }
  
  const result = await req.app.locals.pool.query(
    'SELECT * FROM settings ORDER BY category, key'
  );
  
  res.json(result.rows);
}

/**
 * Update system settings
 */
export async function handleUpdateSystemSettings(req, res) {
  // Check if user has owner/admin access (level 3+)
  if (req.user.position.level < 3) {
    throw new AuthorizationError('Only admin or owner can update system settings');
  }
  
  const { category, key, value, description } = req.body;
  
  // Validate required fields
  if (!category || !key || !value) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Check if setting exists
  const existingResult = await req.app.locals.pool.query(
    'SELECT * FROM settings WHERE category = $1 AND key = $2',
    [category, key]
  );
  
  if (existingResult.rows.length === 0) {
    // Create new setting
    const newSetting = await req.app.locals.pool.query(
      `INSERT INTO settings (
        id, category, key, value, description, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *`,
      [
        uuidv4(),
        category,
        key,
        JSON.stringify(value),
        description || null
      ]
    );
    
    return res.status(201).json(newSetting.rows[0]);
  }
  
  // Update existing setting
  const updateResult = await req.app.locals.pool.query(
    `UPDATE settings
     SET value = $1,
         description = COALESCE($2, description),
         updated_at = NOW()
     WHERE category = $3 AND key = $4
     RETURNING *`,
    [
      JSON.stringify(value),
      description || null,
      category,
      key
    ]
  );
  
  res.json(updateResult.rows[0]);
}

/**
 * Create a new health check
 */
export async function createHealthCheck(req, res) {
  try {
    const { endpoint, category } = req.body;
    
    if (!endpoint || !category) {
      return res.status(400).json({ error: 'Endpoint and category are required' });
    }
    
    // Insert the health check
    const result = await pool.query(
      `INSERT INTO system_health_checks 
       (id, endpoint, category, status, response_time, status_code, created_at)
       VALUES 
       (gen_random_uuid(), $1, $2, 'PENDING', 0, 0, NOW())
       RETURNING *`,
      [endpoint, category]
    );
    
    // Run the health check immediately
    const healthMonitorService = req.app.get('healthMonitorService');
    if (healthMonitorService) {
      await healthMonitorService.runCheck(result.rows[0]);
    }
    
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return handleError(error, req, res);
  }
}

/**
 * Delete a health check by ID
 */
export async function deleteHealthCheck(req, res) {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM system_health_checks WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Health check not found' });
    }
    
    return res.json({ success: true, message: 'Health check deleted successfully' });
  } catch (error) {
    return handleError(error, req, res);
  }
}

/**
 * Delete all health checks
 */
export async function deleteAllHealthChecks(req, res) {
  try {
    // Check if user has admin permissions
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin permissions required' });
    }
    
    await pool.query('DELETE FROM system_health_checks');
    
    return res.json({ success: true, message: 'All health checks deleted successfully' });
  } catch (error) {
    return handleError(error, req, res);
  }
}

/**
 * Delete user settings for the authenticated user
 */
export async function handleDeleteUserSettings(req, res) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    await pool.query(
      'DELETE FROM user_accs WHERE user_id = $1',
      [userId]
    );
    
    return res.json({ success: true, message: 'User settings deleted successfully' });
  } catch (error) {
    return handleError(error, req, res);
  }
}

/**
 * Get a specific system setting by key
 */
export async function handleGetSettingByKey(req, res) {
  try {
    const { key } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM settings WHERE key = $1',
      [key]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    return res.json(result.rows[0]);
  } catch (error) {
    return handleError(error, req, res);
  }
}

/**
 * Create a new system setting
 */
export async function handleCreateSetting(req, res) {
  try {
    // Check if user has admin permissions
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin permissions required' });
    }
    
    const { key, value, description } = req.body;
    
    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Key and value are required' });
    }
    
    // Check if setting already exists
    const checkResult = await pool.query(
      'SELECT * FROM settings WHERE key = $1',
      [key]
    );
    
    if (checkResult.rows.length > 0) {
      return res.status(409).json({ error: 'Setting already exists' });
    }
    
    // Create new setting
    const insertResult = await pool.query(
      `INSERT INTO settings 
       (id, key, value, description, created_at, updated_at)
       VALUES 
       (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
       RETURNING *`,
      [key, value, description]
    );
    
    return res.status(201).json(insertResult.rows[0]);
  } catch (error) {
    return handleError(error, req, res);
  }
}

/**
 * Delete a system setting
 */
export async function handleDeleteSetting(req, res) {
  try {
    // Check if user has admin permissions
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin permissions required' });
    }
    
    const { key } = req.params;
    
    const result = await pool.query(
      'DELETE FROM settings WHERE key = $1 RETURNING *',
      [key]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    return res.json({ success: true, message: 'Setting deleted successfully' });
  } catch (error) {
    return handleError(error, req, res);
  }
}
