/**
 * apply_system_errors_table.mjs
 * Script to create the system_errors table in the PostgreSQL database
 * Converted to ES module format
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const { Pool } = pg;

// Get current file directory (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Read SQL file
const sqlFilePath = path.join(__dirname, 'sql', 'create_system_errors_table.sql');
const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

// Create database connection pool
const pool = new Pool({
  host: process.env.DOCKER_ENV === 'true' ? 'db' : (process.env.POSTGRES_HOST || 'localhost'),
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crm_db',
  user: process.env.POSTGRES_USER || 'crm_user',
  password: process.env.POSTGRES_PASSWORD || 'your_strong_password_here'
});

async function applySystemErrorsTable() {
  const client = await pool.connect();
  
  try {
    console.log('Applying system_errors table to PostgreSQL database...');
    await client.query(sqlScript);
    console.log('System_errors table created successfully!');
  } catch (error) {
    console.error('Error creating system_errors table:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Execute the function
applySystemErrorsTable();
