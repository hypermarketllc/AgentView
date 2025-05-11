/**
 * apply-missing-tables-complete.js
 * 
 * This script applies the SQL in create-missing-tables-complete.sql to create
 * all the missing tables needed for the application.
 */

import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a PostgreSQL client
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Path to the SQL file
const sqlFilePath = './create-missing-tables-complete.sql';

// Main function to apply the SQL
async function applyMissingTables() {
  console.log('Starting to apply missing tables...');
  
  try {
    // Read the SQL file
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('SQL file read successfully.');
    
    // Connect to the database
    const client = await pool.connect();
    console.log('Connected to the database successfully.');
    
    try {
      // Start a transaction
      await client.query('BEGIN');
      
      // Execute the SQL
      await client.query(sql);
      
      // Commit the transaction
      await client.query('COMMIT');
      
      console.log('Missing tables created successfully.');
      
      // Verify the tables were created
      await verifyTables(client);
    } catch (error) {
      // Rollback the transaction on error
      await client.query('ROLLBACK');
      console.error('Error applying SQL:', error);
    } finally {
      // Release the client
      client.release();
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the pool
    await pool.end();
    console.log('Database connection closed.');
  }
}

// Function to verify the tables were created
async function verifyTables(client) {
  console.log('\nVerifying tables...');
  
  const tables = [
    'system_health_checks',
    'settings',
    'user_accs'
  ];
  
  for (const table of tables) {
    try {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [table]);
      
      const exists = result.rows[0].exists;
      
      if (exists) {
        console.log(`✅ Table '${table}' exists.`);
        
        // Count records in the table
        const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
        const count = parseInt(countResult.rows[0].count);
        console.log(`   - Table '${table}' has ${count} records.`);
      } else {
        console.error(`❌ Table '${table}' does not exist!`);
      }
    } catch (error) {
      console.error(`Error verifying table '${table}':`, error);
    }
  }
}

// Run the script
applyMissingTables();
