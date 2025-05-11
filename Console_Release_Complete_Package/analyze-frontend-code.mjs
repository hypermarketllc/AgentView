/**
 * Script to analyze frontend code structure
 * This script helps identify the auth provider and API client in the frontend code
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the frontend dist directory
const distPath = path.join(__dirname, '..', 'dist');

// Function to find all JavaScript files in the dist directory
function findJsFiles(dir) {
  const files = fs.readdirSync(dir);
  const jsFiles = [];
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      jsFiles.push(...findJsFiles(filePath));
    } else if (file.endsWith('.js')) {
      jsFiles.push(filePath);
    }
  }
  
  return jsFiles;
}

// Function to search for auth-related code in JavaScript files
function searchAuthCode(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Search for auth-related patterns
  const authPatterns = [
    { name: 'Auth Provider', pattern: /AuthProvider|AuthContext|useAuth/ },
    { name: 'Token Storage', pattern: /localStorage\.setItem\(['"]auth_token|localStorage\.getItem\(['"]auth_token/ },
    { name: 'API Client', pattern: /axios\.create|fetch\(|supabase|createClient/ },
    { name: 'Authorization Header', pattern: /headers\s*:\s*\{[^}]*Authorization/ },
    { name: 'Login Function', pattern: /login\s*\([^)]*\)\s*\{|signIn\s*\([^)]*\)\s*\{/ },
    { name: 'JWT Token', pattern: /jwt|token|Bearer/ }
  ];
  
  const results = {};
  
  for (const { name, pattern } of authPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      // Get some context around the match
      const matchIndex = content.indexOf(matches[0]);
      const start = Math.max(0, matchIndex - 100);
      const end = Math.min(content.length, matchIndex + matches[0].length + 100);
      const context = content.substring(start, end);
      
      results[name] = {
        found: true,
        count: matches.length,
        sample: context
      };
    } else {
      results[name] = { found: false };
    }
  }
  
  return results;
}

// Main function to analyze frontend code
async function analyzeFrontendCode() {
  console.log('=== Frontend Code Analysis ===');
  
  try {
    // Check if dist directory exists
    if (!fs.existsSync(distPath)) {
      console.error(`Dist directory not found at: ${distPath}`);
      return;
    }
    
    // Find all JavaScript files
    const jsFiles = findJsFiles(distPath);
    console.log(`Found ${jsFiles.length} JavaScript files`);
    
    // Analyze each file for auth-related code
    const authResults = {};
    
    for (const filePath of jsFiles) {
      const relativePath = path.relative(distPath, filePath);
      console.log(`Analyzing: ${relativePath}`);
      
      const results = searchAuthCode(filePath);
      
      // Only store results if we found something
      let foundSomething = false;
      for (const key in results) {
        if (results[key].found) {
          foundSomething = true;
          break;
        }
      }
      
      if (foundSomething) {
        authResults[relativePath] = results;
      }
    }
    
    // Print summary of findings
    console.log('\n=== Auth-Related Code Summary ===');
    
    for (const filePath in authResults) {
      console.log(`\nFile: ${filePath}`);
      const results = authResults[filePath];
      
      for (const key in results) {
        if (results[key].found) {
          console.log(`- ${key}: Found ${results[key].count} matches`);
          console.log(`  Sample: ${results[key].sample.trim().substring(0, 100)}...`);
        }
      }
    }
    
    console.log('\n=== Analysis Complete ===');
  } catch (error) {
    console.error('Error analyzing frontend code:', error);
  }
}

// Run the analysis
analyzeFrontendCode()
  .then(() => {
    console.log('Frontend code analysis completed');
  })
  .catch(error => {
    console.error('Frontend code analysis failed:', error);
  });
