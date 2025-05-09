// Patch for path-to-regexp to handle errors gracefully
const pathToRegexp = require('path-to-regexp');
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

console.log('✅ path-to-regexp patch applied');
