/**
 * apply-missing-tables.js
 * 
 * This script applies the SQL in create-missing-tables.sql to create
 * the necessary tables for system health monitoring and error tracking.
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
  database: process.env.POSTGRES_DB || 'crm_db',
  user: process.env.POSTGRES_USER || 'crm_user',
  password: process.env.POSTGRES_PASSWORD || 'your_strong_password_here'
});

async function applyMissingTables() {
  try {
    console.log('Connecting to database...');
    
    // Test connection
    const res = await pool.query('SELECT NOW()');
    console.log('Database connected:', res.rows[0].now);
    
    // Read SQL file
    const sqlPath = path.join(__dirname, 'create-missing-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Applying missing tables...');
    
    // Execute SQL
    await pool.query(sql);
    
    console.log('Missing tables applied successfully!');
    
    // Verify tables were created
    const tables = ['system_health_checks', 'system_errors', 'user_accs', 'settings'];
    
    for (const table of tables) {
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [table]);
      
      if (tableCheck.rows[0].exists) {
        console.log(`✅ Table '${table}' exists`);
      } else {
        console.error(`❌ Table '${table}' was not created`);
      }
    }
    
    // Check if default settings were inserted
    const settingsCount = await pool.query('SELECT COUNT(*) FROM settings');
    console.log(`Settings table has ${settingsCount.rows[0].count} entries`);
    
  } catch (error) {
    console.error('Error applying missing tables:', error);
  } finally {
    // Close pool
    await pool.end();
  }
}

// Run the function
applyMissingTables();
