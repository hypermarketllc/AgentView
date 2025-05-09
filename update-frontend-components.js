/**
 * update-frontend-components.js
 * 
 * This script updates the frontend components to fetch and display data from the API.
 * It focuses on the UserSettings and DashboardLayout components.
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

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

// Helper function to log warning
function logWarning(message) {
  console.log(chalk.yellow('⚠️ ' + message));
}

// Update the UserSettings component to fetch and display data from the API
function updateUserSettingsComponent() {
  logInfo('Updating UserSettings component to fetch and display data from the API...');
  
  try {
    // Check if the file exists
    const componentPath = path.join('src', 'components', 'UserSettings.tsx');
    
    if (!fs.existsSync(componentPath)) {
      logError(`File not found: ${componentPath}`);
      return false;
    }
    
    // Read the current content
    const currentContent = fs.readFileSync(componentPath, 'utf8');
    
    // Check if the component already fetches data from the API
    if (currentContent.includes('useEffect') && 
        (currentContent.includes('fetch') || 
         currentContent.includes('axios') || 
         currentContent.includes('api.'))) {
      logWarning('UserSettings component already fetches data from the API');
      return true;
    }
    
    // Update the component to fetch and display data from the API
    const updatedContent = `import React, { useState, useEffect } from 'react';
import { Box, Button, Card, CardContent, CircularProgress, Container, Grid, TextField, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api-service';

const UserSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('light');
  const [notificationPreferences, setNotificationPreferences] = useState({
    email: true,
    sms: false,
    push: true
  });
  const [dashboardLayout, setDashboardLayout] = useState({
    layout: 'default',
    widgets: ['deals', 'notifications']
  });

  useEffect(() => {
    const fetchUserSettings = async () => {
      try {
        setLoading(true);
        const response = await api.get('/user/settings');
        
        if (response.data) {
          setSettings(response.data);
          
          // Update state with fetched data
          if (response.data.theme) {
            setTheme(response.data.theme);
          }
          
          if (response.data.notification_preferences) {
            setNotificationPreferences(response.data.notification_preferences);
          }
          
          if (response.data.dashboard_layout) {
            setDashboardLayout(response.data.dashboard_layout);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user settings:', err);
        setError('Failed to load user settings. Please try again later.');
        setLoading(false);
      }
    };

    if (user) {
      fetchUserSettings();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      
      const updatedSettings = {
        theme,
        notification_preferences: notificationPreferences,
        dashboard_layout: dashboardLayout
      };
      
      await api.put('/user/settings', updatedSettings);
      
      setSettings(updatedSettings);
      setLoading(false);
      
      // Show success message
      alert('Settings saved successfully!');
    } catch (err) {
      console.error('Error saving user settings:', err);
      setError('Failed to save user settings. Please try again later.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <Typography color="error">{error}</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Account Settings
      </Typography>
      
      <Card>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6">Theme</Typography>
              <TextField
                select
                fullWidth
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                SelectProps={{
                  native: true,
                }}
                margin="normal"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6">Notification Preferences</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <label>
                    <input
                      type="checkbox"
                      checked={notificationPreferences.email}
                      onChange={(e) => setNotificationPreferences({
                        ...notificationPreferences,
                        email: e.target.checked
                      })}
                    />
                    {' '}Email Notifications
                  </label>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <label>
                    <input
                      type="checkbox"
                      checked={notificationPreferences.sms}
                      onChange={(e) => setNotificationPreferences({
                        ...notificationPreferences,
                        sms: e.target.checked
                      })}
                    />
                    {' '}SMS Notifications
                  </label>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <label>
                    <input
                      type="checkbox"
                      checked={notificationPreferences.push}
                      onChange={(e) => setNotificationPreferences({
                        ...notificationPreferences,
                        push: e.target.checked
                      })}
                    />
                    {' '}Push Notifications
                  </label>
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6">Dashboard Layout</Typography>
              <TextField
                select
                fullWidth
                value={dashboardLayout.layout}
                onChange={(e) => setDashboardLayout({
                  ...dashboardLayout,
                  layout: e.target.value
                })}
                SelectProps={{
                  native: true,
                }}
                margin="normal"
              >
                <option value="default">Default</option>
                <option value="compact">Compact</option>
                <option value="expanded">Expanded</option>
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveSettings}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default UserSettings;
`;
    
    // Write the updated content back to the file
    fs.writeFileSync(componentPath, updatedContent);
    
    logSuccess('Updated UserSettings component to fetch and display data from the API');
    return true;
  } catch (error) {
    logError(`Error updating UserSettings component: ${error.message}`);
    return false;
  }
}

// Update the DashboardLayout component to fetch and display data from the API
function updateDashboardLayoutComponent() {
  logInfo('Updating DashboardLayout component to fetch and display data from the API...');
  
  try {
    // Check if the file exists
    const componentPath = path.join('src', 'components', 'DashboardLayout.tsx');
    
    if (!fs.existsSync(componentPath)) {
      logError(`File not found: ${componentPath}`);
      return false;
    }
    
    // Read the current content
    const currentContent = fs.readFileSync(componentPath, 'utf8');
    
    // Check if the component already fetches data from the API
    if (currentContent.includes('useEffect') && 
        (currentContent.includes('fetch') || 
         currentContent.includes('axios') || 
         currentContent.includes('api.'))) {
      logWarning('DashboardLayout component already fetches data from the API');
      return true;
    }
    
    // Update the component to fetch and display data from the API
    const updatedContent = `import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Container, Grid, Paper, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { usePermission } from '../contexts/PermissionContext';
import api from '../services/api-service';

const DashboardLayout = ({ children }) => {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const [userSettings, setUserSettings] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch user settings
        if (user) {
          try {
            const userSettingsResponse = await api.get('/user/settings');
            setUserSettings(userSettingsResponse.data);
          } catch (err) {
            console.error('Error fetching user settings:', err);
          }
        }
        
        // Fetch system health data if user has permission
        if (hasPermission('view_system_health')) {
          try {
            const systemHealthResponse = await api.get('/system/health');
            setSystemHealth(systemHealthResponse.data);
          } catch (err) {
            console.error('Error fetching system health:', err);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, [user, hasPermission]);

  // Apply user's theme preference if available
  useEffect(() => {
    if (userSettings && userSettings.theme) {
      document.documentElement.setAttribute('data-theme', userSettings.theme);
    }
  }, [userSettings]);

  // Render system health status if available
  const renderSystemHealth = () => {
    if (!systemHealth) return null;
    
    return (
      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          System Status
        </Typography>
        
        <Grid container spacing={2}>
          {Object.entries(systemHealth).map(([key, value]) => (
            <Grid item xs={12} sm={6} md={4} key={key}>
              <Paper 
                elevation={1} 
                sx={{ 
                  p: 2, 
                  bgcolor: value.status === 'healthy' ? '#e8f5e9' : '#ffebee',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}
              >
                <Typography variant="subtitle1" fontWeight="bold">
                  {key.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase())}
                </Typography>
                <Typography variant="body2" color={value.status === 'healthy' ? 'success.main' : 'error.main'}>
                  Status: {value.status.toUpperCase()}
                </Typography>
                {value.message && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {value.message}
                  </Typography>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <Typography color="error">{error}</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {hasPermission('view_system_health') && renderSystemHealth()}
      
      {/* Apply user's dashboard layout preference if available */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        ...(userSettings?.dashboard_layout?.layout === 'compact' && {
          maxWidth: '800px',
          mx: 'auto'
        }),
        ...(userSettings?.dashboard_layout?.layout === 'expanded' && {
          maxWidth: '1200px'
        })
      }}>
        {children}
      </Box>
    </Container>
  );
};

export default DashboardLayout;
`;
    
    // Write the updated content back to the file
    fs.writeFileSync(componentPath, updatedContent);
    
    logSuccess('Updated DashboardLayout component to fetch and display data from the API');
    return true;
  } catch (error) {
    logError(`Error updating DashboardLayout component: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log(chalk.bold('=== Updating Frontend Components ==='));
  
  // Update the UserSettings component
  updateUserSettingsComponent();
  
  // Update the DashboardLayout component
  updateDashboardLayoutComponent();
  
  console.log(chalk.bold('\n=== Frontend Components Update Complete ==='));
  logInfo('The frontend components have been updated to fetch and display data from the API.');
  logInfo('To apply these changes, restart the server and run the system health monitor again:');
  logInfo('node run-system-health-monitor-data-display.js');
}

// Run the main function
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
