/**
 * apply-robust-patch.js
 * 
 * Script to apply the robust patch to server files
 * This script updates the server-docker-db.js and server-docker-static.js files
 * to use the utilities from robust-patch.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files to patch
const filesToPatch = [
  'server-docker-db.js',
  'server-docker-static.js',
  'server-docker-core.js'
];

/**
 * Updates the server-docker-db.js file to use the robust patch utilities
 */
function patchDatabaseFile() {
  const filePath = path.join(__dirname, 'server-docker-db.js');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add import for robust-patch.js
  if (!content.includes('import robustPatch')) {
    content = content.replace(
      'import pg from \'pg\';',
      'import pg from \'pg\';\nimport robustPatch, { uuidUtils, envUtils, dbUtils } from \'./robust-patch.js\';'
    );
  }
  
  // Update the PostgreSQL connection to use envUtils
  if (content.includes('const pool = new Pool({')) {
    content = content.replace(
      /const pool = new Pool\(\{[\s\S]*?\}\);/,
      'const pool = new Pool(envUtils.getDatabaseConfig());'
    );
  }
  
  // Update the insertDefaultData function to use uuidUtils for UUID validation
  if (content.includes('INSERT INTO carriers (id, name) VALUES')) {
    content = content.replace(
      /await pool\.query\(`\s*INSERT INTO carriers \(id, name\) VALUES[\s\S]*?\);/,
      `// Insert default carriers with valid UUIDs
      await dbUtils.safeQuery(pool, \`
        INSERT INTO carriers (id, name) VALUES
        ('\${uuidUtils.safe("c1d2e3f4-a1b2-c3d4-e5f6-a1b2c3d4e5f6")}', 'Carrier A'),
        ('\${uuidUtils.safe("d2e3f4f5-b2c3-d4e5-f6f7-b2c3d4e5f6f7")}', 'Carrier B'),
        ('\${uuidUtils.safe("e3f4f5f6-c3d4-e5f6-f7f8-c3d4e5f6f7f8")}', 'Carrier C')
      \`);`
    );
  }
  
  // Update the insertDefaultData function to use uuidUtils for UUID validation
  if (content.includes('INSERT INTO products (id, name, carrier_id) VALUES')) {
    content = content.replace(
      /await pool\.query\(`\s*INSERT INTO products \(id, name, carrier_id\) VALUES[\s\S]*?\);/,
      `// Insert default products with valid UUIDs
      await dbUtils.safeQuery(pool, \`
        INSERT INTO products (id, name, carrier_id) VALUES
        ('\${uuidUtils.safe("f4f5f6f7-d4e5-f6f7-f8f9-d4e5f6f7f8f9")}', 'Product A1', '\${uuidUtils.safe("c1d2e3f4-a1b2-c3d4-e5f6-a1b2c3d4e5f6")}'),
        ('\${uuidUtils.safe("f5f6f7f8-e5f6-f7f8-f9f0-e5f6f7f8f9f0")}', 'Product A2', '\${uuidUtils.safe("c1d2e3f4-a1b2-c3d4-e5f6-a1b2c3d4e5f6")}'),
        ('\${uuidUtils.safe("f6f7f8f9-f6f7-f8f9-f0f1-f6f7f8f9f0f1")}', 'Product B1', '\${uuidUtils.safe("d2e3f4f5-b2c3-d4e5-f6f7-b2c3d4e5f6f7")}'),
        ('\${uuidUtils.safe("f7f8f9f0-f7f8-f9f0-f1f2-f7f8f9f0f1f2")}', 'Product C1', '\${uuidUtils.safe("e3f4f5f6-c3d4-e5f6-f7f8-c3d4e5f6f7f8")}')
      \`);`
    );
  }
  
  // Update the testConnection function to use dbUtils
  if (content.includes('async function initializeDatabase(pool)')) {
    content = content.replace(
      /async function initializeDatabase\(pool\) \{[\s\S]*?try \{[\s\S]*?\/\/ Test connection[\s\S]*?const res = await pool\.query\('SELECT NOW\(\)'\);[\s\S]*?console\.log\('Database connected:', res\.rows\[0\]\);/,
      `async function initializeDatabase(pool) {
  try {
    // Test connection
    const connected = await dbUtils.testConnection(pool);
    if (!connected) {
      throw new Error('Database connection failed');
    }`
    );
  }
  
  // Write the updated content back to the file
  fs.writeFileSync(filePath, content);
  console.log('✅ Patched server-docker-db.js');
}

/**
 * Updates the server-docker-static.js file to use the robust patch utilities
 */
function patchStaticFile() {
  const filePath = path.join(__dirname, 'server-docker-static.js');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add import for robust-patch.js
  if (!content.includes('import robustPatch')) {
    content = content.replace(
      'import express from \'express\';',
      'import express from \'express\';\nimport robustPatch, { mimeTypes, getMimeType, fsUtils } from \'./robust-patch.js\';'
    );
  }
  
  // Replace the mimeTypes object with the one from robust-patch.js
  if (content.includes('const mimeTypes = {')) {
    content = content.replace(
      /const mimeTypes = \{[\s\S]*?\};/,
      '// Using mimeTypes from robust-patch.js'
    );
  }
  
  // Replace the getMimeType function with the one from robust-patch.js
  if (content.includes('function getMimeType(filePath)')) {
    content = content.replace(
      /function getMimeType\(filePath\) \{[\s\S]*?\}/,
      '// Using getMimeType from robust-patch.js'
    );
  }
  
  // Update the file reading to use fsUtils
  if (content.includes('fs.readFileSync(filePath, \'utf8\')')) {
    content = content.replace(
      /const content = fs\.readFileSync\(filePath, 'utf8'\);/g,
      'const content = fsUtils.safeReadFile(filePath);'
    );
  }
  
  // Write the updated content back to the file
  fs.writeFileSync(filePath, content);
  console.log('✅ Patched server-docker-static.js');
}

/**
 * Updates the server-docker-core.js file to use the robust patch utilities
 */
function patchCoreFile() {
  const filePath = path.join(__dirname, 'server-docker-core.js');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add import for robust-patch.js
  if (!content.includes('import robustPatch')) {
    content = content.replace(
      'import express from \'express\';',
      'import express from \'express\';\nimport robustPatch, { errorUtils, fsUtils } from \'./robust-patch.js\';'
    );
  }
  
  // Update the file reading to use fsUtils
  if (content.includes('fs.readFileSync(indexPath, \'utf8\')')) {
    content = content.replace(
      /indexHtml = fs\.readFileSync\(indexPath, 'utf8'\);/,
      'indexHtml = fsUtils.safeReadFile(indexPath) || \'<!DOCTYPE html><html><body><h1>Error loading application</h1></body></html>\';'
    );
  }
  
  // Write the updated content back to the file
  fs.writeFileSync(filePath, content);
  console.log('✅ Patched server-docker-core.js');
}

/**
 * Main function to apply the patch
 */
function applyPatch() {
  console.log('🔧 Applying robust patch to server files...');
  
  try {
    // Patch the database file
    patchDatabaseFile();
    
    // Patch the static file
    patchStaticFile();
    
    // Patch the core file
    patchCoreFile();
    
    console.log('✅ All files patched successfully!');
    console.log('🚀 You can now run the server with:');
    console.log('  - npm run modular-server');
    console.log('  - or ./run-modular-server.sh');
    console.log('  - or run-modular-server.bat');
  } catch (err) {
    console.error('❌ Error applying patch:', err);
    process.exit(1);
  }
}

// Run the patch
applyPatch();
