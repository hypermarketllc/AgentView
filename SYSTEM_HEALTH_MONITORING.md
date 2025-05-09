# System Health Monitoring Documentation

## Overview

This document provides information about the system health monitoring features implemented in the application. The system health monitoring is designed to track the health of various components of the application, including API endpoints, database connections, and user interface elements.

## Tables Created

The following tables have been created to support system health monitoring:

1. **system_health_checks**: Stores the results of health checks performed on various endpoints.
2. **system_errors**: Logs errors that occur in the system.
3. **user_accs**: Stores user account settings and preferences.
4. **settings**: Stores system-wide settings.

## API Endpoints

The following API endpoints have been implemented for system health monitoring:

- `GET /crm/api/system/health`: Get the current health status of the system.
- `GET /crm/api/system/health/summary`: Get a summary of the system health.
- `GET /crm/api/system/health/history`: Get the history of health checks.
- `GET /crm/api/system/health/checks`: Get all health checks.
- `POST /crm/api/system/health/run`: Run health checks manually.
- `POST /crm/api/system/health/checks`: Create a new health check.
- `DELETE /crm/api/system/health/checks/:id`: Delete a specific health check.
- `DELETE /crm/api/system/health/checks/all`: Delete all health checks.
- `GET /crm/api/system/errors/stats`: Get error statistics.
- `GET /crm/api/system/errors/:id`: Get details of a specific error.
- `GET /crm/api/user/settings`: Get user settings.
- `PUT /crm/api/user/settings`: Update user settings.
- `GET /crm/api/settings`: Get system settings.
- `PUT /crm/api/settings`: Update system settings.

## Health Check Categories

Health checks are categorized into the following groups:

1. **auth**: Authentication-related endpoints.
2. **user**: User-related endpoints.
3. **data**: Data-related endpoints.
4. **system**: System-related endpoints.

## Health Check Status

Health checks can have the following statuses:

- **PASS**: The endpoint is working correctly.
- **FAIL**: The endpoint is not working correctly.

## Monitoring Tools

### System Health Monitor Check

The `system-health-monitor-check.js` script is a comprehensive tool for checking the health of the system. It performs the following checks:

1. Verifies that all required tables exist in the database.
2. Checks if the tables have data.
3. Inserts test data if needed.
4. Tests all API endpoints to ensure they are working correctly.
5. Runs health checks to verify the system's overall health.

#### Running the Health Monitor Check

To run the health monitor check, use the following command:

```bash
node system-health-monitor-check.js
```

This will output a detailed report of the system's health, including:

- Table existence and data counts
- API endpoint status
- Health check results

### Automated Health Checks

The system also includes automated health checks that run periodically. These checks are scheduled using the `node-cron` package and are configured in the `scheduler-service.js` file.

## Troubleshooting

If you encounter issues with the system health monitoring, check the following:

1. **Database Connection**: Ensure that the database connection is configured correctly in the `.env` file.
2. **API Endpoints**: Verify that the API endpoints are accessible and returning the expected responses.
3. **Tables**: Check that all required tables exist and have the correct structure.
4. **Data**: Ensure that there is data in the tables for the health checks to analyze.

## Common Issues and Solutions

### No Data in Account Settings

If account settings data is not visible in the frontend:

1. Check if the `user_accs` table exists and has data.
2. Verify that the API endpoint for user settings is working.
3. Run the health monitor check to identify any issues.

### System Health Checks Not Working

If system health checks are not working:

1. Check if the `system_health_checks` table exists and has the correct structure.
2. Verify that the API endpoints for health checks are working.
3. Check if the scheduled tasks are running correctly.

## Adding New Health Checks

To add a new health check:

1. Use the `POST /crm/api/system/health/checks` endpoint with the following payload:

```json
{
  "endpoint": "/api/your-endpoint",
  "category": "your-category"
}
```

2. The system will automatically run the health check and store the result.

## Viewing Health Check Results

Health check results can be viewed in the following ways:

1. **API**: Use the `GET /crm/api/system/health` endpoint to get the current health status.
2. **Dashboard**: The system health dashboard in the frontend displays the health check results.
3. **Logs**: Health check results are also logged to the console.

## Conclusion

The system health monitoring features provide comprehensive tools for monitoring the health of the application. By regularly checking the health of the system, you can identify and resolve issues before they impact users.
