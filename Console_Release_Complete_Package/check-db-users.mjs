/**
 * Script to check the users in the database
 * This script connects to the PostgreSQL database and queries the users table
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// PostgreSQL connection configuration
const pgConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crm_db',
  user: process.env.POSTGRES_USER || 'crm_user',
  password: process.env.POSTGRES_PASSWORD || 'your_strong_password_here'
};

console.log('=== Database Users Check ===');
console.log('PostgreSQL connection configuration:');
console.log(`Host: ${pgConfig.host}`);
console.log(`Port: ${pgConfig.port}`);
console.log(`Database: ${pgConfig.database}`);
console.log(`User: ${pgConfig.user}`);

async function checkDbUsers() {
  // Create a new PostgreSQL connection pool
  const pool = new Pool(pgConfig);
  const client = await pool.connect();
  
  try {
    console.log('\nConnected to PostgreSQL database');
    
    // Check if users table exists
    console.log('\nChecking if users table exists...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('Users table does not exist!');
      return;
    }
    
    console.log('Users table exists');
    
    // Get table structure
    console.log('\nGetting users table structure...');
    const tableStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    console.log('Users table structure:');
    tableStructure.rows.forEach(column => {
      console.log(`- ${column.column_name} (${column.data_type}, ${column.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
    });
    
    // Get all users
    console.log('\nGetting all users...');
    const usersResult = await client.query('SELECT * FROM users');
    
    console.log(`Found ${usersResult.rows.length} users in the database`);
    
    if (usersResult.rows.length === 0) {
      console.log('No users found in the database!');
    } else {
      console.log('\nUsers:');
      usersResult.rows.forEach(user => {
        console.log(`- ID: ${user.id}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Full Name: ${user.full_name}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Position ID: ${user.position_id || 'None'}`);
        console.log(`  Is Active: ${user.is_active !== undefined ? user.is_active : 'Not set'}`);
        console.log(`  Created At: ${user.created_at}`);
        console.log(`  Last Login: ${user.last_login || 'Never'}`);
        console.log('');
      });
    }
    
    // Check if positions table exists
    console.log('\nChecking if positions table exists...');
    const positionsCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'positions'
      );
    `);
    
    if (!positionsCheck.rows[0].exists) {
      console.log('Positions table does not exist!');
      return;
    }
    
    console.log('Positions table exists');
    
    // Get all positions
    console.log('\nGetting all positions...');
    const positionsResult = await client.query('SELECT * FROM positions');
    
    console.log(`Found ${positionsResult.rows.length} positions in the database`);
    
    if (positionsResult.rows.length === 0) {
      console.log('No positions found in the database!');
    } else {
      console.log('\nPositions:');
      positionsResult.rows.forEach(position => {
        console.log(`- ID: ${position.id}`);
        console.log(`  Name: ${position.name}`);
        console.log(`  Level: ${position.level}`);
        console.log(`  Is Admin: ${position.is_admin}`);
        console.log('');
      });
    }
    
    // Check if user_positions view exists
    console.log('\nChecking if user_positions view exists...');
    const viewCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'user_positions'
      );
    `);
    
    if (!viewCheck.rows[0].exists) {
      console.log('user_positions view does not exist!');
      return;
    }
    
    console.log('user_positions view exists');
    
    // Get all user positions
    console.log('\nGetting all user positions...');
    const userPositionsResult = await client.query('SELECT * FROM user_positions');
    
    console.log(`Found ${userPositionsResult.rows.length} user positions in the database`);
    
    if (userPositionsResult.rows.length === 0) {
      console.log('No user positions found in the database!');
    } else {
      console.log('\nUser Positions:');
      userPositionsResult.rows.forEach(userPosition => {
        console.log(`- User ID: ${userPosition.user_id}`);
        console.log(`  Email: ${userPosition.email}`);
        console.log(`  Position ID: ${userPosition.position_id}`);
        console.log(`  Position Name: ${userPosition.position_name}`);
        console.log('');
      });
    }
    
    // Check database schemas
    console.log('\nChecking database schemas...');
    const schemasResult = await client.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
      ORDER BY schema_name;
    `);
    
    console.log('Database schemas:');
    schemasResult.rows.forEach(schema => {
      console.log(`- ${schema.schema_name}`);
    });
    
  } catch (error) {
    console.error('Error checking database users:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the check
checkDbUsers()
  .then(() => {
    console.log('\nDatabase users check completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
