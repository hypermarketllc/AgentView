# PostgreSQL Migration Documentation

This document outlines the changes made to migrate the application from Supabase to a PostgreSQL database.

## Overview

The application was previously using Supabase as its database backend. To improve flexibility and control, we've migrated to a direct PostgreSQL database connection. This migration involved:

1. Setting up PostgreSQL connection configuration
2. Creating server-side API endpoints for database operations
3. Updating frontend components to use the new API endpoints
4. Ensuring authentication works properly with the new database

## Database Connection Setup

The PostgreSQL connection is configured in `src/lib/postgres.ts`:

```typescript
import { Pool, QueryResult } from 'pg';

// Create a connection pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'crm_db',
  user: process.env.POSTGRES_USER || 'crm_user',
  password: process.env.POSTGRES_PASSWORD || 'your_strong_password_here'
});

// Test database connection
pool.query('SELECT NOW()', (err: Error | null, res: QueryResult<any>) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected:', res.rows[0]);
  }
});

export default pool;
```

## Authentication Changes

Authentication has been updated to work with PostgreSQL instead of Supabase:

1. The `src/lib/auth.ts` file now uses the PostgreSQL pool for user authentication
2. JWT token generation and verification remain the same
3. User data is now fetched directly from the PostgreSQL database

### Server-Side Authentication Routes

Authentication routes were added to `server-docker-auth.js`:

- `/crm/api/auth/login` - Handles user login
- `/crm/api/auth/register` - Handles user registration
- `/crm/api/auth/me` - Gets the current authenticated user

## API Endpoints

New API endpoints were added to handle various operations:

### User Settings API

Added to `server-docker-routes.js`:

- `GET /crm/api/user/settings` - Retrieves user settings
- `PUT /crm/api/user/settings` - Updates user settings
- `PUT /crm/api/user/password` - Updates user password

These endpoints are used by the frontend to manage user settings.

## Frontend Changes

### API Client

The `src/lib/api.ts` file was updated to include new API methods for user settings:

```typescript
// User Settings API
export const userSettingsAPI = {
  getSettings: async () => {
    const response = await api.get('/user/settings');
    return response.data;
  },
  
  updateSettings: async (settings: any) => {
    const response = await api.put('/user/settings', settings);
    return response.data;
  },
  
  updatePassword: async (password: string) => {
    const response = await api.put('/user/password', { password });
    return response.data;
  }
};
```

### Components

The `UserSettings.tsx` component was updated to use the new API endpoints instead of direct Supabase calls:

1. Removed all direct Supabase client imports and calls
2. Updated to use the `userSettingsAPI` methods for fetching and updating user data
3. Modified the component to work with the data structure returned by the PostgreSQL API

## Database Schema

The database schema remains largely the same, with tables for:

- `users` - User information
- `auth_users` - Authentication information
- `user_accs` - User account settings
- `positions` - User positions
- `deals` - Deal information
- `carriers` - Carrier information
- `products` - Product information

## Environment Variables

The following environment variables are used for PostgreSQL configuration:

- `POSTGRES_HOST` - PostgreSQL host (default: 'localhost')
- `POSTGRES_PORT` - PostgreSQL port (default: '5432')
- `POSTGRES_DB` - PostgreSQL database name (default: 'crm_db')
- `POSTGRES_USER` - PostgreSQL username (default: 'crm_user')
- `POSTGRES_PASSWORD` - PostgreSQL password

## Testing

To test the PostgreSQL connection, you can use:

```bash
node check-postgres-connection.js
```

To test user authentication with PostgreSQL:

```bash
node check-admin-auth.js
```

## Troubleshooting

If you encounter issues with the PostgreSQL migration, check:

1. Database connection parameters in `.env` or `.env.local`
2. PostgreSQL server is running and accessible
3. Database schema is properly set up (see `supabase-export/create_tables.sql`)
4. User permissions are correctly configured (see `setup-db-permissions.sql`)

For more detailed troubleshooting, refer to `POSTGRES_MIGRATION_TROUBLESHOOTING.md`.
