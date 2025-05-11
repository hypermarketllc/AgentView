/**
 * Configuration utilities for position fix
 * Handles environment variables and database connection configuration
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { logInfo, logSuccess, logError } from './logger.mjs';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

// PostgreSQL connection configuration
const pgConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crm_db',
  user: process.env.POSTGRES_USER || 'crm_user',
  password: process.env.POSTGRES_PASSWORD || 'your_strong_password_here'
};

/**
 * Create and test a database connection pool
 * @returns {Promise<Pool>} PostgreSQL connection pool
 */
async function createDatabasePool() {
  const pool = new Pool(pgConfig);
  
  try {
    logInfo('Connecting to PostgreSQL database...');
    logInfo(`Host: ${pgConfig.host}`);
    logInfo(`Port: ${pgConfig.port}`);
    logInfo(`Database: ${pgConfig.database}`);
    logInfo(`User: ${pgConfig.user}`);
    
    // Test the connection
    await pool.query('SELECT NOW()');
    logSuccess('Connected to PostgreSQL database');
    
    return pool;
  } catch (error) {
    logError(`Database connection error: ${error.message}`);
    throw error;
  }
}

export {
  pgConfig,
  createDatabasePool
};
