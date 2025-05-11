/**
 * create-missing-tables-js.js
 * This script creates the missing tables (system_health_checks, user_accs, settings) in the database
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';

// Load environment variables
dotenv.config();

// Helper function to log success
function logSuccess(message) {
  console.log(chalk.green('✅ ' + message));
}

// Helper function to log error
function logError(message) {
  console.error(chalk.red('❌ ' + message));
}

// Helper function to log info
function logInfo(message) {
  console.log(chalk.blue('ℹ️ ' + message));
}

console.log(chalk.bold('=== Creating Missing Tables ==='));

// PostgreSQL connection
const { Pool } = pg;
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'agentview',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

// Function to check if a table exists
async function tableExists(tableName) {
  const result = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    );
  `, [tableName]);
  
  return result.rows[0].exists;
}

// Function to create the system_health_checks table
async function createSystemHealthChecksTable() {
  logInfo('Creating system_health_checks table...');
  
  try {
    // Check if the table already exists
    const exists = await tableExists('system_health_checks');
    
    if (exists) {
      logInfo('system_health_checks table already exists, skipping...');
      return true;
    }
    
    // Create the table
    await pool.query(`
      CREATE TABLE system_health_checks (
        id UUID PRIMARY KEY,
        component VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL,
        message TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    
    logSuccess('system_health_checks table created successfully');
    
    // Insert sample data
    logInfo('Inserting sample data into system_health_checks table...');
    
    const samples = [
      {
        component: 'Database',
        status: 'OK',
        message: 'Database connection is healthy'
      },
      {
        component: 'API',
        status: 'OK',
        message: 'API endpoints are responding correctly'
      },
      {
        component: 'Authentication',
        status: 'OK',
        message: 'Authentication service is working properly'
      },
      {
        component: 'Frontend',
        status: 'OK',
        message: 'Frontend is loading correctly'
      }
    ];
    
    for (const sample of samples) {
      await pool.query(`
        INSERT INTO system_health_checks (id, component, status, message, created_at)
        VALUES ($1, $2, $3, $4, NOW())
      `, [uuidv4(), sample.component, sample.status, sample.message]);
    }
    
    logSuccess('Sample data inserted into system_health_checks table');
    
    return true;
  } catch (error) {
    logError(`Error creating system_health_checks table: ${error.message}`);
    return false;
  }
}

// Function to create the user_accs table
async function createUserAccsTable() {
  logInfo('Creating user_accs table...');
  
  try {
    // Check if the table already exists
    const exists = await tableExists('user_accs');
    
    if (exists) {
      logInfo('user_accs table already exists, skipping...');
      return true;
    }
    
    // Create the table
    await pool.query(`
      CREATE TABLE user_accs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        display_name VARCHAR(255) NOT NULL,
        theme_preference VARCHAR(50) DEFAULT 'light',
        notification_preferences JSONB DEFAULT '{"email": true, "push": true, "deals": true, "system": true}'::jsonb,
        account_type VARCHAR(50) DEFAULT 'standard',
        account_status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `);
    
    logSuccess('user_accs table created successfully');
    
    // Get all users
    const usersResult = await pool.query('SELECT id, full_name FROM users');
    
    if (usersResult.rows.length > 0) {
      logInfo(`Inserting ${usersResult.rows.length} user accounts into user_accs table...`);
      
      // Insert user accounts
      for (const user of usersResult.rows) {
        await pool.query(`
          INSERT INTO user_accs (id, user_id, display_name, created_at, updated_at)
          VALUES ($1, $2, $3, NOW(), NOW())
        `, [uuidv4(), user.id, user.full_name]);
      }
      
      logSuccess('User accounts inserted into user_accs table');
    } else {
      logInfo('No users found, skipping user_accs data insertion');
    }
    
    return true;
  } catch (error) {
    logError(`Error creating user_accs table: ${error.message}`);
    return false;
  }
}

// Function to create the settings table
async function createSettingsTable() {
  logInfo('Creating settings table...');
  
  try {
    // Check if the table already exists
    const exists = await tableExists('settings');
    
    if (exists) {
      logInfo('settings table already exists, skipping...');
      return true;
    }
    
    // Create the table
    await pool.query(`
      CREATE TABLE settings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        key VARCHAR(255) NOT NULL,
        value TEXT,
        category VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE(key, category)
      );
    `);
    
    logSuccess('settings table created successfully');
    
    // Insert sample settings
    logInfo('Inserting sample data into settings table...');
    
    const samples = [
      {
        key: 'name',
        value: 'MyAgentView',
        category: 'system'
      },
      {
        key: 'logo_url',
        value: '/assets/logo.png',
        category: 'system'
      },
      {
        key: 'theme',
        value: 'light',
        category: 'system'
      },
      {
        key: 'maintenance_mode',
        value: 'false',
        category: 'system'
      }
    ];
    
    for (const sample of samples) {
      await pool.query(`
        INSERT INTO settings (id, key, value, category, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
      `, [uuidv4(), sample.key, sample.value, sample.category]);
    }
    
    logSuccess('Sample data inserted into settings table');
    
    return true;
  } catch (error) {
    logError(`Error creating settings table: ${error.message}`);
    return false;
  }
}

// Main function to create all missing tables
async function createMissingTables() {
  try {
    // Connect to the database
    await pool.connect();
    
    // Create the uuid-ossp extension if it doesn't exist
    try {
      await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      logSuccess('uuid-ossp extension created or already exists');
    } catch (error) {
      logError(`Error creating uuid-ossp extension: ${error.message}`);
    }
    
    // Create the tables
    const systemHealthChecksCreated = await createSystemHealthChecksTable();
    const userAccsCreated = await createUserAccsTable();
    const settingsCreated = await createSettingsTable();
    
    // Print summary
    console.log(chalk.bold('\n=== Missing Tables Creation Summary ==='));
    console.log(`system_health_checks: ${systemHealthChecksCreated ? chalk.green('CREATED') : chalk.red('FAILED')}`);
    console.log(`user_accs: ${userAccsCreated ? chalk.green('CREATED') : chalk.red('FAILED')}`);
    console.log(`settings: ${settingsCreated ? chalk.green('CREATED') : chalk.red('FAILED')}`);
    
    if (systemHealthChecksCreated && userAccsCreated && settingsCreated) {
      console.log(chalk.bold('\nAll missing tables created successfully!'));
    } else {
      console.log(chalk.bold('\nSome tables failed to create. Please check the logs for details.'));
    }
  } catch (error) {
    logError(`Error connecting to the database: ${error.message}`);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the main function
createMissingTables();
