/**
 * fix-user-settings-rendering.js
 * This script fixes the user settings rendering in the frontend
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to log success
function logSuccess(message) {
  console.log(chalk.green('✅ ' + message));
}

// Helper function to log error
function logError(message) {
  console.error(chalk.red('❌ ' + message));
}

// Helper function to log info
function logInfo(message) {
  console.log(chalk.blue('ℹ️ ' + message));
}

console.log(chalk.bold('=== Fixing User Settings Rendering ==='));

// Path to UserSettings.tsx
const userSettingsPath = path.join(__dirname, 'src', 'components', 'UserSettings.tsx');

// Check if the file exists
if (!fs.existsSync(userSettingsPath)) {
  logError('UserSettings.tsx not found');
  process.exit(1);
}

// Read the file
let userSettingsContent = fs.readFileSync(userSettingsPath, 'utf8');

// Check if the file already has the user_account rendering
if (userSettingsContent.includes('user_account') && userSettingsContent.includes('display_name')) {
  logInfo('UserSettings.tsx already has the user_account rendering, skipping...');
  process.exit(0);
}

// Find the render section
const renderSectionStart = userSettingsContent.indexOf('return (');

if (renderSectionStart === -1) {
  logError('Could not find the render section in UserSettings.tsx');
  process.exit(1);
}

// Find the first div after the return statement
const firstDivStart = userSettingsContent.indexOf('<div', renderSectionStart);

if (firstDivStart === -1) {
  logError('Could not find the first div in the render section of UserSettings.tsx');
  process.exit(1);
}

// Find the end of the first div opening tag
const firstDivEnd = userSettingsContent.indexOf('>', firstDivStart);

if (firstDivEnd === -1) {
  logError('Could not find the end of the first div in the render section of UserSettings.tsx');
  process.exit(1);
}

// Add the user_account section after the first div
const userAccountSection = `>
      {/* User Account Information */}
      {userData && userData.user_account && (
        <div className="settings-section">
          <h3>Account Information</h3>
          <div className="settings-field">
            <label>Display Name:</label>
            <span>{userData.user_account.display_name || userData.full_name}</span>
          </div>
          <div className="settings-field">
            <label>Theme Preference:</label>
            <span>{userData.user_account.theme_preference || 'Light'}</span>
          </div>
          <div className="settings-field">
            <label>Account Type:</label>
            <span>{userData.user_account.account_type || 'Standard'}</span>
          </div>
          <div className="settings-field">
            <label>Account Status:</label>
            <span>{userData.user_account.account_status || 'Active'}</span>
          </div>
        </div>
      )}`;

// Replace the first div end with the user_account section
userSettingsContent = userSettingsContent.substring(0, firstDivEnd) + userAccountSection + userSettingsContent.substring(firstDivEnd + 1);

// Write the file back
fs.writeFileSync(userSettingsPath, userSettingsContent);

logSuccess('UserSettings.tsx updated successfully');

// Check if we need to add CSS for the settings-section and settings-field classes
const cssPath = path.join(__dirname, 'src', 'styles', 'UserSettings.css');

if (fs.existsSync(cssPath)) {
  logInfo('Checking UserSettings.css...');
  
  // Read the CSS file
  let cssContent = fs.readFileSync(cssPath, 'utf8');
  
  // Check if the CSS file already has the settings-section and settings-field classes
  if (cssContent.includes('.settings-section') && cssContent.includes('.settings-field')) {
    logInfo('UserSettings.css already has the settings-section and settings-field classes, skipping...');
  } else {
    logInfo('Adding settings-section and settings-field classes to UserSettings.css...');
    
    // Add the CSS classes
    const cssClasses = `
/* Settings section styles */
.settings-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.settings-section h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #333;
  font-size: 1.2rem;
}

.settings-field {
  display: flex;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #eee;
}

.settings-field:last-child {
  border-bottom: none;
  padding-bottom: 0;
  margin-bottom: 0;
}

.settings-field label {
  flex: 0 0 150px;
  font-weight: 600;
  color: #555;
}

.settings-field span {
  flex: 1;
  color: #333;
}
`;
    
    // Append the CSS classes to the file
    cssContent += cssClasses;
    
    // Write the file back
    fs.writeFileSync(cssPath, cssContent);
    
    logSuccess('UserSettings.css updated successfully');
  }
} else {
  logInfo('UserSettings.css not found, creating it...');
  
  // Create the CSS file
  const cssContent = `/* User Settings Styles */

.user-settings-container {
  padding: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
}

/* Settings section styles */
.settings-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.settings-section h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #333;
  font-size: 1.2rem;
}

.settings-field {
  display: flex;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #eee;
}

.settings-field:last-child {
  border-bottom: none;
  padding-bottom: 0;
  margin-bottom: 0;
}

.settings-field label {
  flex: 0 0 150px;
  font-weight: 600;
  color: #555;
}

.settings-field span {
  flex: 1;
  color: #333;
}
`;
  
  // Create the styles directory if it doesn't exist
  const stylesDir = path.join(__dirname, 'src', 'styles');
  if (!fs.existsSync(stylesDir)) {
    fs.mkdirSync(stylesDir, { recursive: true });
  }
  
  // Write the CSS file
  fs.writeFileSync(cssPath, cssContent);
  
  logSuccess('UserSettings.css created successfully');
  
  // Check if we need to import the CSS file in UserSettings.tsx
  if (!userSettingsContent.includes("import './styles/UserSettings.css'") && !userSettingsContent.includes("import '../styles/UserSettings.css'")) {
    logInfo('Adding CSS import to UserSettings.tsx...');
    
    // Find the last import statement
    const lastImportEnd = userSettingsContent.lastIndexOf('import');
    
    if (lastImportEnd !== -1) {
      // Find the end of the last import statement
      const lastImportStatementEnd = userSettingsContent.indexOf(';', lastImportEnd);
      
      if (lastImportStatementEnd !== -1) {
        // Add the CSS import after the last import statement
        const cssImport = "\nimport '../styles/UserSettings.css';";
        
        userSettingsContent = userSettingsContent.substring(0, lastImportStatementEnd + 1) + cssImport + userSettingsContent.substring(lastImportStatementEnd + 1);
        
        // Write the file back
        fs.writeFileSync(userSettingsPath, userSettingsContent);
        
        logSuccess('CSS import added to UserSettings.tsx');
      }
    }
  }
}

console.log(chalk.bold('=== User Settings Rendering Fixed ==='));
