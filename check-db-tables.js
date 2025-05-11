/**
 * check-db-tables.js
 * This script checks the database structure and creates missing tables if needed.
 */

import pg from 'pg';
import './fix-database-connection.js';
import { envUtils } from './robust-patch.js';

// Get database configuration
const dbConfig = envUtils.getDatabaseConfig();
console.log('Database configuration:', dbConfig);

// Create a new pool
const pool = new pg.Pool(dbConfig);

async function checkTables() {
  try {
    console.log('Connecting to database...');
    await pool.query('SELECT NOW()');
    console.log('Connected to database successfully.');
    
    // Check if tables exist
    console.log('\nChecking tables...');
    
    // Check users table
    try {
      const usersResult = await pool.query('SELECT COUNT(*) FROM users');
      console.log(`- users table exists with ${usersResult.rows[0].count} rows`);
    } catch (error) {
      console.error('- users table does not exist or is not accessible:', error.message);
    }
    
    // Check positions table
    try {
      const positionsResult = await pool.query('SELECT COUNT(*) FROM positions');
      console.log(`- positions table exists with ${positionsResult.rows[0].count} rows`);
    } catch (error) {
      console.error('- positions table does not exist or is not accessible:', error.message);
    }
    
    // Check system_health_checks table
    try {
      const healthChecksResult = await pool.query('SELECT COUNT(*) FROM system_health_checks');
      console.log(`- system_health_checks table exists with ${healthChecksResult.rows[0].count} rows`);
    } catch (error) {
      console.error('- system_health_checks table does not exist or is not accessible:', error.message);
      
      // Create system_health_checks table
      console.log('  Creating system_health_checks table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS system_health_checks (
          id SERIAL PRIMARY KEY,
          component VARCHAR(255) NOT NULL,
          status VARCHAR(50) NOT NULL,
          message TEXT,
          last_checked TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      console.log('  system_health_checks table created successfully.');
    }
    
    // Check user_accs table
    try {
      const userAccsResult = await pool.query('SELECT COUNT(*) FROM user_accs');
      console.log(`- user_accs table exists with ${userAccsResult.rows[0].count} rows`);
    } catch (error) {
      console.error('- user_accs table does not exist or is not accessible:', error.message);
      
      // Create user_accs table
      console.log('  Creating user_accs table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_accs (
          id SERIAL PRIMARY KEY,
          user_id UUID REFERENCES users(id),
          account_type VARCHAR(50) NOT NULL,
          account_status VARCHAR(50) NOT NULL,
          settings JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      console.log('  user_accs table created successfully.');
    }
    
    // Check settings table
    try {
      const settingsResult = await pool.query('SELECT COUNT(*) FROM settings');
      console.log(`- settings table exists with ${settingsResult.rows[0].count} rows`);
    } catch (error) {
      console.error('- settings table does not exist or is not accessible:', error.message);
      
      // Create settings table
      console.log('  Creating settings table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS settings (
          key VARCHAR(255) PRIMARY KEY,
          value JSONB NOT NULL,
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      console.log('  settings table created successfully.');
    }
    
    console.log('\nDatabase check completed.');
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await pool.end();
  }
}

// Run the check
checkTables();
