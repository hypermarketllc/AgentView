import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a connection pool
const { Pool } = pg;
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'crm_db',
  user: process.env.POSTGRES_USER || 'crm_user',
  password: process.env.POSTGRES_PASSWORD || 'your_strong_password_here'
});

async function runSqlScript() {
  try {
    console.log('Connecting to database...');
    
    // Test database connection
    const testResult = await pool.query('SELECT NOW()');
    console.log('Database connected:', testResult.rows[0]);
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'fix-admin-permissions.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the entire script at once
    console.log('Executing SQL script...');
    const result = await pool.query(sqlScript);
    console.log('SQL script executed successfully');
    
    // Query to check if users have the correct positions
    const usersCheck = await pool.query(`
      SELECT u.id, u.email, u.full_name, p.name as position_name, p.level as position_level
      FROM users u
      JOIN positions p ON u.position_id = p.id
      WHERE u.email IN ('admin@example.com', 'admin@americancoveragecenter.com')
      ORDER BY p.level DESC
    `);
    
    if (usersCheck.rows.length > 0) {
      console.log('User details:');
      usersCheck.rows.forEach(row => {
        console.log(row);
      });
    } else {
      console.log('No users found');
    }
    
    // Check if auth_users entries exist
    const authCheck = await pool.query(`
      SELECT * FROM auth_users WHERE email IN ('admin@example.com', 'admin@americancoveragecenter.com')
    `);
    
    if (authCheck.rows.length > 0) {
      console.log('Auth entries exist:');
      console.log(`Found ${authCheck.rows.length} auth entries`);
    } else {
      console.log('No auth entries found');
    }
    
  } catch (error) {
    console.error('Error executing SQL script:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the script
runSqlScript();
