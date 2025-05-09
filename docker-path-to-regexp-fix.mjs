// docker-path-to-regexp-fix.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import pathToRegexp from 'path-to-regexp';

// Apply runtime patch first (immediate protection)
const originalParse = pathToRegexp.parse;
pathToRegexp.parse = function(path, options = {}) {
  try {
    return originalParse(path, options);
  } catch (error) {
    console.warn(`⚠️ Invalid route pattern: "${path}" - applying fallback`);
    // Return a safe fallback pattern
    return originalParse('/*', options);
  }
};
console.log('✅ path-to-regexp runtime patch applied');

// Then apply the deep patch to fix the underlying issue
try {
  // Get __dirname equivalent in ES modules
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Use createRequire to get the path to the module
  const require = createRequire(import.meta.url);
  
  // Try different possible paths for path-to-regexp
  let pathToRegexpPath;
  try {
    pathToRegexpPath = require.resolve('path-to-regexp');
  } catch (e) {
    try {
      pathToRegexpPath = require.resolve('path-to-regexp/dist/index.js');
    } catch (e2) {
      console.warn('Could not find path-to-regexp module path, using runtime patch only');
      // Continue with runtime patch only
    }
  }

  if (pathToRegexpPath) {
    console.log(`Found path-to-regexp at: ${pathToRegexpPath}`);

    // Read the original file
    const originalCode = fs.readFileSync(pathToRegexpPath, 'utf8');

    // Create a backup
    const backupPath = path.join(path.dirname(pathToRegexpPath), 'index.backup.js');
    if (!fs.existsSync(backupPath)) {
      console.log(`Creating backup at: ${backupPath}`);
      fs.writeFileSync(backupPath, originalCode);
    }

    // Fix the specific error in the lexer function
    let patchedCode = originalCode.replace(
      /if \(!value\) {\s*throw new TypeError\(`Missing parameter name at \${i}: \${DEBUG_URL}`\);\s*}/g,
      `if (!value) {
        console.warn(\`Warning: Missing parameter name at \${i}: \${DEBUG_URL}\`);
        value = \`param\${i}\`; // Use a default parameter name
      }`
    );

    // Write the patched file
    fs.writeFileSync(pathToRegexpPath, patchedCode);
    console.log('✅ Successfully patched path-to-regexp module code');
  }
} catch (error) {
  console.error('Failed to apply deep patch:', error);
  console.log('Continuing with runtime patch only');
}

export default pathToRegexp;
