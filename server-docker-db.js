/**
 * server-docker-db.js
 * Database initialization and connection for the Docker environment
 */

import pg from 'pg';
import robustPatch, { uuidUtils, envUtils, dbUtils } from './robust-patch.js';
import bcrypt from 'bcrypt';

// Configuration
const SALT_ROUNDS = 10;

// Determine if we're running in Docker
const isDocker = process.env.RUNNING_IN_DOCKER === 'true';

// PostgreSQL connection
const { Pool } = pg;
const pool = new Pool(envUtils.getDatabaseConfig());

console.log(`Connecting to PostgreSQL at ${isDocker ? 'db' : (process.env.POSTGRES_HOST || 'localhost')}:${process.env.POSTGRES_PORT || '5432'}`);

// Initialize database
async function initializeDatabase(pool) {
  try {
    // Test connection
    const connected = await dbUtils.testConnection(pool);
    if (!connected) {
      throw new Error('Database connection failed');
    }
    
    // Create tables if they don't exist
    await createTables(pool);
    
    // Insert default data if needed
    await insertDefaultData(pool);
    
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err; // Re-throw to allow caller to handle
  }
}

// Create database tables
async function createTables(pool) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        position_id UUID NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS positions (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        level INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS carriers (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        carrier_id UUID NOT NULL REFERENCES carriers(id),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deals (
        id UUID PRIMARY KEY,
        agent_id UUID NOT NULL REFERENCES users(id),
        carrier_id UUID NOT NULL REFERENCES carriers(id),
        product_id UUID NOT NULL REFERENCES products(id),
        client_name VARCHAR(255) NOT NULL,
        annual_premium NUMERIC(10, 2) NOT NULL,
        app_number VARCHAR(255),
        client_phone VARCHAR(255),
        effective_date DATE,
        from_referral BOOLEAN DEFAULT FALSE,
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  } catch (err) {
    console.error('Error creating tables:', err);
    throw err;
  }
}

// Insert default data
async function insertDefaultData(pool) {
  try {
    // Check if positions table is empty
    const positionsCount = await pool.query('SELECT COUNT(*) FROM positions');
    if (parseInt(positionsCount.rows[0].count) === 0) {
      // Insert default positions
      await pool.query(`
        INSERT INTO positions (id, name, level) VALUES
        ('8395f610-6c95-4cd5-b778-ee6825ac78d1', 'Owner', 4),
        ('599470e2-3803-41a2-a792-82911e60c2f4', 'Admin', 3),
        ('ec2cfd8f-024d-4b5c-b23d-fd26d951f1bb', 'Manager', 2),
        ('b9a5f115-6c8a-4c0e-8c2b-35c1e8a98a7d', 'Agent', 1)
      `);
    }
    
    // Check if users table is empty
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(usersCount.rows[0].count) === 0) {
      // Insert default admin user
      const adminId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
      const adminEmail = 'admin@example.com';
      const adminPassword = 'Admin123!';
      const adminPasswordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);
      
      await pool.query(`
        INSERT INTO users (id, email, password_hash, full_name, position_id) VALUES
        ($1, $2, $3, $4, $5)
      `, [adminId, adminEmail, adminPasswordHash, 'Admin User', '599470e2-3803-41a2-a792-82911e60c2f4']);
      
      console.log('Default admin user created:');
      console.log('  Email:', adminEmail);
      console.log('  Password:', adminPassword);
    }
    
    // Check if carriers table is empty
    const carriersCount = await pool.query('SELECT COUNT(*) FROM carriers');
    if (parseInt(carriersCount.rows[0].count) === 0) {
      // Insert default carriers with valid UUIDs
      // Insert default carriers with valid UUIDs
      await dbUtils.safeQuery(pool, `
        INSERT INTO carriers (id, name) VALUES
        ('${uuidUtils.safe("c1d2e3f4-a1b2-c3d4-e5f6-a1b2c3d4e5f6")}', 'Carrier A'),
        ('${uuidUtils.safe("d2e3f4f5-b2c3-d4e5-f6f7-b2c3d4e5f6f7")}', 'Carrier B'),
        ('${uuidUtils.safe("e3f4f5f6-c3d4-e5f6-f7f8-c3d4e5f6f7f8")}', 'Carrier C')
      `);
      
      // Insert default products with valid UUIDs
      // Insert default products with valid UUIDs
      await dbUtils.safeQuery(pool, `
        INSERT INTO products (id, name, carrier_id) VALUES
        ('${uuidUtils.safe("f4f5f6f7-d4e5-f6f7-f8f9-d4e5f6f7f8f9")}', 'Product A1', '${uuidUtils.safe("c1d2e3f4-a1b2-c3d4-e5f6-a1b2c3d4e5f6")}'),
        ('${uuidUtils.safe("f5f6f7f8-e5f6-f7f8-f9f0-e5f6f7f8f9f0")}', 'Product A2', '${uuidUtils.safe("c1d2e3f4-a1b2-c3d4-e5f6-a1b2c3d4e5f6")}'),
        ('${uuidUtils.safe("f6f7f8f9-f6f7-f8f9-f0f1-f6f7f8f9f0f1")}', 'Product B1', '${uuidUtils.safe("d2e3f4f5-b2c3-d4e5-f6f7-b2c3d4e5f6f7")}'),
        ('${uuidUtils.safe("f7f8f9f0-f7f8-f9f0-f1f2-f7f8f9f0f1f2")}', 'Product C1', '${uuidUtils.safe("e3f4f5f6-c3d4-e5f6-f7f8-c3d4e5f6f7f8")}')
      `);
    }
  } catch (err) {
    console.error('Error inserting default data:', err);
    throw err;
  }
}

// Export database-related functions and objects
export { pool, initializeDatabase, SALT_ROUNDS };
