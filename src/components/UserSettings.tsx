import React, { useState, useEffect } from 'react';
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
