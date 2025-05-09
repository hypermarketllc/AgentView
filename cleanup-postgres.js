/**
 * PostgreSQL Cleanup Script
 * 
 * This script stops and removes the PostgreSQL container and volume.
 * It works on both Windows and Unix-like systems without requiring
 * separate .bat and .sh files.
 * 
 * Usage: node cleanup-postgres.js
 */

import { exec } from 'child_process';
import readline from 'readline';

console.log('PostgreSQL Cleanup Script');
console.log('=========================');
console.log('This script will stop and remove the PostgreSQL container and volume.');
console.log('All data will be lost!');
console.log('');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ask for confirmation
rl.question('Are you sure you want to continue? (y/n): ', (answer) => {
  if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
    console.log('Operation cancelled.');
    rl.close();
    return;
  }
  
  console.log('');
  console.log('Stopping PostgreSQL container...');
  
  // Stop container
  exec('docker stop agentview-postgres', (error, stdout, stderr) => {
    if (error) {
      console.log('Container not running or already stopped.');
    } else {
      console.log('Container stopped.');
    }
    
    console.log('Removing PostgreSQL container...');
    
    // Remove container
    exec('docker rm agentview-postgres', (error, stdout, stderr) => {
      if (error) {
        console.log('Failed to remove container or container does not exist.');
      } else {
        console.log('Container removed.');
      }
      
      console.log('Removing PostgreSQL volume...');
      
      // Remove volume
      exec('docker volume rm agentview_postgres-data', (error, stdout, stderr) => {
        if (error) {
          console.log('Failed to remove volume or volume does not exist.');
        } else {
          console.log('Volume removed.');
        }
        
        console.log('');
        console.log('Cleanup complete!');
        console.log('You can now run "node run-postgres.js" to start fresh.');
        
        // Keep the console open on Windows
        if (process.platform === 'win32') {
          console.log('');
          console.log('Press any key to exit...');
          
          process.stdin.setRawMode(true);
          process.stdin.resume();
          process.stdin.on('data', () => {
            process.exit(0);
          });
        } else {
          rl.close();
        }
      });
    });
  });
});
