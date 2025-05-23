import React from 'react';
import Settings from './Settings';
import SystemHealthMonitoring from './SystemHealthMonitoring';
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
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
