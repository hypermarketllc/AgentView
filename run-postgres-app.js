/**
 * Run PostgreSQL and Application
 * 
 * This script starts the PostgreSQL database in Docker and then runs the application
 * with the Supabase to PostgreSQL adapter.
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Create a .env.postgres file if it doesn't exist
function createPostgresEnvFile() {
  const envPostgresPath = path.join(__dirname, '.env.postgres');
  
  if (!fs.existsSync(envPostgresPath)) {
    console.log('Creating .env.postgres file...');
    
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
`;
    
    fs.writeFileSync(envPostgresPath, envContent.trim());
    console.log('✅ .env.postgres file created');
  }
  
  // Copy .env.postgres to .env
  console.log('Copying .env.postgres to .env...');
  fs.copyFileSync(envPostgresPath, path.join(__dirname, '.env'));
  console.log('✅ .env file updated');
}

// Check if Docker is installed
function checkDocker() {
  return new Promise((resolve, reject) => {
    exec('docker --version', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Docker is not installed or not in PATH');
        console.error('Please install Docker from https://www.docker.com/products/docker-desktop');
        reject(error);
        return;
      }
      
      console.log(`✅ Docker is installed: ${stdout.trim()}`);
      resolve();
    });
  });
}

// Check if Docker Compose is installed
function checkDockerCompose() {
  return new Promise((resolve, reject) => {
    exec('docker-compose --version', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Docker Compose is not installed or not in PATH');
        console.error('Please install Docker Compose from https://docs.docker.com/compose/install/');
        reject(error);
        return;
      }
      
      console.log(`✅ Docker Compose is installed: ${stdout.trim()}`);
      resolve();
    });
  });
}

// Start PostgreSQL in Docker
function startPostgres() {
  return new Promise((resolve, reject) => {
    console.log('Starting PostgreSQL in Docker...');
    
    const dockerCompose = spawn('docker-compose', ['-f', 'docker-compose.postgres.yml', 'up', '-d'], {
      stdio: 'inherit',
    });
    
    dockerCompose.on('close', (code) => {
      if (code !== 0) {
        console.error(`❌ Docker Compose exited with code ${code}`);
        reject(new Error(`Docker Compose exited with code ${code}`));
        return;
      }
      
      console.log('✅ PostgreSQL started in Docker');
      
      // Wait for PostgreSQL to be ready
      console.log('Waiting for PostgreSQL to be ready...');
      setTimeout(() => {
        resolve();
      }, 5000);
    });
  });
}

// Check if PostgreSQL is ready
function checkPostgresReady() {
  return new Promise((resolve, reject) => {
    console.log('Checking if PostgreSQL is ready...');
    
    const dockerExec = spawn('docker', ['exec', 'agentview-postgres', 'pg_isready', '-U', 'postgres'], {
      stdio: 'pipe',
    });
    
    let output = '';
    
    dockerExec.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    dockerExec.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    dockerExec.on('close', (code) => {
      if (code !== 0) {
        console.error(`❌ PostgreSQL is not ready: ${output}`);
        reject(new Error(`PostgreSQL is not ready: ${output}`));
        return;
      }
      
      console.log('✅ PostgreSQL is ready');
      resolve();
    });
  });
}

// Run the application
function runApplication() {
  return new Promise((resolve, reject) => {
    console.log('Running the application...');
    
    const app = spawn('node', ['run-fixed-postgres-docker.js'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        USE_POSTGRES: 'true',
        VITE_USE_POSTGRES: 'true',
      },
    });
    
    app.on('close', (code) => {
      if (code !== 0) {
        console.error(`❌ Application exited with code ${code}`);
        reject(new Error(`Application exited with code ${code}`));
        return;
      }
      
      console.log('✅ Application exited successfully');
      resolve();
    });
  });
}

// Main function
async function main() {
  try {
    console.log('=== Starting PostgreSQL and Application ===');
    
    // Create PostgreSQL environment file
    createPostgresEnvFile();
    
    // Check if Docker and Docker Compose are installed
    await checkDocker();
    await checkDockerCompose();
    
    // Start PostgreSQL in Docker
    await startPostgres();
    
    // Check if PostgreSQL is ready
    await checkPostgresReady();
    
    // Run the application
    await runApplication();
    
    console.log('=== Done ===');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();
