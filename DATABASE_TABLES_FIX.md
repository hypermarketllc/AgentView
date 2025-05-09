# Database Tables Fix and System Monitoring

This document explains the fixes applied to address the missing database tables and the implementation of a comprehensive system monitoring framework.

## Problem

The system was encountering errors due to missing database tables:

1. `system_health_checks` - For storing API health check results
2. `system_errors` - For tracking and analyzing errors
3. `user_accs` - For storing user account settings
4. `settings` - For system-wide settings

These missing tables were causing errors in the account settings section and preventing data from being displayed in the frontend.

## Solution

We've implemented a comprehensive solution that includes:

1. Creating the missing database tables
2. Implementing a robust error handling framework
3. Adding a system health monitoring service
4. Creating a unified API registry and route registration system
5. Adding scheduled tasks for regular health checks and cleanup

### 1. Database Tables

The following tables have been created:

#### system_health_checks

Stores the results of API health checks:

- `id` - UUID primary key
- `endpoint` - API endpoint path
- `category` - Category of the endpoint
- `status` - PASS or FAIL
- `response_time` - Response time in milliseconds
- `status_code` - HTTP status code
- `error_message` - Error message if any
- `response_data` - JSON response data
- `created_at` - Timestamp

#### system_errors

Tracks system errors for analysis:

- `id` - UUID primary key
- `code` - Error code
- `message` - Error message
- `status` - HTTP status code
- `endpoint` - API endpoint where the error occurred
- `request_id` - Unique request ID
- `details` - JSON with error details
- `stack_trace` - Error stack trace
- `user_id` - User ID if authenticated
- `created_at` - Timestamp

#### user_accs

Stores user account settings:

- `id` - UUID primary key
- `user_id` - User ID (foreign key)
- `theme` - UI theme preference
- `notification_preferences` - JSON with notification settings
- `dashboard_layout` - JSON with dashboard layout settings
- `created_at` - Timestamp
- `updated_at` - Timestamp

#### settings

Stores system-wide settings:

- `id` - UUID primary key
- `category` - Setting category
- `key` - Setting key
- `value` - JSON value
- `description` - Setting description
- `created_at` - Timestamp
- `updated_at` - Timestamp

### 2. Error Handling Framework

We've implemented a standardized error handling framework that:

- Defines custom error classes for different types of errors
- Provides a middleware for consistent error handling
- Records errors in the database for tracking and analysis
- Includes utilities for retrieving error statistics

### 3. System Health Monitoring

The health monitoring service:

- Runs health checks on all API endpoints
- Records the results in the database
- Provides endpoints for retrieving health check history and summaries
- Includes a scheduler for running health checks at regular intervals

### 4. API Registry and Route Registration

We've created a centralized API registry that:

- Defines all API endpoints with their paths, methods, and handlers
- Serves as a single source of truth for the API structure
- Is used by the route registrar to automatically register all routes
- Includes permission checking for different user roles

### 5. Scheduled Tasks

The scheduler service runs the following tasks:

- Health checks every 5 minutes
- Cleanup of old health check records (configurable retention period)
- Cleanup of old error records (configurable retention period)
- Daily error report generation

## How to Use

### Running the Application

To run the application with the fixed tables and monitoring:

```bash
node run-app-with-missing-tables.js
```

This script will:
1. Apply the missing tables to the database
2. Verify that the tables were created successfully
3. Start the server with the system monitoring enabled

### Accessing the System Monitoring Dashboard

The system monitoring dashboard is available at:

```
/crm/api/system/health/summary
```

This endpoint requires authentication with admin or owner level access (level 3+).

### API Endpoints

The following API endpoints are available for system monitoring:

#### Health Monitoring

- `GET /crm/api/system/health` - Basic health check (no auth required)
- `GET /crm/api/system/health/summary` - Get health summary
- `GET /crm/api/system/health/history` - Get health check history
- `POST /crm/api/system/health/run` - Run health checks
- `GET /crm/api/system/health/checks` - Get all health checks
- `POST /crm/api/system/health/checks` - Create a health check
- `DELETE /crm/api/system/health/checks/:id` - Delete a health check
- `DELETE /crm/api/system/health/checks/all` - Delete all health checks

#### Error Tracking

- `GET /crm/api/system/errors/stats` - Get error statistics
- `GET /crm/api/system/errors/:id` - Get error details

#### User Settings

- `GET /crm/api/user/settings` - Get user settings
- `PUT /crm/api/user/settings` - Update user settings

#### System Settings

- `GET /crm/api/settings` - Get system settings
- `PUT /crm/api/settings` - Update system settings

## Configuration

System settings can be configured through the settings table. The following settings are available:

### Retention Period

```json
{
  "health_checks": 7,
  "errors": 30
}
```

- `health_checks` - Number of days to keep health check records
- `errors` - Number of days to keep error records

### Notification Settings

```json
{
  "admin_email": true,
  "slack": false
}
```

- `admin_email` - Whether to send email notifications to admin
- `slack` - Whether to send Slack notifications

### Health Check Settings

```json
{
  "interval": 5,
  "timeout": 10000
}
```

- `interval` - Health check interval in minutes
- `timeout` - Health check timeout in milliseconds

## Troubleshooting

If you encounter issues with the system monitoring:

1. Check that the database tables exist:

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'system_health_checks'
);
```

2. Check that the API endpoints are registered:

```
GET /crm/api/system/health
```

3. Check the error logs for any issues:

```
GET /crm/api/system/errors/stats
```

## Future Improvements

Potential future improvements include:

1. Adding a visual dashboard for system monitoring
2. Implementing more detailed health checks for database and external services
3. Adding alerting capabilities for critical errors
4. Implementing user-specific dashboard layouts
5. Adding more granular permission controls for system monitoring
