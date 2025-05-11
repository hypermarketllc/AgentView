/**
 * fix-server-routes.js
 * This script fixes the syntax errors in the server-docker-routes.js file.
 */

import fs from 'fs';
import path from 'path';

// Path to the server routes file
const routesPath = 'server-docker-routes.js';

// Check if the file exists
if (!fs.existsSync(routesPath)) {
  console.error(`Server routes file not found at ${routesPath}`);
  process.exit(1);
}

// Read the original file
console.log(`Reading ${routesPath}...`);
const originalContent = fs.readFileSync(routesPath, 'utf8');

// Create a backup
const backupPath = `${routesPath}.backup`;
console.log(`Creating backup at ${backupPath}...`);
fs.writeFileSync(backupPath, originalContent);

// Fix the file content
console.log('Fixing server routes file...');

// Create a clean version of the file
let cleanContent = '';

// Extract the initial part of the file (imports and setupApiRoutes function)
const initialPart = originalContent.substring(0, originalContent.indexOf('// Setup deals routes'));
cleanContent += initialPart;

// Extract and clean up each route setup function
const routeFunctions = [
  extractFunction(originalContent, 'setupDealsRoutes'),
  extractFunction(originalContent, 'setupCarriersRoutes'),
  extractFunction(originalContent, 'setupProductsRoutes'),
  extractFunction(originalContent, 'setupPositionsRoutes'),
  extractFunction(originalContent, 'setupUserSettingsRoutes'),
  cleanupSystemHealthChecksRoutes(originalContent),
  cleanupSettingsRoutes(originalContent),
  cleanupUserAccsRoutes(originalContent)
];

// Add all cleaned route functions to the content
cleanContent += routeFunctions.join('\n\n');

// Add the export statement
cleanContent += '\n\n// Export API routes setup function\nexport { setupApiRoutes };';

// Write the fixed content back to the file
console.log('Writing fixed content back to the file...');
fs.writeFileSync(routesPath, cleanContent);

console.log('Server routes file fixed successfully.');

// Function to extract a function from the original content
function extractFunction(content, functionName) {
  const startMarker = `function ${functionName}`;
  const startIndex = content.indexOf(startMarker);
  
  if (startIndex === -1) {
    console.error(`Function ${functionName} not found in the file.`);
    return '';
  }
  
  // Find the end of the function (the next function definition or the end of the file)
  let endIndex = content.length;
  const nextFunctionIndex = content.indexOf('function ', startIndex + startMarker.length);
  
  if (nextFunctionIndex !== -1) {
    endIndex = nextFunctionIndex;
  }
  
  return content.substring(startIndex, endIndex).trim();
}

// Function to clean up the system health checks routes function
function cleanupSystemHealthChecksRoutes(content) {
  // Extract the function definition
  const functionName = 'setupSystemHealthChecksRoutes';
  const startMarker = `function ${functionName}`;
  const startIndex = content.indexOf(startMarker);
  
  if (startIndex === -1) {
    console.error(`Function ${functionName} not found in the file.`);
    return '';
  }
  
  // Get the function signature and opening brace
  const signatureEndIndex = content.indexOf('{', startIndex) + 1;
  const functionSignature = content.substring(startIndex, signatureEndIndex);
  
  // Extract the CRM endpoints
  const crmEndpoints = extractBlock(content, 
    '// Get system health checks - CRM endpoint', 
    '// Standard API endpoints for system health checks');
  
  // Extract the standard API endpoints
  const standardEndpoints = extractBlock(content,
    '// Standard API endpoints for system health checks',
    '// Setup settings routes');
  
  // Combine into a clean function
  return `${functionSignature}
  // CRM API endpoints for system health checks
${crmEndpoints}
  
  // Standard API endpoints for system health checks
${standardEndpoints}
}`;
}

// Function to clean up the settings routes function
function cleanupSettingsRoutes(content) {
  // Extract the function definition
  const functionName = 'setupSettingsRoutes';
  const startMarker = `function ${functionName}`;
  const startIndex = content.indexOf(startMarker);
  
  if (startIndex === -1) {
    console.error(`Function ${functionName} not found in the file.`);
    return '';
  }
  
  // Get the function signature and opening brace
  const signatureEndIndex = content.indexOf('{', startIndex) + 1;
  const functionSignature = content.substring(startIndex, signatureEndIndex);
  
  // Extract the CRM endpoints
  const crmEndpoints = extractBlock(content, 
    '// Get system settings - CRM endpoint', 
    '// Standard API endpoints for settings');
  
  // Extract the standard API endpoints
  const standardEndpoints = extractBlock(content,
    '// Standard API endpoints for settings',
    '// Setup user accounts routes');
  
  // Combine into a clean function
  return `${functionSignature}
  // CRM API endpoints for settings
${crmEndpoints}
  
  // Standard API endpoints for settings
${standardEndpoints}
}`;
}

// Function to clean up the user accounts routes function
function cleanupUserAccsRoutes(content) {
  // Extract the function definition
  const functionName = 'setupUserAccsRoutes';
  const startMarker = `function ${functionName}`;
  const startIndex = content.indexOf(startMarker);
  
  if (startIndex === -1) {
    console.error(`Function ${functionName} not found in the file.`);
    return '';
  }
  
  // Get the function signature and opening brace
  const signatureEndIndex = content.indexOf('{', startIndex) + 1;
  const functionSignature = content.substring(startIndex, signatureEndIndex);
  
  // Find the last occurrence of the function
  const lastStartIndex = content.lastIndexOf(startMarker);
  
  // Extract the function body from the last occurrence
  const functionBodyStartIndex = content.indexOf('{', lastStartIndex) + 1;
  const functionBodyEndIndex = findMatchingBrace(content, functionBodyStartIndex);
  
  if (functionBodyEndIndex === -1) {
    console.error(`Could not find the end of function ${functionName}.`);
    return '';
  }
  
  const functionBody = content.substring(functionBodyStartIndex, functionBodyEndIndex);
  
  // Combine into a clean function
  return `${functionSignature}${functionBody}
}`;
}

// Function to extract a block of code between two markers
function extractBlock(content, startMarker, endMarker) {
  const startIndex = content.indexOf(startMarker);
  
  if (startIndex === -1) {
    console.error(`Marker "${startMarker}" not found in the file.`);
    return '';
  }
  
  const endIndex = content.indexOf(endMarker, startIndex);
  
  if (endIndex === -1) {
    console.error(`Marker "${endMarker}" not found after "${startMarker}" in the file.`);
    return '';
  }
  
  return content.substring(startIndex, endIndex).trim();
}

// Function to find the matching closing brace for an opening brace
function findMatchingBrace(content, openBraceIndex) {
  let braceCount = 1;
  let currentIndex = openBraceIndex;
  
  while (braceCount > 0 && currentIndex < content.length) {
    currentIndex++;
    
    if (content[currentIndex] === '{') {
      braceCount++;
    } else if (content[currentIndex] === '}') {
      braceCount--;
    }
  }
  
  return braceCount === 0 ? currentIndex : -1;
}
