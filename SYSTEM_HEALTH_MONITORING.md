# System Health Monitoring

## Overview

The System Health Monitoring feature provides real-time monitoring of various endpoints in the application. It checks the status of these endpoints, records the results, and displays them in a user-friendly interface.

## Components

The System Health Monitoring feature consists of the following components:

### 1. Database Table

The `system_health_checks` table stores the results of health checks:

```sql
CREATE TABLE IF NOT EXISTS system_health_checks (
  id UUID PRIMARY KEY,
  endpoint VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  response_time INTEGER NOT NULL,
  status_code INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_system_health_checks_category ON system_health_checks(category);
CREATE INDEX IF NOT EXISTS idx_system_health_checks_created_at ON system_health_checks(created_at);
```

### 2. API Endpoints

The following API endpoints are available for interacting with system health checks:

- `GET /api/system-health-checks`: Get all system health checks
- `GET /api/system-health-checks/:id`: Get a system health check by ID
- `POST /api/system-health-checks`: Create a system health check
- `DELETE /api/system-health-checks/:id`: Delete a system health check

### 3. System Health Monitor Service

The System Health Monitor service (`system-health-monitor.js`) periodically checks the status of various endpoints and saves the results to the database. It performs the following tasks:

1. Defines a list of endpoints to monitor
2. Checks each endpoint and records its status, response time, and status code
3. Saves the results to the `system_health_checks` table

### 4. Frontend Component

The `SystemHealthMonitor` component (`src/components/SystemHealthMonitor.tsx`) displays the results of health checks in a user-friendly interface. It provides the following features:

1. Displays a list of health checks with their status, response time, and status code
2. Allows filtering health checks by category
3. Provides a summary of the system health, including the number of healthy and failing endpoints

## How It Works

1. The System Health Monitor service periodically checks the status of various endpoints.
2. The results of these checks are saved to the `system_health_checks` table.
3. The `SystemHealthMonitor` component fetches these results from the API and displays them in a user-friendly interface.
4. Users can view the status of various endpoints, filter them by category, and see a summary of the system health.

## Configuration

The System Health Monitor service can be configured to monitor different endpoints by modifying the `endpoints` array in `system-health-monitor.js`:

```javascript
const endpoints = [
  { url: '/api/system-health-checks', category: 'api' },
  { url: '/api/user-accs', category: 'api' },
  { url: '/api/settings', category: 'api' },
  { url: '/api/auth/status', category: 'auth' },
  { url: '/api/dashboard', category: 'dashboard' }
];
```

You can add, remove, or modify endpoints as needed.

## Running the System Health Monitor

To run the System Health Monitor service, use the following command:

```
node system-health-monitor.js
```

This will check the status of all configured endpoints and save the results to the database.

## Checking the System Health Monitor

To check if the System Health Monitor is working correctly, use the following command:

```
node system-health-monitor-check.js
```

This will make requests to the API endpoints and display the results.

## Troubleshooting

If you encounter issues with the System Health Monitor, check the following:

1. Make sure the database is running and accessible.
2. Check that the `system_health_checks` table exists in the database.
3. Verify that the API endpoints are working correctly.
4. Check the server logs for any errors related to the System Health Monitor.
5. Ensure that the frontend component is correctly fetching data from the API.

## Best Practices

1. **Regular Monitoring**: Run the System Health Monitor service regularly to keep track of the health of your system.
2. **Alert on Failures**: Set up alerts to notify you when endpoints start failing.
3. **Historical Data**: Keep historical data to track trends and identify recurring issues.
4. **Dashboard**: Use the `SystemHealthMonitor` component to create a dashboard for monitoring system health.
5. **Documentation**: Keep this documentation up to date with any changes to the System Health Monitor.

## Future Enhancements

1. **Automated Alerts**: Implement automated alerts for failing endpoints.
2. **Historical Trends**: Add charts to visualize historical trends in endpoint health.
3. **Custom Checks**: Allow users to define custom health checks.
4. **Detailed Diagnostics**: Provide more detailed diagnostics for failing endpoints.
5. **Integration with Monitoring Tools**: Integrate with external monitoring tools like Prometheus or Grafana.
