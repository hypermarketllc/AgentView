/**
 * apply-missing-tables-final.js
 * This script applies the missing tables SQL script
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to SQL script
const sqlScriptPath = path.join(__dirname, 'create-missing-tables-final.sql');

console.log('=== Applying Missing Tables ===');
console.log('Reading SQL script...');

// Check if the SQL script exists
if (!fs.existsSync(sqlScriptPath)) {
  console.error('SQL script not found:', sqlScriptPath);
  process.exit(1);
}

// Get database connection details from environment variables
const dbHost = process.env.POSTGRES_HOST || 'localhost';
const dbPort = process.env.POSTGRES_PORT || '5432';
const dbName = process.env.POSTGRES_DB || 'agentview';
const dbUser = process.env.POSTGRES_USER || 'postgres';
const dbPassword = process.env.POSTGRES_PASSWORD || 'postgres';

// Build the psql command
const psqlCommand = `psql -h ${dbHost} -p ${dbPort} -d ${dbName} -U ${dbUser} -f "${sqlScriptPath}"`;

console.log('Executing SQL script...');
console.log('Command:', psqlCommand);

// Execute the psql command
exec(psqlCommand, { env: { ...process.env, PGPASSWORD: dbPassword } }, (error, stdout, stderr) => {
  if (error) {
    console.error('Error executing SQL script:', error);
    console.error(stderr);
    process.exit(1);
  }
  
  console.log('SQL script executed successfully!');
  console.log(stdout);
  
  console.log('Missing tables have been created and populated with sample data.');
});
