/**
 * Test script to verify password hashing and comparison
 * This script tests if the password "Agent123!" matches the hash in the database
 */

import bcrypt from 'bcrypt';
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

// Test password
const testPassword = 'Agent123!';

async function testPasswordHash() {
  console.log('=== Password Hash Test ===');
  console.log(`Testing password: ${testPassword}`);
  
  // Create a new hash with the test password
  const newHash = await bcrypt.hash(testPassword, 10);
  console.log('New hash generated:', newHash);
  
  // Connect to the database
  const pool = new Pool(pgConfig);
  const client = await pool.connect();
  
  try {
    console.log('\nFetching stored hashes from database...');
    
    // Get all users and their password hashes
    const result = await client.query('SELECT id, email, password FROM users');
    
    if (result.rows.length === 0) {
      console.log('No users found in the database');
      return;
    }
    
    // Test each user's password hash
    for (const user of result.rows) {
      console.log(`\nTesting user: ${user.email} (ID: ${user.id})`);
      console.log('Stored hash:', user.password);
      
      // Compare the test password with the stored hash
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log(`Password "${testPassword}" matches stored hash: ${isValid}`);
      
      // If the password doesn't match, try to generate a new hash and update the user
      if (!isValid) {
        console.log('Password does not match. Generating a new hash and updating the user...');
        
        // Generate a new hash
        const updatedHash = await bcrypt.hash(testPassword, 10);
        
        // Update the user's password in the database
        await client.query(
          'UPDATE users SET password = $1 WHERE id = $2',
          [updatedHash, user.id]
        );
        
        console.log('User password updated with new hash:', updatedHash);
        
        // Verify the new hash
        const isNewValid = await bcrypt.compare(testPassword, updatedHash);
        console.log(`New hash verification: ${isNewValid}`);
      }
    }
    
    console.log('\nPassword hash test completed');
  } catch (error) {
    console.error('Error testing password hash:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the test
testPasswordHash()
  .then(() => {
    console.log('Test script completed successfully');
  })
  .catch(error => {
    console.error('Test script failed:', error);
  });
