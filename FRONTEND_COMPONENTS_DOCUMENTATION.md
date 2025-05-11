# Frontend Components Documentation

## Overview

This document provides detailed information about the frontend components that have been updated or created to display data from the API. The following components have been updated or created:

1. `UserSettings.tsx`
2. `SystemHealthMonitor.tsx`
3. `DashboardLayout.tsx` (updated to include SystemHealthMonitor)

## Components

### UserSettings.tsx

The `UserSettings` component displays user account data and settings. It allows users to update their account settings.

#### Features

- Displays user profile information
- Allows users to update their display name
- Allows users to select a theme preference
- Allows users to enable or disable notifications
- Displays system settings

#### Implementation

```tsx
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

  // ... (rendering logic)
};

export default UserSettings;
```

#### API Integration

The `UserSettings` component integrates with the API through the following methods:

- `ApiService.getAllUserAccs()`: Fetches all user accounts
- `ApiService.getAllSettings()`: Fetches all settings
- `ApiService.updateUserAcc(id, data)`: Updates a user account

### SystemHealthMonitor.tsx

The `SystemHealthMonitor` component displays system health check data. It shows the status of various endpoints and provides a summary of the system health.

#### Features

- Displays a list of health checks with their status, response time, and status code
- Allows filtering health checks by category
- Provides a summary of the system health, including the number of healthy and failing endpoints
- Automatically refreshes data every 30 seconds

#### Implementation

```tsx
import React, { useState, useEffect } from 'react';
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

  // ... (rendering logic)
};

export default SystemHealthMonitor;
```

#### API Integration

The `SystemHealthMonitor` component integrates with the API through the following method:

- `ApiService.getAllSystemHealthChecks()`: Fetches all system health checks

### DashboardLayout.tsx (Updated)

The `DashboardLayout` component has been updated to include the `SystemHealthMonitor` component.

#### Changes

1. Added import for `SystemHealthMonitor`:

```tsx
import React from 'react';
import SystemHealthMonitor from './SystemHealthMonitor';
```

2. Added route for `SystemHealthMonitor`:

```tsx
<Route path="/system-health" element={<SystemHealthMonitor />} />
```

## API Service

The components interact with the API through the `ApiService` module, which provides methods for fetching and updating data.

```javascript
// src/services/api-service.js
import axios from 'axios';

const API_BASE_URL = process.env.API_URL || '/api';

const ApiService = {
  // System Health Checks
  getAllSystemHealthChecks: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/system-health-checks`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching system health checks:', error);
      return { success: false, error: error.message };
    }
  },

  // User Accounts
  getAllUserAccs: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/user-accs`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching user accounts:', error);
      return { success: false, error: error.message };
    }
  },

  getUserAccById: async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/user-accs/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Error fetching user account with ID ${id}:`, error);
      return { success: false, error: error.message };
    }
  },

  updateUserAcc: async (id, data) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/user-accs/${id}`, data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Error updating user account with ID ${id}:`, error);
      return { success: false, error: error.message };
    }
  },

  // Settings
  getAllSettings: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching settings:', error);
      return { success: false, error: error.message };
    }
  },

  getSettingsByCategory: async (category) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings/${category}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Error fetching settings for category ${category}:`, error);
      return { success: false, error: error.message };
    }
  }
};

export default ApiService;
```

## Styling

The components use Material-UI for styling. The following Material-UI components are used:

- `Box`: For layout and spacing
- `Card` and `CardContent`: For containing content
- `Typography`: For text
- `CircularProgress`: For loading indicators
- `Alert`: For error messages
- `Grid`: For layout
- `TextField`: For input fields
- `Button`: For actions
- `Divider`: For separating content
- `Chip`: For filtering options
- `Table`, `TableBody`, `TableCell`, `TableContainer`, `TableHead`, `TableRow`: For displaying tabular data
- `Paper`: For containing the table

## Error Handling

Both components include error handling to display appropriate messages when errors occur. They use the `Alert` component from Material-UI to display error messages.

## Loading States

Both components include loading states to display a loading indicator while data is being fetched. They use the `CircularProgress` component from Material-UI to display a loading spinner.

## Responsive Design

The components are designed to be responsive and work well on different screen sizes. They use the `Grid` component from Material-UI to create responsive layouts.

## Testing

To test these components, you can use the `system-health-monitor-check.js` script, which will make requests to the API endpoints and display the results. You can then open the application in a browser and navigate to the appropriate pages to verify that the components are displaying data correctly.

## Troubleshooting

If you encounter issues with these components, check the following:

1. Make sure the API endpoints are working correctly.
2. Check the browser console for any errors.
3. Verify that the components are correctly fetching data from the API.
4. Check that the data is being displayed correctly in the components.
5. Ensure that the components are correctly integrated into the application.
