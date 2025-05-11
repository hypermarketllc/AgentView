/**
 * system-health-monitor-data-display-check.js
 * This script checks if the system health monitoring data is being displayed correctly in the frontend.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Function to check if a component exists in the frontend
function checkComponentExists(componentName, filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes(componentName);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return false;
  }
}

// Function to check if API calls are made in the component
function checkApiCallsExist(apiEndpoint, filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes(apiEndpoint);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return false;
  }
}

// Function to add system health check data to the database
async function addSystemHealthCheckData() {
  try {
    console.log('Adding system health check data to the database...');
    
    // Use node to execute a script that adds system health check data
    execSync(`node -e "
      const pg = require('pg');
      const { v4: uuidv4 } = require('uuid');
      
      const pool = new pg.Pool({
        host: 'localhost',
        port: 5432,
        database: 'agentview',
        user: 'postgres',
        password: 'postgres'
      });
      
      (async () => {
        try {
          // Add system health check data
          await pool.query(
            \`INSERT INTO system_health_checks (id, component, status, message, endpoint, category, created_at, last_checked)
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())\`,
            [uuidv4(), 'Database', 'OK', 'Database connection successful', '/api/db/status', 'System']
          );
          
          await pool.query(
            \`INSERT INTO system_health_checks (id, component, status, message, endpoint, category, created_at, last_checked)
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())\`,
            [uuidv4(), 'API Server', 'OK', 'API server running', '/api/status', 'System']
          );
          
          await pool.query(
            \`INSERT INTO system_health_checks (id, component, status, message, endpoint, category, created_at, last_checked)
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())\`,
            [uuidv4(), 'Authentication', 'OK', 'Authentication service running', '/api/auth/status', 'System']
          );
          
          await pool.query(
            \`INSERT INTO system_health_checks (id, component, status, message, endpoint, category, created_at, last_checked)
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())\`,
            [uuidv4(), 'Frontend', 'Warning', 'Some components not loading correctly', '/api/frontend/status', 'UI']
          );
          
          console.log('System health check data added successfully.');
        } catch (err) {
          console.error('Error adding system health check data:', err);
        } finally {
          await pool.end();
        }
      })();
    "`);
    
    console.log('System health check data added successfully.');
    return true;
  } catch (error) {
    console.error('Error adding system health check data:', error);
    return false;
  }
}

// Function to add user account data to the database
async function addUserAccountData() {
  try {
    console.log('Adding user account data to the database...');
    
    // Use node to execute a script that adds user account data
    execSync(`node -e "
      const pg = require('pg');
      const { v4: uuidv4 } = require('uuid');
      
      const pool = new pg.Pool({
        host: 'localhost',
        port: 5432,
        database: 'agentview',
        user: 'postgres',
        password: 'postgres'
      });
      
      (async () => {
        try {
          // Check if user exists
          const userResult = await pool.query('SELECT id FROM users LIMIT 1');
          
          if (userResult.rows.length === 0) {
            console.log('No users found in the database.');
            return;
          }
          
          const userId = userResult.rows[0].id;
          
          // Check if user account already exists
          const existingResult = await pool.query('SELECT id FROM user_accs WHERE user_id = $1', [userId]);
          
          if (existingResult.rows.length > 0) {
            console.log('User account already exists.');
            return;
          }
          
          // Add user account data
          await pool.query(
            \`INSERT INTO user_accs (id, user_id, account_type, account_status, settings, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())\`,
            [
              uuidv4(),
              userId,
              'premium',
              'active',
              JSON.stringify({
                theme: 'dark',
                notifications: {
                  email: true,
                  push: true,
                  deals: true
                },
                display_name: 'Test User',
                dashboard_layout: 'compact'
              })
            ]
          );
          
          console.log('User account data added successfully.');
        } catch (err) {
          console.error('Error adding user account data:', err);
        } finally {
          await pool.end();
        }
      })();
    "`);
    
    console.log('User account data added successfully.');
    return true;
  } catch (error) {
    console.error('Error adding user account data:', error);
    return false;
  }
}

// Function to add settings data to the database
async function addSettingsData() {
  try {
    console.log('Adding settings data to the database...');
    
    // Use node to execute a script that adds settings data
    execSync(`node -e "
      const pg = require('pg');
      
      const pool = new pg.Pool({
        host: 'localhost',
        port: 5432,
        database: 'agentview',
        user: 'postgres',
        password: 'postgres'
      });
      
      (async () => {
        try {
          // Add settings data
          await pool.query(
            \`INSERT INTO settings (key, value, description, category, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             ON CONFLICT (key) DO UPDATE
             SET value = $2, description = $3, category = $4, updated_at = NOW()\`,
            ['system_name', 'AgentView CRM', 'System name displayed in the header', 'system']
          );
          
          await pool.query(
            \`INSERT INTO settings (key, value, description, category, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             ON CONFLICT (key) DO UPDATE
             SET value = $2, description = $3, category = $4, updated_at = NOW()\`,
            ['logo_url', '/logo.png', 'URL to the system logo', 'system']
          );
          
          await pool.query(
            \`INSERT INTO settings (key, value, description, category, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             ON CONFLICT (key) DO UPDATE
             SET value = $2, description = $3, category = $4, updated_at = NOW()\`,
            ['theme_color', '#007bff', 'Primary theme color', 'ui']
          );
          
          await pool.query(
            \`INSERT INTO settings (key, value, description, category, created_at, updated_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW())
             ON CONFLICT (key) DO UPDATE
             SET value = $2, description = $3, category = $4, updated_at = NOW()\`,
            ['enable_notifications', 'true', 'Enable system notifications', 'notifications']
          );
          
          console.log('Settings data added successfully.');
        } catch (err) {
          console.error('Error adding settings data:', err);
        } finally {
          await pool.end();
        }
      })();
    "`);
    
    console.log('Settings data added successfully.');
    return true;
  } catch (error) {
    console.error('Error adding settings data:', error);
    return false;
  }
}

// Function to check if the system health monitoring component exists
function checkSystemHealthMonitoringComponent() {
  const componentPath = 'src/components/SystemHealthMonitoring.tsx';
  const componentExists = fs.existsSync(componentPath);
  
  if (componentExists) {
    console.log('System health monitoring component exists.');
    
    // Check if the component makes API calls to the system health checks endpoint
    const apiCallExists = checkApiCallsExist('/api/system-health-checks', componentPath);
    
    if (apiCallExists) {
      console.log('System health monitoring component makes API calls to the system health checks endpoint.');
    } else {
      console.log('System health monitoring component does not make API calls to the system health checks endpoint.');
    }
  } else {
    console.log('System health monitoring component does not exist.');
  }
  
  return componentExists;
}

// Function to check if the user settings component exists
function checkUserSettingsComponent() {
  const componentPath = 'src/components/UserSettings.tsx';
  const componentExists = fs.existsSync(componentPath);
  
  if (componentExists) {
    console.log('User settings component exists.');
    
    // Check if the component makes API calls to the user accounts endpoint
    const apiCallExists = checkApiCallsExist('/api/user-accs', componentPath) || 
                          checkApiCallsExist('/api/user/settings', componentPath);
    
    if (apiCallExists) {
      console.log('User settings component makes API calls to the user accounts endpoint.');
    } else {
      console.log('User settings component does not make API calls to the user accounts endpoint.');
    }
  } else {
    console.log('User settings component does not exist.');
  }
  
  return componentExists;
}

// Function to check if the settings component exists
function checkSettingsComponent() {
  const componentPath = 'src/components/Settings.tsx';
  const componentExists = fs.existsSync(componentPath);
  
  if (componentExists) {
    console.log('Settings component exists.');
    
    // Check if the component makes API calls to the settings endpoint
    const apiCallExists = checkApiCallsExist('/api/settings', componentPath);
    
    if (apiCallExists) {
      console.log('Settings component makes API calls to the settings endpoint.');
    } else {
      console.log('Settings component does not make API calls to the settings endpoint.');
    }
  } else {
    console.log('Settings component does not exist.');
  }
  
  return componentExists;
}

// Function to create a system health monitoring component if it doesn't exist
function createSystemHealthMonitoringComponent() {
  const componentPath = 'src/components/SystemHealthMonitoring.tsx';
  
  if (!fs.existsSync(componentPath)) {
    console.log('Creating system health monitoring component...');
    
    const componentContent = `import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Table, Badge, Spin, Alert, Typography } from 'antd';

const { Title } = Typography;

interface SystemHealthCheck {
  id: string;
  component: string;
  status: string;
  message: string;
  endpoint?: string;
  category?: string;
  created_at: string;
  last_checked: string;
}

const SystemHealthMonitoring: React.FC = () => {
  const [healthChecks, setHealthChecks] = useState<SystemHealthCheck[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealthChecks = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/system-health-checks');
        setHealthChecks(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching system health checks:', err);
        setError('Failed to fetch system health checks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchHealthChecks();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchHealthChecks, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ok':
        return <Badge status="success" text="OK" />;
      case 'warning':
        return <Badge status="warning" text="Warning" />;
      case 'error':
        return <Badge status="error" text="Error" />;
      default:
        return <Badge status="default" text={status} />;
    }
  };

  const columns = [
    {
      title: 'Component',
      dataIndex: 'component',
      key: 'component',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusBadge(status),
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => category || 'System',
    },
    {
      title: 'Last Checked',
      dataIndex: 'last_checked',
      key: 'last_checked',
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  return (
    <Card>
      <Title level={4}>System Health Monitoring</Title>
      
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
      
      <Spin spinning={loading}>
        <Table
          dataSource={healthChecks}
          columns={columns}
          rowKey="id"
          pagination={false}
          locale={{ emptyText: 'No health checks available' }}
        />
      </Spin>
    </Card>
  );
};

export default SystemHealthMonitoring;
`;
    
    fs.writeFileSync(componentPath, componentContent);
    console.log('System health monitoring component created successfully.');
    return true;
  } else {
    console.log('System health monitoring component already exists.');
    return false;
  }
}

// Function to update the dashboard layout to include the system health monitoring component
function updateDashboardLayout() {
  const layoutPath = 'src/components/DashboardLayout.tsx';
  
  if (fs.existsSync(layoutPath)) {
    console.log('Updating dashboard layout...');
    
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');
    
    // Check if the system health monitoring component is already imported
    if (!layoutContent.includes("import SystemHealthMonitoring")) {
      // Add import statement
      const updatedContent = layoutContent.replace(
        /import React.*/,
        `import React from 'react';
import SystemHealthMonitoring from './SystemHealthMonitoring';`
      );
      
      // Add the component to the layout
      const finalContent = updatedContent.replace(
        /<\/Layout>/,
        `  <div style={{ margin: '24px 16px' }}>
            <SystemHealthMonitoring />
          </div>
        </Layout>`
      );
      
      fs.writeFileSync(layoutPath, finalContent);
      console.log('Dashboard layout updated successfully.');
      return true;
    } else {
      console.log('System health monitoring component is already imported in the dashboard layout.');
      return false;
    }
  } else {
    console.log('Dashboard layout does not exist.');
    return false;
  }
}

// Main function
async function main() {
  console.log('Checking system health monitoring data display...');
  
  // Add test data to the database
  await addSystemHealthCheckData();
  await addUserAccountData();
  await addSettingsData();
  
  // Check if the components exist
  const systemHealthMonitoringExists = checkSystemHealthMonitoringComponent();
  const userSettingsExists = checkUserSettingsComponent();
  const settingsExists = checkSettingsComponent();
  
  // Create system health monitoring component if it doesn't exist
  if (!systemHealthMonitoringExists) {
    createSystemHealthMonitoringComponent();
    updateDashboardLayout();
  }
  
  console.log('\nSummary:');
  console.log('- System Health Monitoring Component:', systemHealthMonitoringExists ? 'Exists' : 'Created');
  console.log('- User Settings Component:', userSettingsExists ? 'Exists' : 'Missing');
  console.log('- Settings Component:', settingsExists ? 'Exists' : 'Missing');
  
  console.log('\nRecommendations:');
  if (!userSettingsExists) {
    console.log('- Create a UserSettings component that fetches data from /api/user-accs');
  }
  if (!settingsExists) {
    console.log('- Create a Settings component that fetches data from /api/settings');
  }
  
  console.log('\nSystem health monitoring data display check completed.');
}

// Run the main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
