/**
 * Injector for the auth provider fix
 * This module handles injecting the script into the HTML file
 */

import { fs, path, indexHtmlPath } from './auth-provider-core.mjs';
import { createAuthProviderFixScript } from './auth-provider-script-generator.mjs';

/**
 * Function to inject the fix script into the index.html file
 * @returns {boolean} True if the injection was successful, false otherwise
 */
export function injectAuthProviderFix() {
  try {
    // Read the index.html file
    const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    
    // Check if the fix has already been applied
    if (indexHtml.includes('[Auth Provider Fix] Applying targeted auth provider fix')) {
      console.log('Auth provider fix already applied to index.html');
      return true;
    }
    
    // Create the fix script
    const fixScript = createAuthProviderFixScript();
    
    // Inject the script at the beginning of the <head> tag for earlier execution
    const headTagIndex = indexHtml.indexOf('<head>');
    if (headTagIndex === -1) {
      console.error('Could not find <head> tag in index.html');
      return false;
    }
    
    const modifiedHtml = indexHtml.slice(0, headTagIndex + 6) + 
                         '\n' + fixScript + '\n' + 
                         indexHtml.slice(headTagIndex + 6);
    
    // Write the modified HTML back to the file
    fs.writeFileSync(indexHtmlPath, modifiedHtml);
    
    console.log('Auth provider fix successfully injected at the beginning of <head> in index.html');
    return true;
  } catch (error) {
    console.error('Error injecting auth provider fix:', error);
    return false;
  }
}
