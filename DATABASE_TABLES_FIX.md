# Database Tables Fix Documentation

## Overview

This document provides detailed information about the database tables that have been created to fix the missing tables issue. The following tables have been created:

1. `system_health_checks`
2. `user_accs`
3. `settings`

## Table Schemas

### system_health_checks

This table stores system health check data, including the status of various endpoints, response times, and status codes.

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

#### Columns

- `id`: A UUID that uniquely identifies each health check.
- `endpoint`: The URL of the endpoint that was checked.
- `category`: The category of the endpoint (e.g., 'api', 'auth', 'dashboard').
- `status`: The status of the endpoint ('ok' or 'error').
- `response_time`: The time it took to get a response from the endpoint, in milliseconds.
- `status_code`: The HTTP status code returned by the endpoint.
- `created_at`: The timestamp when the health check was created.

#### Indexes

- `idx_system_health_checks_category`: An index on the `category` column for faster filtering by category.
- `idx_system_health_checks_created_at`: An index on the `created_at` column for faster filtering by date.

### user_accs

This table stores user account data, including display names, theme preferences, and notification preferences.

```sql
CREATE TABLE IF NOT EXISTS user_accs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  display_name VARCHAR(100),
  theme_preference JSONB,
  notification_preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_accs_user_id ON user_accs(user_id);
```

#### Columns

- `id`: A serial integer that uniquely identifies each user account.
- `user_id`: A UUID that references the user in the authentication system.
- `display_name`: The display name of the user.
- `theme_preference`: A JSONB object containing the user's theme preferences.
- `notification_preferences`: A JSONB object containing the user's notification preferences.
- `created_at`: The timestamp when the user account was created.
- `updated_at`: The timestamp when the user account was last updated.

#### Indexes

- `idx_user_accs_user_id`: An index on the `user_id` column for faster lookups by user ID.

### settings

This table stores application settings, organized by category and key.

```sql
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) NOT NULL,
  value JSONB NOT NULL,
  category VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(category, key)
);

CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
```

#### Columns

- `id`: A serial integer that uniquely identifies each setting.
- `key`: The key of the setting.
- `value`: A JSONB object containing the value of the setting.
- `category`: The category of the setting.
- `created_at`: The timestamp when the setting was created.
- `updated_at`: The timestamp when the setting was last updated.

#### Constraints

- `UNIQUE(category, key)`: Ensures that each combination of category and key is unique.

#### Indexes

- `idx_settings_category`: An index on the `category` column for faster filtering by category.
- `idx_settings_key`: An index on the `key` column for faster lookups by key.

## Implementation

The tables are created using the `create-missing-tables.sql` script, which is executed by the `apply-missing-tables.js` script. The script checks if the tables already exist before creating them, so it can be run multiple times without error.

```javascript
// apply-missing-tables.js
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a PostgreSQL client
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Apply the SQL to create the missing tables
 */
async function applyMissingTables() {
  console.log('Applying SQL to create missing tables...');
  
  try {
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'create-missing-tables.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Connect to the database
    const client = await pool.connect();
    
    try {
      // Execute the SQL
      await client.query(sql);
      
      console.log('Missing tables created successfully.');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error applying SQL to create missing tables:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the function
applyMissingTables();
```

## Sample Data

### system_health_checks

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "endpoint": "/api/auth/status",
  "category": "auth",
  "status": "ok",
  "response_time": 45,
  "status_code": 200,
  "created_at": "2025-05-10T00:00:00.000Z"
}
```

### user_accs

```json
{
  "id": 1,
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "display_name": "John Doe",
  "theme_preference": {
    "name": "dark",
    "dark_mode": true
  },
  "notification_preferences": {
    "enabled": true,
    "email": true,
    "push": true
  },
  "created_at": "2025-05-10T00:00:00.000Z",
  "updated_at": "2025-05-10T00:00:00.000Z"
}
```

### settings

```json
{
  "id": 1,
  "key": "theme",
  "value": {
    "default": "light",
    "options": ["light", "dark", "system"]
  },
  "category": "appearance",
  "created_at": "2025-05-10T00:00:00.000Z",
  "updated_at": "2025-05-10T00:00:00.000Z"
}
```

## API Integration

These tables are integrated with the API through the following handlers:

- `system-health-checks-handler.js`: Handlers for system health checks routes
- `user-accs-handler.js`: Handlers for user accounts routes
- `settings-handler.js`: Handlers for settings routes

These handlers provide CRUD operations for each table.

## Frontend Integration

The data from these tables is displayed in the frontend through the following components:

- `UserSettings.tsx`: Displays user account data and settings
- `SystemHealthMonitor.tsx`: Displays system health check data

## Troubleshooting

If you encounter issues with these tables, check the following:

1. Make sure the database is running and accessible.
2. Check that the tables exist in the database.
3. Verify that the API endpoints are working correctly.
4. Check the server logs for any errors related to these tables.
5. Ensure that the frontend components are correctly fetching data from the API.

## Maintenance

To maintain these tables:

1. Regularly back up the data.
2. Monitor the size of the `system_health_checks` table, as it can grow quickly.
3. Consider implementing a data retention policy for the `system_health_checks` table.
4. Update the schema as needed to accommodate new features.
5. Keep this documentation up to date with any changes to the schema.
