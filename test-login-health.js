/**
 * test-login-health.js
 * This script tests the login functionality and adds a health check for the login endpoint.
 */

import pg from 'pg';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get database configuration
const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'postgres',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
};

console.log('Database configuration:', dbConfig);

// Create a new pool
const pool = new pg.Pool(dbConfig);

// API URL
const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testLoginHealth() {
  try {
    console.log('Connecting to database...');
    await pool.query('SELECT NOW()');
    console.log('Connected to database successfully.');
    
    // Test login endpoint
    console.log('\nTesting login endpoint...');
    
    // Admin credentials
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@americancoveragecenter.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Discord101!';
    
    try {
      console.log(`Attempting to login with admin credentials: ${adminEmail}`);
      
      const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
        email: adminEmail,
        password: adminPassword
      });
      
      if (loginResponse.status === 200 && loginResponse.data.token) {
        console.log('Login successful!');
        console.log('Token received:', loginResponse.data.token.substring(0, 20) + '...');
        
        // Test user endpoint with token
        console.log('\nTesting user endpoint with token...');
        
        const userResponse = await axios.get(`${API_URL}/api/auth/user`, {
          headers: {
            Authorization: `Bearer ${loginResponse.data.token}`
          }
        });
        
        if (userResponse.status === 200 && userResponse.data.user) {
          console.log('User endpoint successful!');
          console.log('User data:', userResponse.data.user);
          
          // Add health check for login endpoint
          await addLoginHealthCheck(true, loginResponse.status, loginResponse.headers['x-response-time'] || '50ms');
        } else {
          console.error('User endpoint failed:', userResponse.status, userResponse.data);
          await addLoginHealthCheck(false, userResponse.status, userResponse.headers['x-response-time'] || '50ms');
        }
      } else {
        console.error('Login failed:', loginResponse.status, loginResponse.data);
        await addLoginHealthCheck(false, loginResponse.status, loginResponse.headers['x-response-time'] || '50ms');
      }
    } catch (error) {
      console.error('Error testing login endpoint:', error.message);
      
      // Add failed health check
      await addLoginHealthCheck(false, error.response?.status || 500, '0ms');
    }
    
    console.log('\nLogin health check completed.');
  } catch (error) {
    console.error('Error testing login health:', error);
  } finally {
    await pool.end();
  }
}

async function addLoginHealthCheck(success, statusCode, responseTime) {
  try {
    console.log('\nAdding login health check to system_health_checks table...');
    
    // Check if system_health_checks table exists
    const tableCheckResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'system_health_checks'
      );
    `);
    
    const tableExists = tableCheckResult.rows[0].exists;
    
    if (!tableExists) {
      console.log('system_health_checks table does not exist. Creating it...');
      
      // Create system_health_checks table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS system_health_checks (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          status VARCHAR(50) NOT NULL,
          endpoint VARCHAR(255) NOT NULL,
          category VARCHAR(50) NOT NULL,
          message TEXT,
          component VARCHAR(50) NOT NULL
        );
      `);
      
      console.log('system_health_checks table created successfully.');
    }
    
    // Generate a UUID for the id column
    const uuid = await pool.query(`SELECT uuid_generate_v4() as uuid`);
    const id = uuid.rows[0].uuid;
    
    // Insert health check
    await pool.query(
      `INSERT INTO system_health_checks (id, endpoint, status, message, category, component)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        id,
        '/api/auth/login', 
        success ? 'OK' : 'FAIL', 
        `Login test ${success ? 'succeeded' : 'failed'} with status code ${statusCode} (response time: ${responseTime})`,
        'auth',
        'login'
      ]
    );
    
    console.log('Login health check added successfully.');
  } catch (error) {
    console.error('Error adding login health check:', error);
  }
}

// Run the test
testLoginHealth();
