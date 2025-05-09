# PostgreSQL Migration Guide

This guide documents the process of migrating from Supabase to a PostgreSQL database for the MyAgentView CRM application.

## Overview

The application has been updated to work with both Supabase and PostgreSQL databases. The migration involved:

1. Creating a compatibility layer in `src/lib/supabase.ts` that redirects Supabase API calls to PostgreSQL
2. Implementing proper authentication with JWT tokens and bcrypt password hashing
3. Fixing token refresh mechanisms
4. Ensuring proper error handling throughout the application

## Key Files Modified

- `src/lib/supabase.ts` - Added compatibility layer for PostgreSQL
- `src/lib/auth.ts` - Updated authentication functions to work with PostgreSQL
- `src/contexts/AuthContext.tsx` - Fixed token refresh and error handling
- `server-postgres.js` - Backend server for PostgreSQL database
- `server-postgres-docker.js` - Docker-compatible backend server

## Authentication System

The authentication system has been completely overhauled:

1. **Password Security**: All passwords are now hashed using bcrypt
2. **Token Management**: 
   - Access tokens (24-hour expiry)
   - Refresh tokens (7-day expiry)
3. **Token Refresh**: Automatic token refresh when access tokens expire
4. **Development Mode**: Test accounts only work in development mode

## Environment Variables

The following environment variables are used:

```
# PostgreSQL Connection
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=crm_db
POSTGRES_USER=crm_user
POSTGRES_PASSWORD=your_strong_password_here

# JWT Secret
JWT_SECRET=your_jwt_secret

# Mode
NODE_ENV=production  # Set to 'development' for development features
```

## Running with PostgreSQL

### Local Development

1. Start the PostgreSQL database:
   ```
   ./run-postgres.sh  # or run-postgres.bat on Windows
   ```

2. Run the application with PostgreSQL:
   ```
   ./run-postgres-docker.sh  # or run-postgres-docker.bat on Windows
   ```

### Docker Deployment

1. Use the provided Docker Compose file:
   ```
   docker-compose -f docker-compose.postgres.yml up -d
   ```

## Database Schema

The PostgreSQL database uses the same schema as Supabase. The schema can be found in:

- `supabase-export/create_tables.sql` - Main tables
- `supabase-export/create_auth_tables.sql` - Authentication tables
- `supabase-export/insert_data.sql` - Initial data

## Security Considerations

1. **Password Storage**: All passwords are hashed using bcrypt with a salt
2. **Token Security**: JWT tokens with appropriate expiry times
3. **Development Mode**: Special test accounts only work in development mode
4. **Error Handling**: Proper error handling to prevent information leakage

## Troubleshooting

### Common Issues

1. **Connection Refused**: Check that PostgreSQL is running and accessible
2. **Authentication Failed**: Ensure JWT_SECRET is consistent across environments
3. **Missing Tables**: Run the schema creation scripts if tables are missing
4. **path-to-regexp Errors**: The application includes a deep patch for handling invalid route patterns
5. **PostgreSQL Version Compatibility**: The application is configured to use PostgreSQL 15. Using PostgreSQL 16 may cause compatibility issues with existing data directories.

### Debugging

1. Check server logs for detailed error messages
2. Verify environment variables are correctly set
3. Ensure bcrypt is properly installed and working
4. Run the `node find-route-errors.mjs` script to identify problematic routes

### Path-to-regexp Error Fix

If you encounter the "Missing parameter name" error from path-to-regexp:

1. The application includes a deep patch that modifies the path-to-regexp library directly
2. This patch is automatically applied when running the application with `run-postgres-docker.sh` or `run-postgres-docker.bat`
3. The patch creates a backup of the original file at `node_modules/path-to-regexp/dist/index.original.js`
4. If you need to restore the original file, you can copy the backup back to `node_modules/path-to-regexp/dist/index.js`

## Future Improvements

1. Implement token blacklisting for better security
2. Add rate limiting to prevent brute force attacks
3. Implement more comprehensive error logging
4. Add database migrations for schema changes
