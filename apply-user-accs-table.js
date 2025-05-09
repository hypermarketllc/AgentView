/**
 * apply-user-accs-table.js
 * 
 * A script to create the user_accs table in the PostgreSQL database.
 * This table is needed for the account settings functionality.
 */

import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';

// Initialize dotenv
dotenv.config();

// Get database connection parameters from environment variables
const host = process.env.POSTGRES_HOST || 'localhost';
const port = parseInt(process.env.POSTGRES_PORT || '5432');
const database = process.env.POSTGRES_DB || 'crm_db';
const user = process.env.POSTGRES_USER || 'crm_user';
const password = process.env.POSTGRES_PASSWORD;

// Create a connection pool
const pool = new pg.Pool({
  host,
  port,
  database,
  user,
  password
});

async function applyUserAccsTable() {
  console.log('Creating user_accs table in PostgreSQL database...');
  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`Database: ${database}`);
  console.log(`User: ${user}`);
  
  try {
    // Read the SQL file
    const sql = fs.readFileSync('./create-user-accs-table.sql', 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('\n✅ user_accs table created successfully!');
    
    // Verify the table was created
    const tableCheckResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_accs'
      ) as exists
    `);
    
    if (tableCheckResult.rows[0].exists) {
      console.log('✅ Verified user_accs table exists in the database.');
      
      // Check if data was inserted
      const countResult = await pool.query('SELECT COUNT(*) as count FROM user_accs');
      console.log(`✅ user_accs table contains ${countResult.rows[0].count} rows.`);
    } else {
      console.log('❌ Failed to verify user_accs table exists in the database.');
    }
    
  } catch (error) {
    console.error('\n❌ Failed to create user_accs table!');
    console.error('Error details:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.error('\nPossible solution: Check your POSTGRES_PASSWORD environment variable.');
    } else if (error.message.includes('does not exist')) {
      console.error('\nPossible solution: Create the database or check POSTGRES_DB environment variable.');
    } else if (error.message.includes('connect ECONNREFUSED')) {
      console.error('\nPossible solution: Make sure PostgreSQL server is running and accessible.');
    }
  } finally {
    // Close the pool
    await pool.end();
    console.log('\nConnection pool closed.');
  }
}

// Run the script
applyUserAccsTable();
