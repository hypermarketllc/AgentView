/**
 * update-dashboard-layout.js
 * This script updates the DashboardLayout component to include the Settings component.
 */

import fs from 'fs';
import path from 'path';

// Path to the DashboardLayout component
const layoutPath = 'src/components/DashboardLayout.tsx';

// Check if the DashboardLayout component exists
if (!fs.existsSync(layoutPath)) {
  console.error(`DashboardLayout component not found at ${layoutPath}`);
  process.exit(1);
}

// Read the original file
console.log(`Reading ${layoutPath}...`);
const originalContent = fs.readFileSync(layoutPath, 'utf8');

// Create a backup
const backupPath = `${layoutPath}.backup`;
console.log(`Creating backup at ${backupPath}...`);
fs.writeFileSync(backupPath, originalContent);

// Check if the Settings component is already imported
if (originalContent.includes('import Settings')) {
  console.log('Settings component is already imported in the DashboardLayout.');
  process.exit(0);
}

// Update the component to include the Settings component
console.log('Updating DashboardLayout component...');

// Add import for Settings component
let updatedContent = originalContent;
if (!updatedContent.includes('import Settings')) {
  updatedContent = updatedContent.replace(
    /import React.*/,
    `import React from 'react';
import Settings from './Settings';`
  );
}

// Add Settings component to the layout
// Look for the SystemHealthMonitoring component and add Settings after it
if (updatedContent.includes('SystemHealthMonitoring')) {
  updatedContent = updatedContent.replace(
    /<SystemHealthMonitoring \/>/,
    `<SystemHealthMonitoring />
            <div style={{ margin: '24px 16px' }}>
              <Settings />
            </div>`
  );
} else {
  // If SystemHealthMonitoring doesn't exist, add Settings before the closing Layout tag
  updatedContent = updatedContent.replace(
    /<\/Layout>/,
    `  <div style={{ margin: '24px 16px' }}>
            <Settings />
          </div>
        </Layout>`
  );
}

// Write the updated content back to the file
console.log('Writing updated content back to the file...');
fs.writeFileSync(layoutPath, updatedContent);

console.log('DashboardLayout component updated successfully.');
console.log('The component now includes the Settings component.');
