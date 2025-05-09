/**
 * Check Database State
 * 
 * This script checks the state of the PostgreSQL database after migration
 * to ensure that all tables and data have been properly migrated.
 */

import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables
dotenv.config();
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
}

// Set default values if not provided in environment
const POSTGRES_HOST = process.env.POSTGRES_HOST || 'localhost';
const POSTGRES_PORT = process.env.POSTGRES_PORT || '5432';
const POSTGRES_DB = process.env.POSTGRES_DB || 'crm_db';
const POSTGRES_USER = process.env.POSTGRES_USER || 'crm_user';
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD || 'your_strong_password_here';

// Create a connection pool
const { Pool } = pg;
const pool = new Pool({
  host: POSTGRES_HOST,
  port: parseInt(POSTGRES_PORT),
  database: POSTGRES_DB,
  user: POSTGRES_USER,
  password: POSTGRES_PASSWORD
});

// Tables to check
const tables = [
  'users',
  'auth_users',
  'positions',
  'carriers',
  'products',
  'deals',
  'commissions',
  'commission_splits',
  'discord_notifications',
  'telegram_chats'
];

// Check database connection
async function checkConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connection successful!');
    console.log('Current time:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    return false;
  }
}

// Check if tables exist
async function checkTables() {
  console.log('\nChecking tables...');
  
  try {
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    const existingTables = result.rows.map(row => row.table_name);
    
    console.log('Existing tables:');
    existingTables.forEach(table => {
      console.log(`- ${table}`);
    });
    
    console.log('\nChecking required tables:');
    let allTablesExist = true;
    
    for (const table of tables) {
      if (existingTables.includes(table)) {
        console.log(`✓ ${table}`);
      } else {
        console.log(`✗ ${table} (missing)`);
        allTablesExist = false;
      }
    }
    
    return allTablesExist;
  } catch (error) {
    console.error('Error checking tables:', error.message);
    return false;
  }
}

// Check table counts
async function checkTableCounts() {
  console.log('\nChecking table counts...');
  
  try {
    const counts = {};
    
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        counts[table] = parseInt(result.rows[0].count);
        console.log(`${table}: ${counts[table]} rows`);
      } catch (error) {
        console.log(`${table}: Error - ${error.message}`);
      }
    }
    
    return counts;
  } catch (error) {
    console.error('Error checking table counts:', error.message);
    return {};
  }
}

// Check user permissions
async function checkPermissions() {
  console.log('\nChecking user permissions...');
  
  try {
    // Check if the user can create tables
    try {
      await pool.query('CREATE TABLE permission_test (id SERIAL PRIMARY KEY)');
      console.log('✓ Can create tables');
      await pool.query('DROP TABLE permission_test');
    } catch (error) {
      console.log('✗ Cannot create tables:', error.message);
    }
    
    // Check if the user can insert data
    try {
      await pool.query('INSERT INTO users (id) VALUES (\'00000000-0000-0000-0000-000000000000\') ON CONFLICT (id) DO NOTHING');
      console.log('✓ Can insert data');
    } catch (error) {
      console.log('✗ Cannot insert data:', error.message);
    }
    
    // Check if the user can update data
    try {
      await pool.query('UPDATE users SET full_name = full_name WHERE id = \'00000000-0000-0000-0000-000000000000\'');
      console.log('✓ Can update data');
    } catch (error) {
      console.log('✗ Cannot update data:', error.message);
    }
    
    // Check if the user can delete data
    try {
      await pool.query('DELETE FROM users WHERE id = \'00000000-0000-0000-0000-000000000000\'');
      console.log('✓ Can delete data');
    } catch (error) {
      console.log('✗ Cannot delete data:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('Error checking permissions:', error.message);
    return false;
  }
}

// Check foreign key constraints
async function checkForeignKeys() {
  console.log('\nChecking foreign key constraints...');
  
  try {
    const result = await pool.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name, kcu.column_name
    `);
    
    if (result.rows.length === 0) {
      console.log('No foreign key constraints found!');
      return false;
    }
    
    console.log('Foreign key constraints:');
    result.rows.forEach(row => {
      console.log(`- ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`);
    });
    
    return true;
  } catch (error) {
    console.error('Error checking foreign keys:', error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('Checking PostgreSQL database state...');
  console.log('Host:', POSTGRES_HOST);
  console.log('Port:', POSTGRES_PORT);
  console.log('Database:', POSTGRES_DB);
  console.log('User:', POSTGRES_USER);
  
  try {
    // Check connection
    const connectionOk = await checkConnection();
    
    if (!connectionOk) {
      console.error('Database connection failed. Please check your connection settings.');
      process.exit(1);
    }
    
    // Check tables
    const tablesOk = await checkTables();
    
    if (!tablesOk) {
      console.warn('Some required tables are missing. You may need to run the migration scripts.');
    }
    
    // Check table counts
    const counts = await checkTableCounts();
    
    // Check permissions
    await checkPermissions();
    
    // Check foreign keys
    await checkForeignKeys();
    
    console.log('\nDatabase check completed!');
    
    // Provide recommendations
    console.log('\nRecommendations:');
    
    if (!tablesOk) {
      console.log('- Run the migration scripts to create missing tables');
      console.log('  ./run-postgres-migration.sh');
    }
    
    if (counts.users === 0) {
      console.log('- Import user data from Supabase');
      console.log('  psql -h localhost -U crm_user -d crm_db -f supabase-export/insert_data.sql');
    }
    
    console.log('- Ensure environment variables are set correctly in .env or .env.local');
    console.log('- Set USE_POSTGRES=true and VITE_USE_POSTGRES=true in your environment');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the main function
main();
