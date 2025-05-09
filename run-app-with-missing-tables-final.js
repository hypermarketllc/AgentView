/**
 * run-app-with-missing-tables-final.js
 * 
 * This script applies the fixed missing tables and then runs the fixed system with monitoring.
 * It's a wrapper script that ensures all required tables exist before starting the server.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';
import { spawn } from 'child_process';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL connection - use values from .env file
const { Pool } = pg;
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'agentview',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres'
});

async function applyMissingTables() {
  try {
    console.log('Connecting to database...');
    console.log(`Database: ${process.env.POSTGRES_DB}, User: ${process.env.POSTGRES_USER}`);
    
    // Test connection
    const res = await pool.query('SELECT NOW()');
    console.log('Database connected:', res.rows[0].now);
    
    // Read SQL file
    const sqlPath = path.join(__dirname, 'create-missing-tables-fixed2.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Applying missing tables...');
    
    // Execute SQL
    await pool.query(sql);
    
    console.log('Missing tables applied successfully!');
    
    // Verify tables were created
    const tables = ['system_health_checks', 'system_errors', 'user_accs', 'settings'];
    
    for (const table of tables) {
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [table]);
      
      if (tableCheck.rows[0].exists) {
        console.log(`✅ Table '${table}' exists`);
      } else {
        console.error(`❌ Table '${table}' was not created`);
        throw new Error(`Table '${table}' was not created`);
      }
    }
    
    // Check if default settings were inserted
    const settingsCount = await pool.query('SELECT COUNT(*) FROM settings');
    console.log(`Settings table has ${settingsCount.rows[0].count} entries`);
    
    return true;
  } catch (error) {
    console.error('Error applying missing tables:', error);
    return false;
  } finally {
    // Close pool
    await pool.end();
  }
}

async function runServer() {
  console.log('Starting server with system monitoring...');
  
  // Run the fixed server script
  const serverProcess = spawn('node', ['run-fixed-system-with-monitoring-fixed.js'], {
    stdio: 'inherit',
    shell: true
  });
  
  // Handle server process events
  serverProcess.on('error', (error) => {
    console.error('Failed to start server:', error);
  });
  
  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Received SIGINT. Shutting down server...');
    serverProcess.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Shutting down server...');
    serverProcess.kill('SIGTERM');
  });
}

// Main function
async function main() {
  console.log('=== Starting application with fixed missing tables ===');
  
  // Apply missing tables
  const tablesApplied = await applyMissingTables();
  
  if (tablesApplied) {
    // Run the server
    await runServer();
  } else {
    console.error('Failed to apply missing tables. Server will not start.');
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
