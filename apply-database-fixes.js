/**
 * apply-database-fixes.js
 * 
 * This script applies fixes to the database by:
 * 1. Creating the missing user_accs table
 * 2. Adding sample data to empty tables
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection configuration
const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'agentview',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
};

// Create a connection pool
const pool = new pg.Pool(dbConfig);

async function applyDatabaseFixes() {
  console.log('Applying database fixes...');
  console.log(`Host: ${dbConfig.host}`);
  console.log(`Port: ${dbConfig.port}`);
  console.log(`Database: ${dbConfig.database}`);
  console.log(`User: ${dbConfig.user}`);
  console.log();

  try {
    // Step 1: Create the missing user_accs table
    console.log('1. Creating user_accs table...');
    const userAccsTableSql = fs.readFileSync(path.join(__dirname, 'create-user-accs-table.sql'), 'utf8');
    await pool.query(userAccsTableSql);
    console.log('✅ user_accs table created successfully');

    // Step 2: Add sample data to empty tables
    console.log('\n2. Adding sample data to empty tables...');
    const sampleDataSql = fs.readFileSync(path.join(__dirname, 'add-sample-data.sql'), 'utf8');
    await pool.query(sampleDataSql);
    console.log('✅ Sample data added successfully');

    // Step 3: Verify the tables now have data
    console.log('\n3. Verifying table data...');
    const tables = ['users', 'user_accs', 'carriers', 'products', 'positions', 'deals'];
    
    for (const table of tables) {
      const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      const count = parseInt(result.rows[0].count);
      console.log(`- ${table}: ${count} rows`);
      
      if (count === 0) {
        console.log(`  ⚠️ Warning: ${table} still has no data`);
      }
    }

    console.log('\n✅ Database fixes applied successfully');
  } catch (error) {
    console.error('\n❌ Failed to apply database fixes!');
    console.error('Error details:', error.message);
  } finally {
    // Close the connection pool
    await pool.end();
    console.log('\nConnection pool closed.');
  }
}

// Run the function
applyDatabaseFixes();
