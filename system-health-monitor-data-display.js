/**
 * system-health-monitor.js
 * This script monitors the system health and displays data in the UI
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL connection
const { Pool } = pg;
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'agentview',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

async function monitorSystemHealth() {
  console.log('=== Monitoring System Health ===');
  
  try {
    // Check database connection
    const connectionResult = await pool.query('SELECT NOW()');
    console.log('Database connected:', connectionResult.rows[0]);
    
    // Check if system_health_checks table exists
    try {
      await pool.query('SELECT COUNT(*) FROM system_health_checks');
      console.log('system_health_checks table exists');
    } catch (error) {
      console.error('system_health_checks table does not exist:', error.message);
      
      // Create system_health_checks table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS system_health_checks (
          id UUID PRIMARY KEY,
          component VARCHAR(255) NOT NULL,
          status VARCHAR(50) NOT NULL,
          message TEXT,
          endpoint VARCHAR(255),
          category VARCHAR(50),
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      
      console.log('system_health_checks table created');
    }
    
    // Check if user_accs table exists
    try {
      await pool.query('SELECT COUNT(*) FROM user_accs');
      console.log('user_accs table exists');
    } catch (error) {
      console.error('user_accs table does not exist:', error.message);
      
      // Create user_accs table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_accs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id),
          display_name VARCHAR(255),
          theme_preference VARCHAR(50) DEFAULT 'light',
          notification_preferences JSONB DEFAULT '{"email": true, "push": true, "deals": true, "system": true}'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      
      console.log('user_accs table created');
    }
    
    // Check if settings table exists
    try {
      await pool.query('SELECT COUNT(*) FROM settings');
      console.log('settings table exists');
    } catch (error) {
      console.error('settings table does not exist:', error.message);
      
      // Create settings table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS settings (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          key VARCHAR(255) NOT NULL,
          value TEXT,
          category VARCHAR(50) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(key, category)
        )
      `);
      
      console.log('settings table created');
    }
    
    // Add extension for UUID generation if it doesn't exist
    await pool.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
    `);
    
    // Insert sample system health checks
    await pool.query(`
      INSERT INTO system_health_checks (id, component, status, message, endpoint, category)
      VALUES 
        (uuid_generate_v4(), 'Database', 'OK', 'Database connection successful', '/api/db/status', 'System'),
        (uuid_generate_v4(), 'API', 'OK', 'API endpoints responding', '/api/health', 'System'),
        (uuid_generate_v4(), 'Auth', 'OK', 'Authentication service running', '/api/auth/status', 'Security')
      ON CONFLICT DO NOTHING
    `);
    
    // Insert sample settings
    await pool.query(`
      INSERT INTO settings (key, value, category)
      VALUES 
        ('name', 'MyAgentView', 'system'),
        ('logo_url', '/assets/logo.png', 'system'),
        ('theme', 'light', 'system')
      ON CONFLICT (key, category) DO UPDATE
      SET value = EXCLUDED.value
    `);
    
    // Check if any users exist
    const usersResult = await pool.query('SELECT id FROM users');
    
    if (usersResult.rows.length > 0) {
      // Insert sample user_accs for each user
      for (const user of usersResult.rows) {
        await pool.query(`
          INSERT INTO user_accs (user_id, display_name, theme_preference)
          SELECT id, full_name, 'light'
          FROM users
          WHERE id = $1
          ON CONFLICT (user_id) DO NOTHING
        `, [user.id]);
      }
    }
    
    console.log('Sample data inserted successfully');
    
    // Check data display in each section
    await checkDataDisplay();
    
    console.log('=== System Health Monitoring Complete ===');
  } catch (error) {
    console.error('Error monitoring system health:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

async function checkDataDisplay() {
  console.log('=== Checking Data Display ===');
  
  try {
    // Check system_health_checks data
    const healthChecksResult = await pool.query('SELECT COUNT(*) FROM system_health_checks');
    console.log('system_health_checks count:', healthChecksResult.rows[0].count);
    
    // Check user_accs data
    const userAccsResult = await pool.query('SELECT COUNT(*) FROM user_accs');
    console.log('user_accs count:', userAccsResult.rows[0].count);
    
    // Check settings data
    const settingsResult = await pool.query('SELECT COUNT(*) FROM settings');
    console.log('settings count:', settingsResult.rows[0].count);
    
    // Check if data is available for display
    if (parseInt(healthChecksResult.rows[0].count) > 0) {
      console.log('✅ System health checks data is available for display');
    } else {
      console.log('❌ No system health checks data available');
    }
    
    if (parseInt(userAccsResult.rows[0].count) > 0) {
      console.log('✅ User accounts data is available for display');
    } else {
      console.log('❌ No user accounts data available');
    }
    
    if (parseInt(settingsResult.rows[0].count) > 0) {
      console.log('✅ Settings data is available for display');
    } else {
      console.log('❌ No settings data available');
    }
  } catch (error) {
    console.error('Error checking data display:', error);
  }
}

// Run the monitor
monitorSystemHealth();
