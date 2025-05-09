/**
 * apply-required-tables.js
 * 
 * A script to create all the required tables in the PostgreSQL database.
 * This will fix the issues with the account settings, carriers, positions, and agents sections.
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

async function applyRequiredTables() {
  console.log('Creating required tables in PostgreSQL database...');
  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`Database: ${database}`);
  console.log(`User: ${user}`);
  
  try {
    // Read the SQL file
    const sql = fs.readFileSync('./create-required-tables.sql', 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('\n✅ Required tables created successfully!');
    
    // Verify the tables were created
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    const existingTables = tablesResult.rows.map(row => row.table_name);
    
    console.log('\n📋 Available tables:');
    if (existingTables.length === 0) {
      console.log('No tables found in the database.');
    } else {
      existingTables.forEach(table => {
        console.log(`- ${table}`);
      });
    }
    
    // Check if tables have data
    console.log('\n📊 Table data counts:');
    const requiredTables = ['users', 'user_accs', 'carriers', 'products', 'positions', 'deals'];
    
    for (const table of requiredTables) {
      if (existingTables.includes(table)) {
        try {
          const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
          const count = countResult.rows[0].count;
          console.log(`- ${table}: ${count} rows`);
        } catch (error) {
          console.log(`- ${table}: Error counting rows - ${error.message}`);
        }
      } else {
        console.log(`- ${table}: Table does not exist`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Failed to create required tables!');
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
applyRequiredTables();
