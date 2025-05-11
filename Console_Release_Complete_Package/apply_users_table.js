/**
 * Script to apply the users table to the PostgreSQL database
 * This creates the users table and inserts default users if they don't exist
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

// PostgreSQL connection configuration
const pgConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crm_db',
  user: process.env.POSTGRES_USER || 'crm_user',
  password: process.env.POSTGRES_PASSWORD || 'your_strong_password_here'
};

console.log('Connecting to PostgreSQL database...');
console.log(`Host: ${pgConfig.host}`);
console.log(`Port: ${pgConfig.port}`);
console.log(`Database: ${pgConfig.database}`);
console.log(`User: ${pgConfig.user}`);

// Create a new PostgreSQL client
const pool = new Pool(pgConfig);

async function applyUsersTable() {
  const client = await pool.connect();
  
  try {
    console.log('Connected to PostgreSQL database');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'sql', 'create_users_table.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('Applying users table SQL script...');
    
    // Execute the SQL script
    await client.query(sqlScript);
    
    console.log('Users table created successfully');
    
    // Verify the users table exists and has the default users
    const result = await client.query('SELECT COUNT(*) FROM users');
    console.log(`Number of users in the database: ${result.rows[0].count}`);
    
    // List all users
    const users = await client.query('SELECT id, email, role, full_name FROM users');
    console.log('Users in the database:');
    users.rows.forEach(user => {
      console.log(`- ${user.id}: ${user.email} (${user.role}) - ${user.full_name}`);
    });
    
    console.log('Users table setup completed successfully');
  } catch (error) {
    console.error('Error applying users table:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Execute the function
applyUsersTable()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
