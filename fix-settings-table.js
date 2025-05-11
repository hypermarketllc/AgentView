/**
 * fix-settings-table.js
 * This script fixes the settings table JSON format issue
 */

import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// PostgreSQL connection
const { Pool } = pg;
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'agentview',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

async function fixSettingsTable() {
  console.log('=== Fixing Settings Table ===');
  
  try {
    // Check database connection
    const connectionResult = await pool.query('SELECT NOW()');
    console.log('Database connected:', connectionResult.rows[0]);
    
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
    
    // Check table structure
    console.log('Checking settings table structure...');
    
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'settings'
      ORDER BY ordinal_position
    `);
    
    console.log('Table structure:');
    tableInfo.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
    });
    
    // Clear existing settings
    console.log('Clearing existing settings...');
    await pool.query('DELETE FROM settings');
    
    // Insert sample settings with proper JSON format
    console.log('Inserting sample settings...');
    
    await pool.query(`
      INSERT INTO settings (key, value, category)
      VALUES 
        ('name', '"MyAgentView"', 'system'),
        ('logo_url', '"/assets/logo.png"', 'system'),
        ('theme', '"light"', 'system'),
        ('api_endpoints', '{"auth": "/api/auth", "deals": "/api/deals", "users": "/api/users"}', 'system'),
        ('notification_settings', '{"email": true, "push": true, "sms": false}', 'system')
    `);
    
    console.log('Sample settings inserted successfully');
    
    // Verify the fix
    console.log('Verifying the fix...');
    
    const settingsResult = await pool.query('SELECT * FROM settings');
    console.log(`Settings count: ${settingsResult.rows.length}`);
    
    console.log('=== Settings Table Fixed ===');
  } catch (error) {
    console.error('Error fixing settings table:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the fix
fixSettingsTable();
