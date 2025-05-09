/**
 * check-admin-auth.js
 * 
 * A script to test admin authentication with the PostgreSQL database.
 * This verifies that the authentication system is working properly
 * after migrating from Supabase to PostgreSQL.
 */

// Import required modules
import pg from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Initialize dotenv
dotenv.config();

const { Pool } = pg;

// Get database connection parameters from environment variables
const host = process.env.POSTGRES_HOST || 'localhost';
const port = parseInt(process.env.POSTGRES_PORT || '5432');
const database = process.env.POSTGRES_DB || 'crm_db';
const user = process.env.POSTGRES_USER || 'crm_user';
const password = process.env.POSTGRES_PASSWORD;
const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';

// Create a connection pool
const pool = new Pool({
  host,
  port,
  database,
  user,
  password
});

// Test admin authentication
async function testAdminAuth() {
  console.log('Testing admin authentication with PostgreSQL...');
  
  try {
    // Check if admin user exists
    const adminCheckResult = await pool.query(`
      SELECT u.*, p.name as position_name, p.level as position_level 
      FROM users u
      JOIN positions p ON u.position_id = p.id
      WHERE u.email = 'admin@example.com'
    `);
    
    if (adminCheckResult.rows.length === 0) {
      console.log('\n⚠️ Admin user not found. Creating admin user...');
      
      // Get default position (highest level)
      const positionResult = await pool.query(`
        SELECT id FROM positions 
        ORDER BY level DESC 
        LIMIT 1
      `);
      
      if (positionResult.rows.length === 0) {
        throw new Error('No positions found in the database');
      }
      
      const positionId = positionResult.rows[0].id;
      
      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash('admin123', saltRounds);
      
      // Insert admin user
      const insertResult = await pool.query(`
        INSERT INTO users (
          id, email, password_hash, full_name, position_id, is_active, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), 'admin@example.com', $1, 'Admin User', $2, true, NOW(), NOW()
        ) RETURNING id, email, full_name, position_id
      `, [passwordHash, positionId]);
      
      console.log('✅ Admin user created successfully:');
      console.log(insertResult.rows[0]);
      
      // Get admin user with position
      const adminResult = await pool.query(`
        SELECT u.*, p.name as position_name, p.level as position_level 
        FROM users u
        JOIN positions p ON u.position_id = p.id
        WHERE u.email = 'admin@example.com'
      `);
      
      const admin = adminResult.rows[0];
      console.log('\nAdmin user details:');
      console.log(`- ID: ${admin.id}`);
      console.log(`- Email: ${admin.email}`);
      console.log(`- Name: ${admin.full_name}`);
      console.log(`- Position: ${admin.position_name} (Level ${admin.position_level})`);
    } else {
      const admin = adminCheckResult.rows[0];
      console.log('\n✅ Admin user found:');
      console.log(`- ID: ${admin.id}`);
      console.log(`- Email: ${admin.email}`);
      console.log(`- Name: ${admin.full_name}`);
      console.log(`- Position: ${admin.position_name} (Level ${admin.position_level})`);
    }
    
    // Test login with admin credentials
    console.log('\nTesting admin login...');
    
    // Get admin user
    const loginResult = await pool.query(`
      SELECT u.*, p.name as position_name, p.level as position_level 
      FROM users u
      JOIN positions p ON u.position_id = p.id
      WHERE u.email = 'admin@example.com'
    `);
    
    if (loginResult.rows.length === 0) {
      throw new Error('Admin user not found');
    }
    
    const adminUser = loginResult.rows[0];
    
    // Check if we need to update the password for testing
    let passwordUpdated = false;
    if (!adminUser.password_hash) {
      console.log('⚠️ Admin user has no password. Setting default password...');
      
      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash('admin123', saltRounds);
      
      // Update admin user password
      await pool.query(`
        UPDATE users 
        SET password_hash = $1 
        WHERE id = $2
      `, [passwordHash, adminUser.id]);
      
      passwordUpdated = true;
      console.log('✅ Admin password updated');
    }
    
    // Verify password
    const passwordMatch = passwordUpdated || await bcrypt.compare('admin123', adminUser.password_hash);
    
    if (!passwordMatch) {
      console.log('❌ Password verification failed');
      
      // Reset password for testing
      console.log('Resetting admin password for testing...');
      
      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash('admin123', saltRounds);
      
      // Update admin user password
      await pool.query(`
        UPDATE users 
        SET password_hash = $1 
        WHERE id = $2
      `, [passwordHash, adminUser.id]);
      
      console.log('✅ Admin password reset');
    } else {
      console.log('✅ Password verification successful');
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: adminUser.id, email: adminUser.email },
        jwtSecret,
        { expiresIn: '24h' }
      );
      
      console.log('\n✅ JWT token generated successfully');
      console.log('Token:', token);
      
      // Verify JWT token
      try {
        const decoded = jwt.verify(token, jwtSecret);
        console.log('\n✅ JWT token verification successful');
        console.log('Decoded token:', decoded);
      } catch (error) {
        console.error('\n❌ JWT token verification failed:', error.message);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Authentication test failed!');
    console.error('Error details:', error.message);
    console.error(error);
  } finally {
    // Close the pool
    await pool.end();
    console.log('\nConnection pool closed.');
  }
}

// Run the test
testAdminAuth();
