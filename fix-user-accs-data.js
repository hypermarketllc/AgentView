/**
 * fix-user-accs-data.js
 * 
 * This script adds sample data to the user_accs table after checking its structure.
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import chalk from 'chalk';

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

// Get the table structure
async function getTableStructure(tableName) {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = $1
      ORDER BY ordinal_position;
    `, [tableName]);
    
    return result.rows;
  } catch (error) {
    logError(`Error getting table structure: ${error.message}`);
    return [];
  }
}

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
    
    // Get the table structure
    const tableStructure = await getTableStructure('user_accs');
    logInfo(`Table structure: ${JSON.stringify(tableStructure, null, 2)}`);
    
    // Create a map of column names to data types
    const columnTypes = {};
    tableStructure.forEach(column => {
      columnTypes[column.column_name] = column.data_type;
    });
    
    // Prepare sample data based on the table structure
    const sampleData = [];
    
    // Sample 1: Admin user
    const adminUser = {};
    if (columnTypes.id) {
      if (columnTypes.id.includes('int')) {
        adminUser.id = 1;
      } else {
        adminUser.id = '00000000-0000-0000-0000-000000000001';
      }
    }
    
    if (columnTypes.user_id) {
      if (columnTypes.user_id.includes('int')) {
        adminUser.user_id = 1001;
      } else {
        adminUser.user_id = '00000000-0000-0000-0000-000000000011';
      }
    }
    
    if (columnTypes.email) adminUser.email = 'admin@example.com';
    if (columnTypes.name) adminUser.name = 'Admin User';
    if (columnTypes.role) adminUser.role = 'admin';
    if (columnTypes.preferences) adminUser.preferences = JSON.stringify({ theme: 'dark', notifications: true });
    if (columnTypes.created_at) adminUser.created_at = new Date();
    if (columnTypes.updated_at) adminUser.updated_at = new Date();
    
    sampleData.push(adminUser);
    
    // Sample 2: Regular user
    const regularUser = {};
    if (columnTypes.id) {
      if (columnTypes.id.includes('int')) {
        regularUser.id = 2;
      } else {
        regularUser.id = '00000000-0000-0000-0000-000000000002';
      }
    }
    
    if (columnTypes.user_id) {
      if (columnTypes.user_id.includes('int')) {
        regularUser.user_id = 1002;
      } else {
        regularUser.user_id = '00000000-0000-0000-0000-000000000022';
      }
    }
    
    if (columnTypes.email) regularUser.email = 'user@example.com';
    if (columnTypes.name) regularUser.name = 'Regular User';
    if (columnTypes.role) regularUser.role = 'user';
    if (columnTypes.preferences) regularUser.preferences = JSON.stringify({ theme: 'light', notifications: true });
    if (columnTypes.created_at) regularUser.created_at = new Date();
    if (columnTypes.updated_at) regularUser.updated_at = new Date();
    
    sampleData.push(regularUser);
    
    // Sample 3: Manager user
    const managerUser = {};
    if (columnTypes.id) {
      if (columnTypes.id.includes('int')) {
        managerUser.id = 3;
      } else {
        managerUser.id = '00000000-0000-0000-0000-000000000003';
      }
    }
    
    if (columnTypes.user_id) {
      if (columnTypes.user_id.includes('int')) {
        managerUser.user_id = 1003;
      } else {
        managerUser.user_id = '00000000-0000-0000-0000-000000000033';
      }
    }
    
    if (columnTypes.email) managerUser.email = 'manager@example.com';
    if (columnTypes.name) managerUser.name = 'Manager User';
    if (columnTypes.role) managerUser.role = 'manager';
    if (columnTypes.preferences) managerUser.preferences = JSON.stringify({ theme: 'system', notifications: false });
    if (columnTypes.created_at) managerUser.created_at = new Date();
    if (columnTypes.updated_at) managerUser.updated_at = new Date();
    
    sampleData.push(managerUser);
    
    // Insert each sample data row
    for (const data of sampleData) {
      // Build the query
      const keys = Object.keys(data);
      const values = Object.values(data);
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
