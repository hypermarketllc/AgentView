/**
 * Main module for the auth provider fix
 * This module imports and executes all the other modules
 */

import { injectAuthProviderFix } from './auth-provider-injector.mjs';
import { fixApiUrl, analyzeApiEndpoints } from './auth-provider-api-url-fixer.mjs';

/**
 * Main function to apply all auth provider fixes
 * @returns {boolean} True if all fixes were successful, false otherwise
 */
export async function applyAuthProviderFixes() {
  console.log('=== Auth Provider Fix ===');
  console.log('Starting auth provider fix process...');
  
  try {
    // Step 1: Analyze API endpoints
    console.log('\nStep 1: Analyzing API endpoints...');
    const analysisResults = analyzeApiEndpoints();
    
    if (analysisResults.success) {
      console.log('API endpoint analysis completed successfully');
      
      // Log some analysis results
      const { results } = analysisResults;
      for (const [name, data] of Object.entries(results)) {
        console.log(`- ${name}: ${data.count} occurrences`);
        if (data.count > 0) {
          console.log(`  Examples: ${data.examples.join(', ')}`);
        }
      }
    } else {
      console.error('API endpoint analysis failed:', analysisResults.error);
    }
    
    // Step 2: Fix API URLs
    console.log('\nStep 2: Fixing API URLs...');
    const apiUrlFixResult = fixApiUrl();
    
    if (apiUrlFixResult) {
      console.log('API URL fixes applied successfully');
    } else {
      console.error('Failed to apply API URL fixes');
    }
    
    // Step 3: Inject auth provider fix
    console.log('\nStep 3: Injecting auth provider fix...');
    const injectionResult = injectAuthProviderFix();
    
    if (injectionResult) {
      console.log('Auth provider fix injected successfully');
    } else {
      console.error('Failed to inject auth provider fix');
    }
    
    // Final status
    const success = apiUrlFixResult && injectionResult;
    
    if (success) {
      console.log('\n✅ Auth provider fix process completed successfully');
    } else {
      console.error('\n❌ Auth provider fix process completed with errors');
    }
    
    return success;
  } catch (error) {
    console.error('Error applying auth provider fixes:', error);
    return false;
  }
}

// If this module is run directly, execute the fixes
if (import.meta.url === `file://${process.argv[1]}`) {
  applyAuthProviderFixes()
    .then(success => {
      if (success) {
        console.log('Auth provider fix script completed successfully');
        process.exit(0);
      } else {
        console.error('Auth provider fix script completed with errors');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unhandled error in auth provider fix script:', error);
      process.exit(1);
    });
}
