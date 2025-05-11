/**
 * check-table-structure.js
 * 
 * This script checks the structure of the system_health_checks table
 * to understand what columns it has.
 */

import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a PostgreSQL client
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Main function to check table structure
async function checkTableStructure() {
  console.log('Checking table structure...');
  
  try {
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to the database successfully.');
    
    try {
      // Check system_health_checks table structure
      console.log('\nChecking system_health_checks table structure:');
      const healthChecksResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'system_health_checks'
        ORDER BY ordinal_position
      `);
      
      if (healthChecksResult.rows.length === 0) {
        console.log('No columns found for system_health_checks table.');
      } else {
        console.log('system_health_checks columns:');
        healthChecksResult.rows.forEach(row => {
          console.log(`- ${row.column_name} (${row.data_type}, ${row.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
        });
      }
      
      // Check user_accs table structure
      console.log('\nChecking user_accs table structure:');
      const userAccsResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_accs'
        ORDER BY ordinal_position
      `);
      
      if (userAccsResult.rows.length === 0) {
        console.log('No columns found for user_accs table.');
      } else {
        console.log('user_accs columns:');
        userAccsResult.rows.forEach(row => {
          console.log(`- ${row.column_name} (${row.data_type}, ${row.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
        });
      }
      
      // Check settings table structure
      console.log('\nChecking settings table structure:');
      const settingsResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'settings'
        ORDER BY ordinal_position
      `);
      
      if (settingsResult.rows.length === 0) {
        console.log('No columns found for settings table.');
      } else {
        console.log('settings columns:');
        settingsResult.rows.forEach(row => {
          console.log(`- ${row.column_name} (${row.data_type}, ${row.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
        });
      }
    } finally {
      // Release the client
      client.release();
    }
  } catch (error) {
    console.error('Error checking table structure:', error);
  } finally {
    // Close the pool
    await pool.end();
    console.log('\nDatabase connection closed.');
  }
}

// Run the script
checkTableStructure();
