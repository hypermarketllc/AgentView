/**
 * User-related operations for position fix
 * Handles updating users with appropriate positions
 */

import { logInfo, logSuccess, logError } from './utils/logger.mjs';

/**
 * Update users with appropriate positions based on their role
 * @param {import('pg').Pool} pool - PostgreSQL connection pool
 * @returns {Promise<void>}
 */
async function updateUsersWithPositions(pool) {
  const client = await pool.connect();
  
  try {
    logInfo('Updating users with appropriate positions...');
    
    // Get all positions
    const positionsResult = await client.query(`
      SELECT id, name, level FROM positions ORDER BY level
    `);
    
    if (positionsResult.rows.length === 0) {
      throw new Error('No positions found');
    }
    
    const positions = positionsResult.rows;
    
    // Find position IDs for different roles
    const agentPosition = positions.find(p => p.name === 'Agent');
    const adminPosition = positions.find(p => p.name === 'Admin');
    
    if (!agentPosition || !adminPosition) {
      throw new Error('Required positions not found');
    }
    
    // Update admin users
    const updateAdminResult = await client.query(`
      UPDATE users
      SET position_id = $1
      WHERE role = 'admin' AND (position_id IS NULL OR position_id != $1)
      RETURNING id, email, role
    `, [adminPosition.id]);
    
    logSuccess(`Updated ${updateAdminResult.rows.length} admin users with Admin position`);
    
    // Log the updated admin users
    if (updateAdminResult.rows.length > 0) {
      logInfo('Updated admin users:');
      
      updateAdminResult.rows.forEach(user => {
        console.log(`- ${user.id}: ${user.email} (${user.role})`);
      });
    }
    
    // Update agent users
    const updateAgentResult = await client.query(`
      UPDATE users
      SET position_id = $1
      WHERE role = 'agent' AND (position_id IS NULL OR position_id != $1)
      RETURNING id, email, role
    `, [agentPosition.id]);
    
    logSuccess(`Updated ${updateAgentResult.rows.length} agent users with Agent position`);
    
    // Log the updated agent users
    if (updateAgentResult.rows.length > 0) {
      logInfo('Updated agent users:');
      
      updateAgentResult.rows.forEach(user => {
        console.log(`- ${user.id}: ${user.email} (${user.role})`);
      });
    }
    
    // Update any remaining users without a position
    const updateRemainingResult = await client.query(`
      UPDATE users
      SET position_id = $1
      WHERE position_id IS NULL
      RETURNING id, email, role
    `, [agentPosition.id]);
    
    logSuccess(`Updated ${updateRemainingResult.rows.length} remaining users with default position`);
    
    // Log the updated remaining users
    if (updateRemainingResult.rows.length > 0) {
      logInfo('Updated remaining users:');
      
      updateRemainingResult.rows.forEach(user => {
        console.log(`- ${user.id}: ${user.email} (${user.role})`);
      });
    }
  } catch (error) {
    logError(`Error updating users with positions: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get user with position data
 * @param {import('pg').Pool} pool - PostgreSQL connection pool
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User object with position data
 */
async function getUserWithPosition(pool, userId) {
  const client = await pool.connect();
  
  try {
    logInfo(`Fetching user ${userId} with position data...`);
    
    const result = await client.query(`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.position_id,
        p.name AS position_name,
        p.level AS position_level,
        p.permissions,
        p.is_admin,
        p.can_manage_users,
        p.can_manage_deals,
        p.can_view_analytics,
        p.can_manage_settings
      FROM 
        users u
      LEFT JOIN 
        positions p ON u.position_id = p.id
      WHERE
        u.id = $1
    `, [userId]);
    
    if (result.rows.length === 0) {
      logError(`User ${userId} not found`);
      return null;
    }
    
    logSuccess(`Retrieved user ${userId} with position data`);
    
    return result.rows[0];
  } catch (error) {
    logError(`Error fetching user with position: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get all users with position data
 * @param {import('pg').Pool} pool - PostgreSQL connection pool
 * @returns {Promise<Array>} Array of user objects with position data
 */
async function getAllUsersWithPositions(pool) {
  const client = await pool.connect();
  
  try {
    logInfo('Fetching all users with position data...');
    
    const result = await client.query(`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.position_id,
        p.name AS position_name,
        p.level AS position_level,
        p.permissions
      FROM 
        users u
      LEFT JOIN 
        positions p ON u.position_id = p.id
      ORDER BY
        u.id
    `);
    
    logSuccess(`Retrieved ${result.rows.length} users with position data`);
    
    return result.rows;
  } catch (error) {
    logError(`Error fetching users with positions: ${error.message}`);
    throw error;
  } finally {
    client.release();
  }
}

export {
  updateUsersWithPositions,
  getUserWithPosition,
  getAllUsersWithPositions
};
