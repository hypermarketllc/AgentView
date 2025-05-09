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
    const sqlFilePath = path.join(__dirname, 'fix-user-permissions.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL script
    console.log('Executing SQL script...');
    await pool.query(sqlScript);
    console.log('SQL script executed successfully');
    
    // Run verification queries separately
    console.log('\n--- Positions ---');
    const positionsQuery = `
      SELECT p.id, p.name, p.level, p.description
      FROM positions p
      WHERE p.name IN ('Owner', 'Agent', 'Admin')
      ORDER BY p.level DESC;
    `;
    const positionsResult = await pool.query(positionsQuery);
    if (positionsResult.rows.length > 0) {
      positionsResult.rows.forEach(pos => {
        console.log(`Name: ${pos.name}, Level: ${pos.level}, Description: ${pos.description || 'N/A'}`);
      });
    } else {
      console.log('No positions found');
    }
    
    console.log('\n--- Users and Their Positions ---');
    const usersQuery = `
      SELECT u.id, u.email, u.full_name, p.name as position_name, p.level as position_level
      FROM users u
      JOIN positions p ON u.position_id = p.id
      WHERE u.email IN ('admin@example.com', 'admin@americancoveragecenter.com')
      ORDER BY p.level DESC;
    `;
    const usersResult = await pool.query(usersQuery);
    if (usersResult.rows.length > 0) {
      usersResult.rows.forEach(user => {
        console.log(`Email: ${user.email}, Full Name: ${user.full_name}, Position: ${user.position_name}, Level: ${user.position_level}`);
      });
    } else {
      console.log('No users found with the specified emails');
    }
    
    console.log('\n--- Auth Users ---');
    const authUsersQuery = `
      SELECT a.id, a.email, u.id as user_id, u.email as user_email
      FROM auth_users a
      LEFT JOIN users u ON a.id = u.id
      WHERE a.email IN ('admin@example.com', 'admin@americancoveragecenter.com');
    `;
    const authUsersResult = await pool.query(authUsersQuery);
    if (authUsersResult.rows.length > 0) {
      authUsersResult.rows.forEach(auth => {
        console.log(`Auth ID: ${auth.id}, Auth Email: ${auth.email}, User ID: ${auth.user_id || 'N/A'}, User Email: ${auth.user_email || 'N/A'}`);
        console.log(`ID Match: ${auth.id === auth.user_id ? 'Yes' : 'No'}`);
      });
    } else {
      console.log('No auth users found with the specified emails');
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
