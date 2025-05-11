/**
 * API URL fixer for the auth provider
 * This module handles fixing API URLs in the frontend code
 */

import { fs, indexJsPath } from './auth-provider-core.mjs';

/**
 * Function to fix API URLs in the frontend code
 * @returns {boolean} True if the fix was successful, false otherwise
 */
export function fixApiUrl() {
  try {
    // Check if the index.js file exists
    if (!fs.existsSync(indexJsPath)) {
      console.error(`Index.js file not found at: ${indexJsPath}`);
      return false;
    }
    
    // Read the index.js file
    const indexJs = fs.readFileSync(indexJsPath, 'utf8');
    
    // Check if the file contains API URL patterns that need fixing
    const apiUrlPatterns = [
      { pattern: /\/api\/auth\/login/g, replacement: '/crm/api/auth/login' },
      { pattern: /\/api\/auth\/me/g, replacement: '/crm/api/auth/me' },
      { pattern: /\/api\/settings/g, replacement: '/crm/api/settings' }
    ];
    
    let modifiedJs = indexJs;
    let fixesApplied = false;
    
    // Apply each pattern fix
    for (const { pattern, replacement } of apiUrlPatterns) {
      if (pattern.test(modifiedJs)) {
        // Reset the lastIndex property of the regex to start from the beginning
        pattern.lastIndex = 0;
        
        // Count occurrences before replacement
        const occurrences = (modifiedJs.match(pattern) || []).length;
        
        if (occurrences > 0) {
          console.log(`Found ${occurrences} occurrences of ${pattern}`);
          modifiedJs = modifiedJs.replace(pattern, replacement);
          fixesApplied = true;
        }
      }
    }
    
    // If fixes were applied, write the modified file back
    if (fixesApplied) {
      fs.writeFileSync(indexJsPath, modifiedJs);
      console.log('API URL fixes applied to index.js');
    } else {
      console.log('No API URL fixes needed in index.js');
    }
    
    // Check for axios base URL configuration
    const axiosBaseUrlPattern = /axios\.create\(\{[^}]*baseURL:\s*['"]([^'"]*)['"]/;
    const axiosBaseUrlMatch = indexJs.match(axiosBaseUrlPattern);
    
    if (axiosBaseUrlMatch) {
      const currentBaseUrl = axiosBaseUrlMatch[1];
      console.log(`Found axios baseURL: ${currentBaseUrl}`);
      
      // Check if the base URL needs to be updated
      if (!currentBaseUrl.includes('/crm')) {
        console.log('Axios baseURL might need to be updated to include /crm prefix');
      }
    }
    
    console.log('API URL check completed');
    return true;
  } catch (error) {
    console.error('Error fixing API URL:', error);
    return false;
  }
}

/**
 * Function to analyze API endpoints in the frontend code
 * This is a diagnostic function that doesn't modify the code
 * @returns {object} Analysis results
 */
export function analyzeApiEndpoints() {
  try {
    // Check if the index.js file exists
    if (!fs.existsSync(indexJsPath)) {
      console.error(`Index.js file not found at: ${indexJsPath}`);
      return { success: false, error: 'File not found' };
    }
    
    // Read the index.js file
    const indexJs = fs.readFileSync(indexJsPath, 'utf8');
    
    // Define patterns to search for
    const patterns = [
      { name: 'API Endpoints', pattern: /['"]\/api\/([^'"]*)['"]/g },
      { name: 'CRM API Endpoints', pattern: /['"]\/crm\/api\/([^'"]*)['"]/g },
      { name: 'Fetch Calls', pattern: /fetch\(['"]([^'"]*)['"]/g },
      { name: 'Axios Calls', pattern: /axios\.[a-z]+\(['"]([^'"]*)['"]/g },
      { name: 'Authorization Headers', pattern: /['"](Authorization|Bearer)['"]/g }
    ];
    
    const results = {};
    
    // Search for each pattern
    for (const { name, pattern } of patterns) {
      const matches = [];
      let match;
      
      // Reset the lastIndex property of the regex to start from the beginning
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(indexJs)) !== null) {
        matches.push(match[0]);
      }
      
      results[name] = {
        count: matches.length,
        examples: matches.slice(0, 5) // Limit to 5 examples to avoid overwhelming output
      };
    }
    
    console.log('API endpoint analysis completed');
    return { success: true, results };
  } catch (error) {
    console.error('Error analyzing API endpoints:', error);
    return { success: false, error: error.message };
  }
}
