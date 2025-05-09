/**
 * run-fixed-auth-server.js
 * 
 * This script runs the server with the fixed authentication endpoints.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

const execPromise = promisify(exec);

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

// Check if the server-docker-auth.js file has the required endpoints
function checkAuthEndpoints() {
  logInfo('Checking auth endpoints in server-docker-auth.js...');
  
  try {
    const authFilePath = path.join(process.cwd(), 'server-docker-auth.js');
    
    if (!fs.existsSync(authFilePath)) {
      logError(`File not found: ${authFilePath}`);
      return false;
    }
    
    const authFileContent = fs.readFileSync(authFilePath, 'utf8');
    
    // Check if the login endpoint is defined
    if (!authFileContent.includes('app.post(\'/api/auth/login\'')) {
      logError('Login endpoint is not defined in server-docker-auth.js');
      return false;
    }
    
    // Check if the logout endpoint is defined
    if (!authFileContent.includes('app.post(\'/api/auth/logout\'')) {
      logError('Logout endpoint is not defined in server-docker-auth.js');
      return false;
    }
    
    // Check if the user endpoint is defined
    if (!authFileContent.includes('app.get(\'/api/auth/user\'')) {
      logError('User endpoint is not defined in server-docker-auth.js');
      return false;
    }
    
    logSuccess('All auth endpoints are defined in server-docker-auth.js');
    return true;
  } catch (error) {
    logError(`Error checking auth endpoints: ${error.message}`);
    return false;
  }
}

// Check if the AuthContext.tsx file has the required functions
function checkAuthContext() {
  logInfo('Checking auth context in src/contexts/AuthContext.tsx...');
  
  try {
    const authContextPath = path.join(process.cwd(), 'src', 'contexts', 'AuthContext.tsx');
    
    if (!fs.existsSync(authContextPath)) {
      logError(`File not found: ${authContextPath}`);
      return false;
    }
    
    const authContextContent = fs.readFileSync(authContextPath, 'utf8');
    
    // Check if the login function is fixed
    if (!authContextContent.includes('const response = await fetch(\'/api/auth/login\'')) {
      logError('Login function is not fixed in AuthContext.tsx');
      return false;
    }
    
    // Check if the logout function is fixed
    if (!authContextContent.includes('const response = await fetch(\'/api/auth/logout\'')) {
      logError('Logout function is not fixed in AuthContext.tsx');
      return false;
    }
    
    // Check if the getUser function is fixed
    if (!authContextContent.includes('const response = await fetch(\'/api/auth/user\'')) {
      logError('getUser function is not fixed in AuthContext.tsx');
      return false;
    }
    
    logSuccess('All auth functions are fixed in AuthContext.tsx');
    return true;
  } catch (error) {
    logError(`Error checking auth context: ${error.message}`);
    return false;
  }
}

// Run the server
async function runServer() {
  logInfo('Running the server...');
  
  try {
    // Check if the server is already running
    try {
      await execPromise('curl -s http://localhost:3000');
      logInfo('Server is already running on port 3000');
      return true;
    } catch (error) {
      // Server is not running, which is what we want
    }
    
    // Run the server
    const serverProcess = exec('node server-docker.js');
    
    // Log the server output
    serverProcess.stdout.on('data', (data) => {
      console.log(data);
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.error(data);
    });
    
    // Wait for the server to start
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Check if the server is running
    try {
      await execPromise('curl -s http://localhost:3000');
      logSuccess('Server is running on port 3000');
      return true;
    } catch (error) {
      logError('Server failed to start');
      return false;
    }
  } catch (error) {
    logError(`Error running server: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log(chalk.bold('=== Running Fixed Auth Server ==='));
  
  // Check if the auth endpoints are defined
  const authEndpointsOk = checkAuthEndpoints();
  
  // Check if the auth context is fixed
  const authContextOk = checkAuthContext();
  
  if (!authEndpointsOk || !authContextOk) {
    logError('Auth endpoints or context are not properly fixed');
    logInfo('Running fix-auth-endpoints.js to fix them...');
    
    try {
      await execPromise('node fix-auth-endpoints.js');
    } catch (error) {
      logError(`Error running fix-auth-endpoints.js: ${error.message}`);
      return;
    }
  }
  
  // Run the server
  const serverRunning = await runServer();
  
  if (serverRunning) {
    console.log(chalk.bold('\n=== Fixed Auth Server Running ==='));
    logInfo('The server is running with fixed authentication endpoints.');
    logInfo('You can now log in with:');
    logInfo('Email: agent@example.com');
    logInfo('Password: Agent123!');
    logInfo('Or:');
    logInfo('Email: admin@americancoveragecenter.com');
    logInfo('Password: Admin123!');
    logInfo('To stop the server, press Ctrl+C');
  } else {
    console.log(chalk.bold('\n=== Fixed Auth Server Failed to Start ==='));
    logError('The server failed to start.');
  }
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
