/**
 * update-frontend-components.js
 * 
 * This script updates the frontend components to display data from the API.
 */

import fs from 'fs';
import path from 'path';

/**
 * Update the UserSettings component
 */
function updateUserSettingsComponent() {
  console.log('Updating UserSettings component...');
  
  const userSettingsPath = path.join(process.cwd(), 'src/components/UserSettings.tsx');
  
  if (!fs.existsSync(userSettingsPath)) {
    console.error(`UserSettings component not found at: ${userSettingsPath}`);
    return;
  }
  
  const userSettingsComponent = `import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, CircularProgress, Alert, Grid, TextField, Button, Divider } from '@mui/material';
import ApiService from '../services/api-service';

const UserSettings = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAcc, setUserAcc] = useState<any>(null);
  const [settings, setSettings] = useState<any[]>([]);
  const [formValues, setFormValues] = useState({
    displayName: '',
    theme: '',
    notifications: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user account data
        const userAccsResponse = await ApiService.getAllUserAccs();
        if (userAccsResponse.success && userAccsResponse.data.length > 0) {
          setUserAcc(userAccsResponse.data[0]);
          setFormValues({
            displayName: userAccsResponse.data[0].display_name || '',
            theme: userAccsResponse.data[0].theme_preference?.name || 'light',
            notifications: userAccsResponse.data[0].notification_preferences?.enabled ? 'enabled' : 'disabled'
          });
        }
        
        // Fetch settings data
        const settingsResponse = await ApiService.getAllSettings();
        if (settingsResponse.success) {
          setSettings(settingsResponse.data);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching account settings:', err);
        setError('Failed to load account settings. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userAcc) return;
    
    try {
      setLoading(true);
      
      const updatedUserAcc = {
        display_name: formValues.displayName,
        theme_preference: {
          name: formValues.theme,
          dark_mode: formValues.theme === 'dark'
        },
        notification_preferences: {
          enabled: formValues.notifications === 'enabled',
          email: formValues.notifications === 'enabled',
          push: formValues.notifications === 'enabled'
        }
      };
      
      const response = await ApiService.updateUserAcc(userAcc.id, updatedUserAcc);
      
      if (response.success) {
        setUserAcc(response.data);
        setError(null);
      } else {
        setError('Failed to update account settings.');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error updating account settings:', err);
      setError('Failed to update account settings. Please try again later.');
      setLoading(false);
    }
  };

  if (loading && !userAcc) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !userAcc) {
    return (
      <Box mt={2} mb={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Account Settings
      </Typography>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            User Profile
          </Typography>
          
          {error && (
            <Box mt={2} mb={2}>
              <Alert severity="error">{error}</Alert>
            </Box>
          )}
          
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Display Name"
                  name="displayName"
                  value={formValues.displayName}
                  onChange={handleInputChange}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Theme"
                  name="theme"
                  select
                  SelectProps={{ native: true }}
                  value={formValues.theme}
                  onChange={handleInputChange}
                  margin="normal"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </TextField>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Notifications"
                  name="notifications"
                  select
                  SelectProps={{ native: true }}
                  value={formValues.notifications}
                  onChange={handleInputChange}
                  margin="normal"
                >
                  <option value="enabled">Enabled</option>
                  <option value="disabled">Disabled</option>
                </TextField>
              </Grid>
              
              <Grid item xs={12}>
                <Box mt={2} display="flex" justifyContent="flex-end">
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            System Settings
          </Typography>
          
          <Divider sx={{ mb: 2 }} />
          
          {settings.length === 0 ? (
            <Typography color="textSecondary">No system settings found.</Typography>
          ) : (
            <Grid container spacing={2}>
              {settings.map((setting) => (
                <Grid item xs={12} md={6} key={setting.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        {setting.key}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Category: {setting.category}
                      </Typography>
                      <Typography variant="body2">
                        Value: {typeof setting.value === 'object' ? JSON.stringify(setting.value) : setting.value}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserSettings;
`;
  
  fs.writeFileSync(userSettingsPath, userSettingsComponent);
  console.log(`UserSettings component updated at: ${userSettingsPath}`);
}

/**
 * Create the SystemHealthMonitor component
 */
