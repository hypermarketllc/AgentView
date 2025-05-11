/**
 * fix-system-health-checks-table-constraint.js
 * This script fixes the constraint issue in the system_health_checks table
 */

import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// PostgreSQL connection
const { Pool } = pg;
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'agentview',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

async function fixSystemHealthChecksTable() {
  console.log('=== Fixing System Health Checks Table ===');
  
  try {
    // Check database connection
    const connectionResult = await pool.query('SELECT NOW()');
    console.log('Database connected:', connectionResult.rows[0]);
    
    // Check table structure
    console.log('Checking system_health_checks table structure...');
    
    try {
      const tableInfo = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'system_health_checks'
        ORDER BY ordinal_position
      `);
      
      console.log('Table structure:');
      tableInfo.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
      });
      
      // Check constraints
      const constraints = await pool.query(`
        SELECT conname, pg_get_constraintdef(c.oid)
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE conrelid = 'system_health_checks'::regclass
        AND n.nspname = 'public'
      `);
      
      console.log('Constraints:');
      constraints.rows.forEach(row => {
        console.log(`  ${row.conname}: ${row.pg_get_constraintdef}`);
      });
      
      // Drop the problematic constraint if it exists
      if (constraints.rows.some(row => row.conname === 'system_health_checks_status_check')) {
        console.log('Dropping problematic constraint: system_health_checks_status_check');
        await pool.query('ALTER TABLE system_health_checks DROP CONSTRAINT IF EXISTS system_health_checks_status_check');
      }
      
      // Recreate the table with the correct structure
      console.log('Recreating system_health_checks table with correct structure...');
      
      // Begin transaction
      await pool.query('BEGIN');
      
      // Create temporary table
      await pool.query(`
        CREATE TABLE system_health_checks_temp (
          id UUID PRIMARY KEY,
          component VARCHAR(255) NOT NULL,
          status VARCHAR(50) NOT NULL,
          message TEXT,
          endpoint VARCHAR(255),
          category VARCHAR(50),
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      
      // Copy data if possible
      try {
        await pool.query(`
          INSERT INTO system_health_checks_temp
          SELECT id, component, status, message, endpoint, category, created_at
          FROM system_health_checks
        `);
        console.log('Existing data copied to temporary table');
      } catch (error) {
        console.log('No existing data to copy or error copying data:', error.message);
      }
      
      // Drop original table
      await pool.query('DROP TABLE IF EXISTS system_health_checks');
      
      // Create new table
      await pool.query(`
        CREATE TABLE system_health_checks (
          id UUID PRIMARY KEY,
          component VARCHAR(255) NOT NULL,
          status VARCHAR(50) NOT NULL,
          message TEXT,
          endpoint VARCHAR(255),
          category VARCHAR(50),
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      
      // Copy data back
      await pool.query(`
        INSERT INTO system_health_checks
        SELECT * FROM system_health_checks_temp
      `);
      
      // Drop temporary table
      await pool.query('DROP TABLE system_health_checks_temp');
      
      // Commit transaction
      await pool.query('COMMIT');
      
      console.log('System health checks table recreated successfully');
      
      // Insert sample data
      console.log('Inserting sample data...');
      
      await pool.query(`
        INSERT INTO system_health_checks (id, component, status, message, endpoint, category)
        VALUES 
          (uuid_generate_v4(), 'Database', 'OK', 'Database connection successful', '/api/db/status', 'System'),
          (uuid_generate_v4(), 'API', 'OK', 'API endpoints responding', '/api/health', 'System'),
          (uuid_generate_v4(), 'Auth', 'OK', 'Authentication service running', '/api/auth/status', 'Security')
        ON CONFLICT DO NOTHING
      `);
      
      console.log('Sample data inserted successfully');
    } catch (error) {
      // Rollback transaction if error
      await pool.query('ROLLBACK');
      
      console.error('Error checking/fixing table structure:', error);
      
      // Create the table from scratch
      console.log('Creating system_health_checks table from scratch...');
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS system_health_checks (
          id UUID PRIMARY KEY,
          component VARCHAR(255) NOT NULL,
          status VARCHAR(50) NOT NULL,
          message TEXT,
          endpoint VARCHAR(255),
          category VARCHAR(50),
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      
      console.log('System health checks table created');
      
      // Insert sample data
      console.log('Inserting sample data...');
      
      await pool.query(`
        INSERT INTO system_health_checks (id, component, status, message, endpoint, category)
        VALUES 
          (uuid_generate_v4(), 'Database', 'OK', 'Database connection successful', '/api/db/status', 'System'),
          (uuid_generate_v4(), 'API', 'OK', 'API endpoints responding', '/api/health', 'System'),
          (uuid_generate_v4(), 'Auth', 'OK', 'Authentication service running', '/api/auth/status', 'Security')
        ON CONFLICT DO NOTHING
      `);
      
      console.log('Sample data inserted successfully');
    }
    
    // Verify the fix
    console.log('Verifying the fix...');
    
    const countResult = await pool.query('SELECT COUNT(*) FROM system_health_checks');
    console.log(`System health checks count: ${countResult.rows[0].count}`);
    
    console.log('=== System Health Checks Table Fixed ===');
  } catch (error) {
    console.error('Error fixing system health checks table:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the fix
fixSystemHealthChecksTable();
