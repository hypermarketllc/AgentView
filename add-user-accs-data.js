/**
 * add-user-accs-data.js
 * 
 * This script adds sample data to the user_accs table.
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// Helper function to log success
function logSuccess(message) {
  console.log(chalk.green('✅ ' + message));
}

// Helper function to log error
function logError(message) {
  console.error(chalk.red('❌ ' + message));
}

// Helper function to log info
function logInfo(message) {
  console.log(chalk.blue('ℹ️ ' + message));
}

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL || 'postgres://postgres:postgres@localhost:5432/postgres',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Add sample data to the user_accs table
async function addUserAccsData() {
  logInfo('Adding sample data to user_accs table...');
  
  try {
    // Check if the table exists
    const tableExistsResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'user_accs'
      );
    `);
    
    const tableExists = tableExistsResult.rows[0].exists;
    
    if (!tableExists) {
      logError('user_accs table does not exist');
      return false;
    }
    
    // Check if the table already has data
    const hasDataResult = await pool.query(`
      SELECT COUNT(*) FROM user_accs;
    `);
    
    const rowCount = parseInt(hasDataResult.rows[0].count);
    
    if (rowCount > 0) {
      logInfo(`user_accs table already has ${rowCount} rows of data`);
      return true;
    }
    
    // Add sample data
    const sampleData = [
      {
        id: uuidv4(),
        user_id: uuidv4(),
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        preferences: { theme: 'dark', notifications: true },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        user_id: uuidv4(),
        email: 'user1@example.com',
        name: 'Regular User',
        role: 'user',
        preferences: { theme: 'light', notifications: true },
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        user_id: uuidv4(),
        email: 'manager@example.com',
        name: 'Manager User',
        role: 'manager',
        preferences: { theme: 'system', notifications: false },
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
    
    // Get the column names from the table
    const columnsResult = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'user_accs';
    `);
    
    const columns = columnsResult.rows.map(row => row.column_name);
    
    // Insert each sample data row
    for (const data of sampleData) {
      // Filter the data object to only include columns that exist in the table
      const filteredData = {};
      for (const key in data) {
        if (columns.includes(key)) {
          filteredData[key] = data[key];
        }
      }
      
      // Build the query
      const keys = Object.keys(filteredData);
      const values = Object.values(filteredData);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      
      const query = `
        INSERT INTO user_accs (${keys.join(', ')})
        VALUES (${placeholders})
      `;
      
      await pool.query(query, values);
    }
    
    logSuccess(`Added ${sampleData.length} rows of sample data to user_accs table`);
    return true;
  } catch (error) {
    logError(`Error adding sample data to user_accs table: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log(chalk.bold('=== Adding User Accounts Data ==='));
  
  try {
    // Add sample data to the user_accs table
    await addUserAccsData();
    
    console.log(chalk.bold('\n=== User Accounts Data Addition Complete ==='));
    logInfo('Sample data has been added to the user_accs table.');
    logInfo('To verify, run the system health monitor again:');
    logInfo('node run-system-health-monitor-data-display.js');
  } catch (error) {
    logError(`Fatal error: ${error.message}`);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
