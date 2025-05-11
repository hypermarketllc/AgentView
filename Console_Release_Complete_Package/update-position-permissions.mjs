/**
 * Script to update position permissions in the database
 * This script ensures all positions have appropriate permissions
 */

import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Database connection configuration
const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crm_db',
  user: process.env.POSTGRES_USER || 'crm_user',
  password: process.env.POSTGRES_PASSWORD || 'your_strong_password_here'
};

console.log('[Position Permissions Update] Starting...');
console.log(`[Position Permissions Update] Connecting to PostgreSQL database at ${dbConfig.host}:${dbConfig.port}`);

// Define permissions for different position types
const basicPermissions = {
  dashboard: { view: true },
  "post-deal": { view: true, edit: true, create: true },
  book: { view: true, edit: true },
  settings: { view: true, edit: true }
};

const adminPermissions = {
  dashboard: { view: true, edit: true, create: true, delete: true },
  "post-deal": { view: true, edit: true, create: true, delete: true },
  book: { view: true, edit: true, create: true, delete: true },
  agents: { view: true, edit: true, create: true, delete: true },
  configuration: { view: true, edit: true, create: true, delete: true },
  monitoring: { view: true, edit: true, create: true, delete: true },
  settings: { view: true, edit: true, create: true, delete: true },
  analytics: { view: true, edit: true, create: true, delete: true },
  users: { view: true, edit: true, create: true, delete: true }
};

// Function to update position permissions
async function updatePositionPermissions() {
  const client = new pg.Client(dbConfig);
  
  try {
    await client.connect();
    console.log('[Position Permissions Update] Connected to PostgreSQL database');
    
    // Check if positions table exists
    const tableCheckResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'positions'
      );
    `);
    
    if (!tableCheckResult.rows[0].exists) {
      console.error('[Position Permissions Update] Positions table does not exist');
      return;
    }
    
    // Get all positions
    const positionsResult = await client.query('SELECT * FROM positions');
    console.log(`[Position Permissions Update] Found ${positionsResult.rows.length} positions`);
    
    // Update each position with appropriate permissions
    for (const position of positionsResult.rows) {
      const permissions = position.is_admin ? adminPermissions : basicPermissions;
      
      console.log(`[Position Permissions Update] Updating position: ${position.name} (ID: ${position.id})`);
      
      await client.query(
        'UPDATE positions SET permissions = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [JSON.stringify(permissions), position.id]
      );
      
      // If this is the admin position, ensure is_admin flag is set
      if (position.name === 'Admin' || position.level >= 6) {
        await client.query(
          'UPDATE positions SET is_admin = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
          [position.id]
        );
      }
    }
    
    console.log('[Position Permissions Update] Successfully updated all position permissions');
    
    // Update specific user permissions for admin@americancoveragecenter.com
    const adminUserResult = await client.query(
      'SELECT * FROM users WHERE email = $1',
      ['admin@americancoveragecenter.com']
    );
    
    if (adminUserResult.rows.length > 0) {
      const adminUser = adminUserResult.rows[0];
      console.log(`[Position Permissions Update] Found admin user: ${adminUser.email} (ID: ${adminUser.id})`);
      
      // Ensure admin user has position_id 6 (Admin)
      await client.query(
        'UPDATE users SET position_id = 6, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [adminUser.id]
      );
      
      console.log('[Position Permissions Update] Successfully updated admin user position');
    } else {
      console.log('[Position Permissions Update] Admin user not found');
    }
    
  } catch (error) {
    console.error('[Position Permissions Update] Error:', error);
  } finally {
    await client.end();
    console.log('[Position Permissions Update] Database connection closed');
  }
}

// Run the update function
updatePositionPermissions().then(() => {
  console.log('[Position Permissions Update] Completed');
}).catch(error => {
  console.error('[Position Permissions Update] Fatal error:', error);
  process.exit(1);
});
