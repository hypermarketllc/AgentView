/**
 * check-postgres-connection.js
 * 
 * A simple script to test the PostgreSQL database connection.
 * This can be used to verify that the database is properly configured
 * and accessible after migrating from Supabase to PostgreSQL.
 */

// Import required modules
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Initialize dotenv
dotenv.config();

const { Pool } = pg;

// Get database connection parameters from environment variables
const host = process.env.POSTGRES_HOST || 'localhost';
const port = parseInt(process.env.POSTGRES_PORT || '5432');
const database = process.env.POSTGRES_DB || 'crm_db';
const user = process.env.POSTGRES_USER || 'crm_user';
const password = process.env.POSTGRES_PASSWORD;

// Create a connection pool
const pool = new Pool({
  host,
  port,
  database,
  user,
  password
});

// Test the connection
async function testConnection() {
  console.log('Testing PostgreSQL connection...');
  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`Database: ${database}`);
  console.log(`User: ${user}`);
  console.log('Password: [HIDDEN]');
  
  try {
    // Test basic connection
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('\n✅ Connection successful!');
    console.log(`Current database time: ${result.rows[0].current_time}`);
    
    // Check if required tables exist
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Available tables:');
    if (tablesResult.rows.length === 0) {
      console.log('No tables found in the database.');
    } else {
      tablesResult.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
    }
    
    // Check user count
    const userCountResult = await pool.query('SELECT COUNT(*) as user_count FROM users');
    console.log(`\n👤 User count: ${userCountResult.rows[0].user_count}`);
    
    // Check if user_accs table exists and has data
    try {
      const userAccsResult = await pool.query('SELECT COUNT(*) as count FROM user_accs');
      console.log(`⚙️ User settings count: ${userAccsResult.rows[0].count}`);
    } catch (error) {
      console.log('⚠️ user_accs table not found or cannot be accessed');
    }
    
    // Check if positions table exists and has data
    try {
      const positionsResult = await pool.query('SELECT COUNT(*) as count FROM positions');
      console.log(`🏢 Positions count: ${positionsResult.rows[0].count}`);
    } catch (error) {
      console.log('⚠️ positions table not found or cannot be accessed');
    }
    
    // Check if deals table exists and has data
    try {
      const dealsResult = await pool.query('SELECT COUNT(*) as count FROM deals');
      console.log(`💼 Deals count: ${dealsResult.rows[0].count}`);
    } catch (error) {
      console.log('⚠️ deals table not found or cannot be accessed');
    }
    
  } catch (error) {
    console.error('\n❌ Connection failed!');
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

// Run the test
testConnection();
