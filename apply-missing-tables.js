/**
 * apply-missing-tables.js
 * 
 * This script applies the SQL to create the missing tables.
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a PostgreSQL client
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Apply the SQL to create the missing tables
 */
async function applyMissingTables() {
  console.log('Applying SQL to create missing tables...');
  
  try {
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'create-missing-tables.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Connect to the database
    const client = await pool.connect();
    
    try {
      // Execute the SQL
      await client.query(sql);
      
      console.log('Missing tables created successfully.');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error applying SQL to create missing tables:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the function
applyMissingTables();
