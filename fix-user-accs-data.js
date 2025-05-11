/**
 * fix-user-accs-data.js
 * This script fixes the user_accs table and adds sample data
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

async function fixUserAccsData() {
  console.log('=== Fixing User Accs Data ===');
  
  try {
    // Check database connection
    const connectionResult = await pool.query('SELECT NOW()');
    console.log('Database connected:', connectionResult.rows[0]);
    
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
          theme TEXT DEFAULT 'light',
          notification_preferences JSONB DEFAULT '{"email": true, "push": true, "deals": true, "system": true}'::jsonb,
          dashboard_layout JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      
      console.log('user_accs table created');
    }
    
    // Check table structure
    console.log('Checking user_accs table structure...');
    
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user_accs'
      ORDER BY ordinal_position
    `);
    
    console.log('Table structure:');
    tableInfo.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
    });
    
    // Get all users
    const usersResult = await pool.query('SELECT id, full_name FROM users');
    console.log(`Found ${usersResult.rows.length} users`);
    
    // Check if user_accs entries exist for each user
    for (const user of usersResult.rows) {
      const userAccsResult = await pool.query('SELECT * FROM user_accs WHERE user_id = $1', [user.id]);
      
      if (userAccsResult.rows.length === 0) {
        console.log(`Creating user_accs entry for user: ${user.full_name}`);
        
        // Insert user_accs entry
        await pool.query(`
          INSERT INTO user_accs (user_id, theme, notification_preferences)
          VALUES ($1, 'light', '{"email": true, "push": true, "deals": true, "system": true}'::jsonb)
        `, [user.id]);
      } else {
        console.log(`User_accs entry already exists for user: ${user.full_name}`);
      }
    }
    
    // Verify the fix
    console.log('Verifying the fix...');
    
    const userAccsResult = await pool.query('SELECT * FROM user_accs');
    console.log(`User accs count: ${userAccsResult.rows.length}`);
    
    console.log('=== User Accs Data Fixed ===');
  } catch (error) {
    console.error('Error fixing user accs data:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the fix
fixUserAccsData();
