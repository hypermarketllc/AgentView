// Script to find problematic routes in the application
const fs = require('fs');
const path = require('path');
const pathToRegexp = require('path-to-regexp');

// Apply the patch to prevent crashes
const originalParse = pathToRegexp.parse;
pathToRegexp.parse = function(path, options = {}) {
  try {
    return originalParse(path, options);
  } catch (error) {
    console.error(`❌ Invalid route pattern: "${path}" - ${error.message}`);
    return null;
  }
};

// Function to recursively search for files
function findFiles(dir, pattern, callback) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findFiles(filePath, pattern, callback);
    } else if (pattern.test(file)) {
      callback(filePath);
    }
  });
}

// Function to extract potential routes from a file
function extractRoutes(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const routes = [];
    
    // Look for app.get, app.post, etc. patterns
    const expressRouteRegex = /app\.(get|post|put|delete|patch|all)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;
    
    while ((match = expressRouteRegex.exec(content)) !== null) {
      routes.push({
        method: match[1],
        path: match[2],
        file: filePath,
        line: content.substring(0, match.index).split('\n').length
      });
    }
    
    // Look for router.get, router.post, etc. patterns
    const routerRouteRegex = /router\.(get|post|put|delete|patch|all)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    
    while ((match = routerRouteRegex.exec(content)) !== null) {
      routes.push({
        method: match[1],
        path: match[2],
        file: filePath,
        line: content.substring(0, match.index).split('\n').length
      });
    }
    
    // Look for express.Router() routes
    const routerDefRegex = /\.route\s*\(\s*['"`]([^'"`]+)['"`]/g;
    
    while ((match = routerDefRegex.exec(content)) !== null) {
      routes.push({
        method: 'route',
        path: match[1],
        file: filePath,
        line: content.substring(0, match.index).split('\n').length
      });
    }
    
    return routes;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return [];
  }
}

// Function to test a route pattern
function testRoute(route) {
  try {
    const tokens = pathToRegexp.parse(route.path);
    if (tokens === null) {
      return false;
    }
    pathToRegexp(route.path);
    return true;
  } catch (error) {
    console.error(`❌ Error in route "${route.path}" (${route.file}:${route.line}): ${error.message}`);
    return false;
  }
}

// Main function
function findProblematicRoutes() {
  console.log('Searching for route definitions...');
  
  const routes = [];
  
  // Find all JavaScript and TypeScript files
  findFiles('.', /\.(js|ts|jsx|tsx)$/, (filePath) => {
    // Skip node_modules
    if (filePath.includes('node_modules')) {
      return;
    }
    
    const fileRoutes = extractRoutes(filePath);
    routes.push(...fileRoutes);
  });
  
  console.log(`Found ${routes.length} routes. Testing for errors...`);
  
  const problematicRoutes = [];
  
  // Test each route
  routes.forEach(route => {
    if (!testRoute(route)) {
      problematicRoutes.push(route);
    }
  });
  
  if (problematicRoutes.length === 0) {
    console.log('✅ No problematic routes found.');
  } else {
    console.log(`❌ Found ${problematicRoutes.length} problematic routes:`);
    problematicRoutes.forEach(route => {
      console.log(`- ${route.method.toUpperCase()} ${route.path} (${route.file}:${route.line})`);
    });
  }
}

// Run the script
findProblematicRoutes();
