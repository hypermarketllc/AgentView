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
