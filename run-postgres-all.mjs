/**
 * PostgreSQL All-in-One Runner
 * 
 * This script handles everything needed for running the application with PostgreSQL:
 * - Sets up the environment
 * - Manages PostgreSQL in Docker
 * - Runs the application with the Supabase to PostgreSQL adapter
 * - Provides detailed logging
 * 
 * Usage: node run-postgres-all.mjs
 */

import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import dotenv from 'dotenv';

// Convert ES module URL to file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Promisify exec for async/await usage
const execAsync = promisify(exec);

// Create a log file with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const logFile = path.join(__dirname, `postgres-migration-${timestamp}.log`);

// Initialize logger
const logger = {
  log: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(logFile, logMessage + '\n');
  },
  error: (message, error) => {
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] ERROR: ${message}`;
    if (error) {
      logMessage += `\n${error.stack || error}`;
    }
    console.error(logMessage);
    fs.appendFileSync(logFile, logMessage + '\n');
  },
  success: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ✅ ${message}`;
    console.log(logMessage);
    fs.appendFileSync(logFile, logMessage + '\n');
  },
  warning: (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ⚠️ ${message}`;
    console.warn(logMessage);
    fs.appendFileSync(logFile, logMessage + '\n');
  },
  section: (title) => {
    const separator = '='.repeat(80);
    const message = `\n${separator}\n${title}\n${separator}\n`;
    console.log(message);
    fs.appendFileSync(logFile, message + '\n');
  }
};

// Initialize log file
fs.writeFileSync(logFile, `PostgreSQL Migration Log - ${new Date().toISOString()}\n\n`);
logger.log(`Log file created at: ${logFile}`);

// Create a .env.postgres file if it doesn't exist
function createPostgresEnvFile() {
  const envPostgresPath = path.join(__dirname, '.env.postgres');
  
  if (!fs.existsSync(envPostgresPath)) {
    logger.log('Creating .env.postgres file...');
    
    const envContent = `
# PostgreSQL Connection
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=agentview
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Use PostgreSQL instead of Supabase
USE_POSTGRES=true
VITE_USE_POSTGRES=true

# Server Configuration
PORT=3000
NODE_ENV=development
`;
    
    fs.writeFileSync(envPostgresPath, envContent.trim());
    logger.success('.env.postgres file created');
  }
  
  // Copy .env.postgres to .env
  logger.log('Copying .env.postgres to .env...');
  fs.copyFileSync(envPostgresPath, path.join(__dirname, '.env'));
  logger.success('.env file updated');
  
  // Load environment variables
  dotenv.config();
}

// Check if Docker is installed
async function checkDocker() {
  try {
    logger.log('Checking if Docker is installed...');
    const { stdout } = await execAsync('docker --version');
    logger.success(`Docker is installed: ${stdout.trim()}`);
    return true;
  } catch (error) {
    logger.error('Docker is not installed or not in PATH', error);
    logger.warning('Please install Docker from https://www.docker.com/products/docker-desktop');
    return false;
  }
}

// Check if Docker Compose is installed
async function checkDockerCompose() {
  try {
    logger.log('Checking if Docker Compose is installed...');
    const { stdout } = await execAsync('docker-compose --version');
    logger.success(`Docker Compose is installed: ${stdout.trim()}`);
    return true;
  } catch (error) {
    logger.error('Docker Compose is not installed or not in PATH', error);
    logger.warning('Please install Docker Compose from https://docs.docker.com/compose/install/');
    return false;
  }
}

// Start PostgreSQL in Docker
async function startPostgres() {
  try {
    logger.section('Starting PostgreSQL in Docker');
    
    // Check if PostgreSQL container exists (running or not)
    const { stdout: containerExists } = await execAsync('docker ps -a --filter "name=agentview-postgres" --format "{{.Names}}"');
    
    if (containerExists.trim() === 'agentview-postgres') {
      // Check container status
      const { stdout: containerStatus } = await execAsync('docker ps --filter "name=agentview-postgres" --format "{{.Status}}"');
      
      if (containerStatus.includes('Restarting')) {
        logger.warning('PostgreSQL container is restarting, which indicates an issue');
        logger.log('Stopping and removing the problematic container...');
        
        try {
          await execAsync('docker stop agentview-postgres');
          logger.log('Container stopped');
        } catch (stopError) {
          logger.warning('Failed to stop container, it may already be stopped');
        }
        
        try {
          await execAsync('docker rm agentview-postgres');
          logger.log('Container removed');
        } catch (rmError) {
          logger.error('Failed to remove container', rmError);
          return false;
        }
        
        // Also remove the volume to start fresh
        try {
          await execAsync('docker volume rm agentview_postgres-data');
          logger.log('Volume removed');
        } catch (volumeError) {
          logger.warning('Failed to remove volume, it may not exist or be in use');
        }
      } else if (containerStatus.trim()) {
        logger.warning('PostgreSQL container is already running');
        logger.log(`Container status: ${containerStatus.trim()}`);
        
        // Check if it's actually working
        try {
          await execAsync('docker exec agentview-postgres pg_isready -U postgres');
          logger.success('PostgreSQL is ready');
          return true;
        } catch (readyError) {
          logger.warning('Container is running but PostgreSQL is not ready');
          logger.log('Stopping and removing the problematic container...');
          
          try {
            await execAsync('docker stop agentview-postgres');
            await execAsync('docker rm agentview-postgres');
            logger.log('Container stopped and removed');
          } catch (cleanupError) {
            logger.error('Failed to clean up container', cleanupError);
            return false;
          }
        }
      } else {
        logger.warning('PostgreSQL container exists but is not running');
        logger.log('Removing the stopped container...');
        
        try {
          await execAsync('docker rm agentview-postgres');
          logger.log('Container removed');
        } catch (rmError) {
          logger.error('Failed to remove container', rmError);
          return false;
        }
      }
    }
    
    // Start PostgreSQL container
    logger.log('Starting PostgreSQL container...');
    await execAsync('docker-compose -f docker-compose.postgres.yml up -d');
    logger.success('PostgreSQL container started');
    
    // Wait for PostgreSQL to be ready
    logger.log('Waiting for PostgreSQL to be ready...');
    let ready = false;
    let attempts = 0;
    const maxAttempts = 60;
    
    while (!ready && attempts < maxAttempts) {
      try {
        await execAsync('docker exec agentview-postgres pg_isready -U postgres');
        ready = true;
        logger.success('PostgreSQL is ready');
      } catch (error) {
        attempts++;
        logger.log(`Waiting for PostgreSQL to be ready... (${attempts}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Every 10 attempts, check container status
        if (attempts % 10 === 0) {
          try {
            const { stdout } = await execAsync('docker ps --filter "name=agentview-postgres" --format "{{.Status}}"');
            logger.log(`Container status: ${stdout.trim()}`);
            
            // If container is restarting, there's a problem
            if (stdout.includes('Restarting')) {
              logger.error('Container is restarting repeatedly, which indicates a configuration issue');
              logger.log('Checking container logs for errors...');
              
              try {
                const { stdout: logs } = await execAsync('docker logs --tail 50 agentview-postgres');
                logger.log(`Container logs:\n${logs.trim()}`);
                
                // Look for common error patterns
                if (logs.includes('Permission denied')) {
                  logger.error('Permission issues detected in logs');
                  logger.log('Stopping container and fixing permissions...');
                  
                  await execAsync('docker stop agentview-postgres');
                  await execAsync('docker rm agentview-postgres');
                  
                  // Modify docker-compose file to use root user (temporary fix)
                  const dockerComposeFile = path.join(__dirname, 'docker-compose.postgres.yml');
                  let dockerComposeContent = fs.readFileSync(dockerComposeFile, 'utf8');
                  
                  if (!dockerComposeContent.includes('user: "root"')) {
                    dockerComposeContent = dockerComposeContent.replace(
                      'container_name: agentview-postgres',
                      'container_name: agentview-postgres\n    user: "root"'
                    );
                    fs.writeFileSync(dockerComposeFile, dockerComposeContent);
                    logger.log('Added root user to docker-compose.postgres.yml');
                  }
                  
                  // Try starting again
                  await execAsync('docker-compose -f docker-compose.postgres.yml up -d');
                  logger.log('Container restarted with root user');
                  
                  // Reset attempts counter to give it more time
                  attempts = Math.max(0, attempts - 20);
                } else if (logs.includes('already exists')) {
                  logger.error('Database objects already exist');
                  logger.log('This might be due to a previous failed initialization');
                  
                  // Continue and hope it works
                }
              } catch (logsError) {
                logger.error('Failed to check container logs', logsError);
              }
            }
          } catch (containerError) {
            logger.error('Failed to check container status', containerError);
          }
        }
      }
    }
    
    if (!ready) {
      logger.error('PostgreSQL failed to become ready in time');
      logger.warning('Attempting to troubleshoot the issue...');
      
      try {
        // Get container logs
        const { stdout: containerLogs } = await execAsync('docker logs --tail 50 agentview-postgres');
        logger.log(`Container logs:\n${containerLogs}`);
        
        // Try to restart the container
        logger.log('Attempting to restart the PostgreSQL container...');
        await execAsync('docker restart agentview-postgres');
        logger.log('Container restarted, waiting for it to be ready...');
        
        // Wait again with fewer attempts
        for (let i = 0; i < 15; i++) {
          try {
            await execAsync('docker exec agentview-postgres pg_isready -U postgres');
            logger.success('PostgreSQL is now ready after restart!');
            return true;
          } catch (error) {
            logger.log(`Waiting after restart... (${i+1}/15)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // If still not ready, try a complete rebuild
        logger.warning('PostgreSQL still not ready after restart, attempting complete rebuild...');
        
        // Stop and remove container
        await execAsync('docker stop agentview-postgres');
        await execAsync('docker rm agentview-postgres');
        
        // Remove volume
        try {
          await execAsync('docker volume rm agentview_postgres-data');
        } catch (volumeError) {
          logger.warning('Failed to remove volume, it may not exist or be in use');
        }
        
        // Start container again
        await execAsync('docker-compose -f docker-compose.postgres.yml up -d');
        logger.log('Container rebuilt from scratch, waiting for it to be ready...');
        
        // Wait again with fewer attempts
        for (let i = 0; i < 15; i++) {
          try {
            await execAsync('docker exec agentview-postgres pg_isready -U postgres');
            logger.success('PostgreSQL is now ready after rebuild!');
            return true;
          } catch (error) {
            logger.log(`Waiting after rebuild... (${i+1}/15)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } catch (troubleshootError) {
        logger.error('Troubleshooting failed', troubleshootError);
      }
      
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Failed to start PostgreSQL in Docker', error);
    return false;
  }
}

// Check if PostgreSQL is ready
async function checkPostgresReady() {
  try {
    logger.section('Checking PostgreSQL Connection');
    
    // Get PostgreSQL connection details from environment variables
    const pgHost = process.env.POSTGRES_HOST || 'localhost';
    const pgPort = process.env.POSTGRES_PORT || 5432;
    const pgDatabase = process.env.POSTGRES_DB || 'agentview';
    const pgUser = process.env.POSTGRES_USER || 'postgres';
    const pgPassword = process.env.POSTGRES_PASSWORD || 'postgres';
    
    logger.log(`Host: ${pgHost}`);
    logger.log(`Port: ${pgPort}`);
    logger.log(`Database: ${pgDatabase}`);
    logger.log(`User: ${pgUser}`);
    logger.log(`Password: ${pgPassword ? '********' : 'Not set'}`);
    
    // Wait for PostgreSQL to be fully ready (not just accepting connections but ready for queries)
    logger.log('Waiting for PostgreSQL database system to be fully ready...');
    let dbReady = false;
    let dbAttempts = 0;
    const maxDbAttempts = 30;
    
    while (!dbReady && dbAttempts < maxDbAttempts) {
      try {
        // Try a simple query to check if the database system is ready
        await execAsync('docker exec agentview-postgres psql -U postgres -c "SELECT 1;"');
        dbReady = true;
        logger.success('PostgreSQL database system is fully ready');
      } catch (error) {
        dbAttempts++;
        logger.log(`Waiting for database system to be fully ready... (${dbAttempts}/${maxDbAttempts})`);
        
        // If we see "the database system is starting up" message, we need to wait
        if (error.message && error.message.includes('the database system is starting up')) {
          logger.log('Database system is still starting up, waiting...');
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000)); // Longer wait between attempts
      }
    }
    
    if (!dbReady) {
      logger.error('PostgreSQL database system failed to become fully ready');
      return false;
    }
    
    // Check if database exists (Windows-compatible approach)
    try {
      // Use a SQL query to check if the database exists instead of grep
      const { stdout: dbExists } = await execAsync(`docker exec agentview-postgres psql -U postgres -t -c "SELECT COUNT(*) FROM pg_database WHERE datname = '${pgDatabase}'"`);
      if (parseInt(dbExists.trim(), 10) > 0) {
        logger.success(`Database '${pgDatabase}' exists`);
      } else {
        logger.warning(`Database '${pgDatabase}' does not exist, creating it...`);
        await execAsync(`docker exec agentview-postgres psql -U postgres -c "CREATE DATABASE ${pgDatabase};"`);
        logger.success(`Database '${pgDatabase}' created`);
      }
    } catch (error) {
      logger.error(`Failed to check or create database '${pgDatabase}'`, error);
      return false;
    }
    
    // Check if tables exist
    try {
      const { stdout: tableCount } = await execAsync(`docker exec agentview-postgres psql -U postgres -d ${pgDatabase} -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" -t`);
      const count = parseInt(tableCount.trim(), 10);
      
      if (count > 0) {
        logger.success(`Database has ${count} tables`);
      } else {
        logger.warning('Database has no tables, importing schema...');
        
        // Copy SQL files to container
        logger.log('Copying SQL files to container...');
        await execAsync('docker cp supabase-export/create_tables.sql agentview-postgres:/tmp/');
        await execAsync('docker cp supabase-export/create_auth_tables.sql agentview-postgres:/tmp/');
        await execAsync('docker cp supabase-export/insert_data.sql agentview-postgres:/tmp/');
        await execAsync('docker cp setup-db-permissions.sql agentview-postgres:/tmp/');
        
        // Import schema
        logger.log('Importing schema...');
        await execAsync(`docker exec agentview-postgres psql -U postgres -d ${pgDatabase} -f /tmp/create_tables.sql`);
        await execAsync(`docker exec agentview-postgres psql -U postgres -d ${pgDatabase} -f /tmp/create_auth_tables.sql`);
        
        // Import data
        logger.log('Importing data...');
        await execAsync(`docker exec agentview-postgres psql -U postgres -d ${pgDatabase} -f /tmp/insert_data.sql`);
        
        // Set up permissions
        logger.log('Setting up permissions...');
        await execAsync(`docker exec agentview-postgres psql -U postgres -d ${pgDatabase} -f /tmp/setup-db-permissions.sql`);
        
        logger.success('Database schema and data imported');
      }
    } catch (error) {
      logger.error('Failed to check or import database schema', error);
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Failed to check PostgreSQL connection', error);
    return false;
  }
}

// Run the application
async function runApplication() {
  return new Promise((resolve, reject) => {
    logger.section('Running the Application');
    
    // Set environment variables
    const env = {
      ...process.env,
      USE_POSTGRES: 'true',
      VITE_USE_POSTGRES: 'true',
    };
    
    // Run the application
    logger.log('Starting the application...');
    const app = spawn('node', ['run-fixed-postgres-docker.js'], {
      stdio: 'inherit',
      env,
    });
    
    // Handle application exit
    app.on('close', (code) => {
      if (code !== 0) {
        logger.error(`Application exited with code ${code}`);
        reject(new Error(`Application exited with code ${code}`));
        return;
      }
      
      logger.success('Application exited successfully');
      resolve();
    });
    
    // Handle application errors
    app.on('error', (error) => {
      logger.error('Application error', error);
      reject(error);
    });
  });
}

// Main function
async function main() {
  try {
    logger.section('PostgreSQL All-in-One Runner');
    
    // Create PostgreSQL environment file
    createPostgresEnvFile();
    
    // Check if Docker and Docker Compose are installed
    const dockerInstalled = await checkDocker();
    const dockerComposeInstalled = await checkDockerCompose();
    
    if (!dockerInstalled || !dockerComposeInstalled) {
      logger.error('Docker or Docker Compose is not installed');
      return;
    }
    
    // Start PostgreSQL in Docker
    const postgresStarted = await startPostgres();
    
    if (!postgresStarted) {
      logger.error('Failed to start PostgreSQL');
      return;
    }
    
    // Check if PostgreSQL is ready
    const postgresReady = await checkPostgresReady();
    
    if (!postgresReady) {
      logger.error('PostgreSQL is not ready');
      return;
    }
    
    // Run the application
    await runApplication();
    
    logger.section('Done');
  } catch (error) {
    logger.error('An error occurred', error);
  }
}

// Run the main function
main().catch((error) => {
  logger.error('Unhandled error', error);
  process.exit(1);
});
