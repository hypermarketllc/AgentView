 ..//**
 * apply_system_errors_table_docker.js
 * Script to apply the system_errors table to the Docker database
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Create a connection pool for Docker environment
const pool = new Pool({
  host: 'db',
  port: 5432,
  database: 'crm_db',
  user: 'crm_user',
  password: 'your_strong_password_here'
});

// Path to SQL file
const sqlFilePath = path.join(__dirname, 'sql', 'create_system_errors_table.sql');

// Main function
async function applySystemErrorsTable() {
  let client;
  
  try {
    console.log('Connecting to database...');
    client = await pool.connect();
    
    console.log('Reading SQL file...');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('Executing SQL...');
    await client.query(sqlContent);
    
    console.log('System errors table created successfully!');
    
    // Verify table exists
    const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_errors'
      );
    `);
    
    if (result.rows[0].exists) {
      console.log('Verification successful: system_errors table exists');
    } else {
      console.error('Verification failed: system_errors table does not exist');
    }
    
  } catch (error) {
    console.error('Error applying system_errors table:', error);
  } finally {
    if (client) {
      client.release();
    }
    
    // Close pool
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run the function
applySystemErrorsTable();
