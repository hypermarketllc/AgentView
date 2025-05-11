/**
 * update-user-settings.js
 * This script updates the UserSettings component to use the user_accs API endpoint.
 */

import fs from 'fs';
import path from 'path';

// Path to the UserSettings component
const userSettingsPath = 'src/components/UserSettings.tsx';

// Check if the UserSettings component exists
if (!fs.existsSync(userSettingsPath)) {
  console.error(`UserSettings component not found at ${userSettingsPath}`);
  process.exit(1);
}

// Read the original file
console.log(`Reading ${userSettingsPath}...`);
const originalContent = fs.readFileSync(userSettingsPath, 'utf8');

// Create a backup
const backupPath = `${userSettingsPath}.backup`;
console.log(`Creating backup at ${backupPath}...`);
fs.writeFileSync(backupPath, originalContent);

// Check if the component already uses the user_accs API endpoint
if (originalContent.includes('/api/user-accs')) {
  console.log('UserSettings component already uses the user_accs API endpoint.');
  process.exit(0);
}

// Update the component to use the user_accs API endpoint
console.log('Updating UserSettings component...');

// Add imports if needed
let updatedContent = originalContent;
if (!updatedContent.includes('import axios')) {
  updatedContent = updatedContent.replace(
    /import React.*/,
    `import React, { useState, useEffect } from 'react';
import axios from 'axios';`
  );
}

// Add user account interface
if (!updatedContent.includes('interface UserAccount')) {
  const interfacePosition = updatedContent.indexOf('interface') !== -1 
    ? updatedContent.indexOf('interface') 
    : updatedContent.indexOf('const UserSettings');
  
  updatedContent = updatedContent.slice(0, interfacePosition) + 
  `interface UserAccount {
  id: string;
  user_id: string;
  account_type: string;
  account_status: string;
  settings: {
    theme?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
      deals?: boolean;
    };
    display_name?: string;
    dashboard_layout?: string;
  };
  created_at: string;
  updated_at: string;
}

` + updatedContent.slice(interfacePosition);
}

// Add state for user account
if (!updatedContent.includes('userAccount')) {
  const statePosition = updatedContent.indexOf('const [') !== -1 
    ? updatedContent.indexOf('const [') 
    : updatedContent.indexOf('return (');
  
  updatedContent = updatedContent.slice(0, statePosition) + 
  `  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

` + updatedContent.slice(statePosition);
}

// Add useEffect to fetch user account data
if (!updatedContent.includes('useEffect')) {
  const effectPosition = updatedContent.indexOf('return (');
  
  updatedContent = updatedContent.slice(0, effectPosition) + 
  `  useEffect(() => {
    const fetchUserAccount = async () => {
      try {
        setLoading(true);
        // Get the current user ID from the auth context or local storage
        const userId = localStorage.getItem('userId') || 'current'; // Fallback to 'current' if no userId is found
        
        // Fetch user account data
        const response = await axios.get(\`/api/user-accs\`);
        
        // Find the user account for the current user
        const userAcc = response.data.find((acc: UserAccount) => acc.user_id === userId) || response.data[0];
        
        if (userAcc) {
          setUserAccount(userAcc);
          setError(null);
        } else {
          setError('User account not found');
        }
      } catch (err) {
        console.error('Error fetching user account:', err);
        setError('Failed to fetch user account data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAccount();
  }, []);

` + updatedContent.slice(effectPosition);
}

// Add function to update user account
if (!updatedContent.includes('updateUserAccount')) {
  const updatePosition = updatedContent.indexOf('return (');
  
  updatedContent = updatedContent.slice(0, updatePosition) + 
  `  const updateUserAccount = async (updatedSettings: any) => {
    if (!userAccount) return;
    
    try {
      setLoading(true);
      
      // Update user account settings
      const response = await axios.put(\`/api/user-accs/\${userAccount.id}\`, {
        ...userAccount,
        settings: {
          ...userAccount.settings,
          ...updatedSettings
        }
      });
      
      setUserAccount(response.data);
      setError(null);
    } catch (err) {
      console.error('Error updating user account:', err);
      setError('Failed to update user account settings');
    } finally {
      setLoading(false);
    }
  };

` + updatedContent.slice(updatePosition);
}

// Update the render function to use the user account data
const renderContent = updatedContent.indexOf('return (');
const renderEndContent = updatedContent.lastIndexOf('}');

// Create a new render function that uses the user account data
const newRenderContent = `  // Show loading state
  if (loading) {
    return <div>Loading user settings...</div>;
  }

  // Show error state
  if (error) {
    return <div>Error: {error}</div>;
  }

  // Show user account settings
  return (
    <div className="user-settings">
      <h2>User Settings</h2>
      
      {userAccount ? (
        <div>
          <h3>Account Information</h3>
          <p><strong>Account Type:</strong> {userAccount.account_type}</p>
          <p><strong>Account Status:</strong> {userAccount.account_status}</p>
          
          <h3>Display Settings</h3>
          <p><strong>Display Name:</strong> {userAccount.settings?.display_name}</p>
          <p><strong>Theme:</strong> {userAccount.settings?.theme || 'Default'}</p>
          <p><strong>Dashboard Layout:</strong> {userAccount.settings?.dashboard_layout || 'Default'}</p>
          
          <h3>Notification Preferences</h3>
          <p><strong>Email Notifications:</strong> {userAccount.settings?.notifications?.email ? 'Enabled' : 'Disabled'}</p>
          <p><strong>Push Notifications:</strong> {userAccount.settings?.notifications?.push ? 'Enabled' : 'Disabled'}</p>
          <p><strong>Deal Notifications:</strong> {userAccount.settings?.notifications?.deals ? 'Enabled' : 'Disabled'}</p>
        </div>
      ) : (
        <p>No user account found</p>
      )}
    </div>
  );`;

// Replace the render function
updatedContent = updatedContent.slice(0, renderContent) + newRenderContent + updatedContent.slice(renderEndContent);

// Write the updated content back to the file
console.log('Writing updated content back to the file...');
fs.writeFileSync(userSettingsPath, updatedContent);

console.log('UserSettings component updated successfully.');
console.log('The component now uses the user_accs API endpoint to fetch and display user account data.');
