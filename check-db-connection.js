// Script to check database connection and auth_users table
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current file directory (ES modules equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Create a connection pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'crm_db',
  user: process.env.POSTGRES_USER || 'crm_user',
  password: process.env.POSTGRES_PASSWORD || 'your_strong_password_here'
});

async function checkDatabaseConnection() {
  try {
    console.log('Checking database connection...');
    console.log('Connection parameters:');
    console.log(`  Host: ${process.env.POSTGRES_HOST || 'localhost'}`);
    console.log(`  Port: ${process.env.POSTGRES_PORT || '5432'}`);
    console.log(`  Database: ${process.env.POSTGRES_DB || 'crm_db'}`);
    console.log(`  User: ${process.env.POSTGRES_USER || 'crm_user'}`);
    console.log(`  Password: ${process.env.POSTGRES_PASSWORD ? '********' : 'Not set'}`);
    
    // Test connection
    const connectionResult = await pool.query('SELECT NOW()');
    console.log('Database connection successful:', connectionResult.rows[0]);
    
    // Check if auth_users table exists
    console.log('\nChecking auth_users table...');
    const tableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'auth_users'
      )
    `);
    
    const tableExists = tableResult.rows[0].exists;
    console.log(`auth_users table exists: ${tableExists}`);
    
    if (tableExists) {
      // Check table structure
      const structureResult = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'auth_users'
        ORDER BY ordinal_position
      `);
      
      console.log('\nauth_users table structure:');
      structureResult.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type}`);
      });
      
      // Count records
      const countResult = await pool.query('SELECT COUNT(*) FROM auth_users');
      console.log(`\nTotal auth_users records: ${countResult.rows[0].count}`);
      
      // List all auth_users (without password hashes)
      const usersResult = await pool.query(`
        SELECT id, email, substring(password_hash from 1 for 20) || '...' as password_hash_preview
        FROM auth_users
      `);
      
      console.log('\nAuth users:');
      usersResult.rows.forEach(row => {
        console.log(`  ${row.email} (ID: ${row.id}, Hash preview: ${row.password_hash_preview})`);
      });
    }
    
    // Check if users table exists and count records
    console.log('\nChecking users table...');
    const usersTableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);
    
    const usersTableExists = usersTableResult.rows[0].exists;
    console.log(`users table exists: ${usersTableExists}`);
    
    if (usersTableExists) {
      // Count records
      const usersCountResult = await pool.query('SELECT COUNT(*) FROM users');
      console.log(`Total users records: ${usersCountResult.rows[0].count}`);
      
      // Check for admin@americancoveragecenter.com
      const adminResult = await pool.query(`
        SELECT * FROM users WHERE email = 'admin@americancoveragecenter.com'
      `);
      
      if (adminResult.rows.length > 0) {
        console.log('\nAdmin user found:');
        console.log(adminResult.rows[0]);
        
        // Check if admin has auth record
        const adminAuthResult = await pool.query(`
          SELECT * FROM auth_users WHERE email = 'admin@americancoveragecenter.com'
        `);
        
        if (adminAuthResult.rows.length > 0) {
          console.log('\nAdmin auth record found:');
          console.log({
            id: adminAuthResult.rows[0].id,
            email: adminAuthResult.rows[0].email,
            password_hash_preview: adminAuthResult.rows[0].password_hash.substring(0, 20) + '...'
          });
        } else {
          console.log('\nWARNING: Admin user has no auth record!');
        }
      } else {
        console.log('\nWARNING: Admin user not found!');
      }
    }
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the function
checkDatabaseConnection();