function createSystemHealthMonitorComponent() {
  console.log('Creating SystemHealthMonitor component...');
  
  const componentsDir = path.join(process.cwd(), 'src/components');
  
  if (!fs.existsSync(componentsDir)) {
    fs.mkdirSync(componentsDir, { recursive: true });
  }
  
  const systemHealthMonitorPath = path.join(componentsDir, 'SystemHealthMonitor.tsx');
  
  const systemHealthMonitorComponent = `import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, CircularProgress, Alert, Grid, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import ApiService from '../services/api-service';

const SystemHealthMonitor = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [healthChecks, setHealthChecks] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch system health checks data
        const response = await ApiService.getAllSystemHealthChecks();
        
        if (response.success) {
          setHealthChecks(response.data);
          
          // Extract unique categories
          const uniqueCategories = [...new Set(response.data.map((check: any) => check.category))];
          setCategories(uniqueCategories);
          
          if (uniqueCategories.length > 0 && !selectedCategory) {
            setSelectedCategory(uniqueCategories[0]);
          }
        } else {
          setError('Failed to load system health checks.');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching system health checks:', err);
        setError('Failed to load system health checks. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Refresh data every 30 seconds
    const intervalId = setInterval(fetchData, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  const filteredHealthChecks = selectedCategory
    ? healthChecks.filter(check => check.category === selectedCategory)
    : healthChecks;

  if (loading && healthChecks.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error && healthChecks.length === 0) {
    return (
      <Box mt={2} mb={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        System Health Monitor
      </Typography>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Health Check Categories
            </Typography>
            
            <Box display="flex" flexWrap="wrap" gap={1}>
              <Chip
                label="All"
                color={selectedCategory === null ? 'primary' : 'default'}
                onClick={() => setSelectedCategory(null)}
                sx={{ mb: 1 }}
              />
              
              {categories.map(category => (
                <Chip
                  key={category}
                  label={category}
                  color={selectedCategory === category ? 'primary' : 'default'}
                  onClick={() => setSelectedCategory(category)}
                  sx={{ mb: 1 }}
                />
              ))}
            </Box>
          </Box>
          
          {error && (
            <Box mt={2} mb={2}>
              <Alert severity="error">{error}</Alert>
            </Box>
          )}
          
          <Typography variant="h6" gutterBottom>
            Health Check Results
          </Typography>
          
          {filteredHealthChecks.length === 0 ? (
            <Typography color="textSecondary">No health checks found.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Endpoint</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Response Time (ms)</TableCell>
                    <TableCell>Status Code</TableCell>
                    <TableCell>Timestamp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredHealthChecks.map((check) => (
                    <TableRow key={check.id}>
                      <TableCell>{check.endpoint}</TableCell>
                      <TableCell>{check.category}</TableCell>
                      <TableCell>
                        <Chip
                          label={check.status}
                          color={check.status === 'ok' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{check.response_time}</TableCell>
                      <TableCell>{check.status_code}</TableCell>
                      <TableCell>{new Date(check.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            System Status Summary
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h5" align="center">
                    {healthChecks.filter(check => check.status === 'ok').length}
                  </Typography>
                  <Typography variant="body1" align="center" color="success.main">
                    Healthy Endpoints
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h5" align="center">
                    {healthChecks.filter(check => check.status === 'error').length}
                  </Typography>
                  <Typography variant="body1" align="center" color="error.main">
                    Failing Endpoints
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h5" align="center">
                    {categories.length}
                  </Typography>
                  <Typography variant="body1" align="center">
                    Categories Monitored
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SystemHealthMonitor;
`;
  
  fs.writeFileSync(systemHealthMonitorPath, systemHealthMonitorComponent);
  console.log(`SystemHealthMonitor component created at: ${systemHealthMonitorPath}`);
}

/**
 * Update the DashboardLayout component to include the SystemHealthMonitor
 */
function updateDashboardLayoutComponent() {
  console.log('Updating DashboardLayout component...');
  
  const dashboardLayoutPath = path.join(process.cwd(), 'src/components/DashboardLayout.tsx');
  
  if (!fs.existsSync(dashboardLayoutPath)) {
    console.error(`DashboardLayout component not found at: ${dashboardLayoutPath}`);
    return;
  }
  
  // Read the existing file
  const existingContent = fs.readFileSync(dashboardLayoutPath, 'utf8');
  
  // Check if SystemHealthMonitor is already imported
  if (!existingContent.includes('SystemHealthMonitor')) {
    // Add import for SystemHealthMonitor
    const updatedContent = existingContent.replace(
      /import React.*/,
      `import React from 'react';
import SystemHealthMonitor from './SystemHealthMonitor';`
    );
    
    // Add SystemHealthMonitor to the routes or menu
    const finalContent = updatedContent.replace(
      /<Route path="\/settings".*\/>/,
      `<Route path="/settings" element={<UserSettings />} />
            <Route path="/system-health" element={<SystemHealthMonitor />} />`
    );
    
    fs.writeFileSync(dashboardLayoutPath, finalContent);
    console.log(`DashboardLayout component updated at: ${dashboardLayoutPath}`);
  } else {
    console.log('SystemHealthMonitor already included in DashboardLayout');
  }
}

/**
 * Main function to update frontend components
 */
function updateFrontendComponents() {
  console.log('Updating frontend components...');
  
  updateUserSettingsComponent();
  createSystemHealthMonitorComponent();
  updateDashboardLayoutComponent();
  
  console.log('Frontend components updated successfully.');
}

// Run the function
updateFrontendComponents();
