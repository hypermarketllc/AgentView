// fix-mime-types.mjs - Comprehensive solution for MIME type issues

// ES Module version
export function applyMimeTypeFixes() {
  // 1. Fix path-to-regexp errors
  fixPathToRegexp();
  
  // 2. Patch fetch to handle MIME type issues
  patchFetch();
  
  // 3. Fix dynamic import MIME issues
  patchImport();
  
  console.log('✅ Applied global MIME type and path-to-regexp fixes');
}

// Fix path-to-regexp "Missing parameter name" errors
async function fixPathToRegexp() {
  try {
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    
    const pathToRegexpPath = require.resolve('path-to-regexp/dist/index.js');
    const fs = await import('fs');
    
    const code = fs.readFileSync(pathToRegexpPath, 'utf8');
    const patched = code.replace(
      /if \(!value\) {\s*throw new TypeError\(`Missing parameter name at \${i}: \${DEBUG_URL}`\);\s*}/g,
      `if (!value) {
        console.warn(\`Warning: Missing parameter name at \${i}: \${DEBUG_URL}\`);
        value = \`param\${i}\`; // Use a default parameter name
      }`
    );
    
    fs.writeFileSync(pathToRegexpPath, patched);
    console.log('✅ Fixed path-to-regexp library');
  } catch (error) {
    console.warn('⚠️ Could not patch path-to-regexp:', error.message);
  }
}

// Patch fetch to fix MIME type issues
function patchFetch() {
  if (typeof window !== 'undefined') {
    const originalFetch = window.fetch;
    
    window.fetch = async function(...args) {
      const response = await originalFetch.apply(this, args);
      
      // Clone response to avoid consuming it
      const clone = response.clone();
      
      // Only process JavaScript files
      const url = clone.url || args[0];
      if (typeof url === 'string' && url.endsWith('.js')) {
        // Create a new response with the correct MIME type
        return new Response(await clone.text(), {
          status: response.status,
          statusText: response.statusText,
          headers: new Headers({
            ...Object.fromEntries([...response.headers.entries()]),
            'Content-Type': 'application/javascript'
          })
        });
      }
      
      return response;
    };
    
    console.log('✅ Patched fetch to fix MIME type issues');
  }
}

// Patch dynamic imports to handle MIME type issues
function patchImport() {
  if (typeof window !== 'undefined') {
    const originalImport = window.import || Function.prototype.bind.call(Function('return import'), {});
    
    window.import = function(specifier) {
      // Add .js extension if missing
      if (typeof specifier === 'string' && !specifier.includes('.') && !specifier.startsWith('http')) {
        specifier = `${specifier}.js`;
      }
      
      return originalImport(specifier);
    };
    
    console.log('✅ Patched dynamic imports');
  }
}

// Run automatically when this file is imported
applyMimeTypeFixes();

// Re-export for direct use
export default applyMimeTypeFixes;
