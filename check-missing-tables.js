/**
 * check-missing-tables.js
 * 
 * This script checks if the required tables exist in the database.
 * It verifies the existence of:
 * - system_health_checks
 * - user_accs
 * - settings
 */

import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.postgres' });
dotenv.config(); // Also load .env as fallback

// Database connection configuration
const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'postgres',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false
};

console.log('Connecting to PostgreSQL database...');
console.log(`Host: ${dbConfig.host}`);
console.log(`Port: ${dbConfig.port}`);
console.log(`Database: ${dbConfig.database}`);
console.log(`User: ${dbConfig.user}`);

// Create a new PostgreSQL client
const client = new pg.Client(dbConfig);

async function checkTables() {
  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Tables to check
    const tables = [
      'system_health_checks',
      'user_accs',
      'settings',
      'users' // Check users table as well for reference
    ];

    // Check each table
    for (const table of tables) {
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [table]);
      
      const exists = result.rows[0].exists;
      console.log(`Table ${table} exists: ${exists}`);
      
      // If the table exists, get some additional information
      if (exists) {
        // Get column information
        const columnsResult = await client.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position
        `, [table]);
        
        console.log(`Columns for ${table}:`);
        columnsResult.rows.forEach(column => {
          console.log(`  - ${column.column_name} (${column.data_type}, ${column.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
        });
        
        // Get row count
        const countResult = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`Row count for ${table}: ${countResult.rows[0].count}`);
        
        console.log('---');
      }
    }

    // Check if user_accs has foreign key to users
    const fkResult = await client.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'user_accs'
        AND ccu.table_name = 'users'
      )
    `);
    
    console.log(`user_accs has foreign key to users: ${fkResult.rows[0].exists}`);

  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    // Close the database connection
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the function
checkTables();
