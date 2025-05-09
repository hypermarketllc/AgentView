/**
 * Find Supabase References
 * 
 * This script searches the codebase for references to Supabase
 * to help identify any remaining dependencies that need to be migrated.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories to search
const searchDirs = ['src', 'public'];

// Directories to exclude
const excludeDirs = ['node_modules', 'dist', 'build', '.git'];

// File extensions to search
const searchExtensions = ['.ts', '.tsx', '.js', '.jsx', '.html', '.css', '.json'];

// Patterns to search for
const patterns = [
  'supabase',
  'createClient',
  '@supabase',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'rpc(',
  'storage.from',
  'auth.signIn',
  'auth.signOut',
  'auth.getUser',
  'auth.onAuthStateChange'
];

// Results object
const results = {
  files: 0,
  matches: 0,
  matchesByFile: {}
};

/**
 * Check if a file should be searched
 * @param {string} filePath - Path to the file
 * @returns {boolean} - Whether the file should be searched
 */
function shouldSearchFile(filePath) {
  const ext = path.extname(filePath);
  return searchExtensions.includes(ext);
}

/**
 * Search a file for patterns
 * @param {string} filePath - Path to the file
 */
function searchFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileMatches = [];
    
    for (const pattern of patterns) {
      const regex = new RegExp(pattern, 'gi');
      let match;
      
      while ((match = regex.exec(content)) !== null) {
        // Get the line number
        const lineNumber = content.substring(0, match.index).split('\n').length;
        
        // Get the line content
        const lines = content.split('\n');
        const line = lines[lineNumber - 1].trim();
        
        fileMatches.push({
          pattern,
          lineNumber,
          line
        });
        
        results.matches++;
      }
    }
    
    if (fileMatches.length > 0) {
      results.matchesByFile[filePath] = fileMatches;
    }
    
    results.files++;
  } catch (error) {
    console.error(`Error searching file ${filePath}:`, error);
  }
}

/**
 * Recursively search a directory for files
 * @param {string} dirPath - Path to the directory
 */
function searchDirectory(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Skip excluded directories
        if (excludeDirs.includes(entry.name)) {
          continue;
        }
        
        searchDirectory(fullPath);
      } else if (entry.isFile() && shouldSearchFile(fullPath)) {
        searchFile(fullPath);
      }
    }
  } catch (error) {
    console.error(`Error searching directory ${dirPath}:`, error);
  }
}

// Start the search
console.log('Searching for Supabase references...');

for (const dir of searchDirs) {
  const dirPath = path.join(__dirname, dir);
  
  if (fs.existsSync(dirPath)) {
    searchDirectory(dirPath);
  }
}

// Print results
console.log(`\nSearch completed!`);
console.log(`Searched ${results.files} files`);
console.log(`Found ${results.matches} matches in ${Object.keys(results.matchesByFile).length} files\n`);

// Print matches by file
for (const [filePath, matches] of Object.entries(results.matchesByFile)) {
  const relativePath = path.relative(__dirname, filePath);
  console.log(`\n${relativePath} (${matches.length} matches):`);
  
  for (const match of matches) {
    console.log(`  Line ${match.lineNumber}: ${match.pattern}`);
    console.log(`    ${match.line}`);
  }
}

// Suggest next steps
console.log('\nNext Steps:');
console.log('1. Review each file with Supabase references');
console.log('2. Update the code to use the PostgreSQL compatibility layer');
console.log('3. Test the application to ensure it works with PostgreSQL');
console.log('4. Update any documentation to reflect the migration');
