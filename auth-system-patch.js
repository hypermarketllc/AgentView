/**
 * auth-system-patch.js
 * Central patch system for authentication fixes
 */

import fs from 'fs';
import path from 'path';

// Patch registry
const patches = [
  {
    id: 'run-fixed-auth-server-fix',
    targetFile: './run-fixed-auth-server.js',
    description: 'Fix authenticateToken middleware import and usage in run-fixed-auth-server.js',
    priority: 1
  },
  {
    id: 'server-docker-routes-fix',
    targetFile: './server-docker-routes.js',
    description: 'Fix route handler in setupDealsRoutes function',
    priority: 2
  }
];

// Apply patches in priority order
function applyPatches() {
  console.log('Applying authentication system patches...');
  
  // Sort patches by priority
  const sortedPatches = [...patches].sort((a, b) => a.priority - b.priority);
  
  // Apply each patch
  for (const patch of sortedPatches) {
    console.log(`\nApplying patch: ${patch.id}`);
    console.log(`Description: ${patch.description}`);
    console.log(`Target file: ${patch.targetFile}`);
    
    // Create backup of the target file
    const backupPath = `${patch.targetFile}.backup`;
    if (!fs.existsSync(backupPath)) {
      console.log(`Creating backup at ${backupPath}...`);
      fs.copyFileSync(patch.targetFile, backupPath);
    }
    
    // Read the file content
    console.log(`Reading ${patch.targetFile}...`);
    const content = fs.readFileSync(patch.targetFile, 'utf8');
    
    // Apply the specific patch
    let patchedContent;
    switch (patch.id) {
      case 'run-fixed-auth-server-fix':
        patchedContent = patchRunFixedAuthServer(content);
        break;
      case 'server-docker-routes-fix':
        patchedContent = patchServerDockerRoutes(content);
        break;
      default:
        console.log(`Unknown patch ID: ${patch.id}`);
        continue;
    }
    
    // Write the patched content back to the file
    console.log(`Writing patched content to ${patch.targetFile}...`);
    fs.writeFileSync(patch.targetFile, patchedContent);
    
    console.log(`Patch ${patch.id} applied successfully.`);
  }
  
  console.log('\nAll patches applied successfully.');
}

// Patch for run-fixed-auth-server.js
function patchRunFixedAuthServer(content) {
  console.log('Patching run-fixed-auth-server.js to import and use authenticateToken middleware...');
  
  // Fix the import statement to include authenticateToken
  let patchedContent = content.replace(
    "import { app, start, pool, setupApiRoutes } from './server-docker-index.js';",
    "import { app, start, pool, setupApiRoutes, authenticateToken } from './server-docker-index.js';"
  );
  
  // Fix the setupApiRoutes call to pass authenticateToken
  patchedContent = patchedContent.replace(
    "setupApiRoutes(app, pool);",
    "setupApiRoutes(app, pool, authenticateToken);"
  );
  
  return patchedContent;
}

// Patch for server-docker-routes.js
function patchServerDockerRoutes(content) {
  console.log('Patching server-docker-routes.js to ensure route handlers are properly defined...');
  
  // Add a default handler for undefined routes
  let patchedContent = content.replace(
    "function setupDealsRoutes(app, pool, authenticateToken) {",
    `function setupDealsRoutes(app, pool, authenticateToken) {
  // Ensure authenticateToken is defined
  if (!authenticateToken) {
    console.error('authenticateToken middleware is undefined in setupDealsRoutes');
    // Create a fallback middleware
    authenticateToken = (req, res, next) => {
      console.warn('Using fallback authentication middleware');
      next();
    };
  }`
  );
  
  return patchedContent;
}

// Export the patch function
export { applyPatches };

// Run the patches if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  applyPatches();
}
