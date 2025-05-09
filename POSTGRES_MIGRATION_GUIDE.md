# PostgreSQL Migration Guide

This guide explains how to migrate the application from Supabase to PostgreSQL.

## Overview

The application was originally built using Supabase as the backend database service. We've created a compatibility layer that allows the application to work with a PostgreSQL database instead of Supabase, without requiring significant changes to the frontend code.

## Key Components

1. **Supabase PostgreSQL Adapter**: A compatibility layer that mimics the Supabase client API but redirects calls to our REST API endpoints that connect to PostgreSQL.
2. **PostgreSQL Docker Setup**: A Docker Compose configuration for running PostgreSQL locally.
3. **Environment Configuration**: Environment variables to control whether to use Supabase or PostgreSQL.

## Migration Steps

### 1. Check PostgreSQL Connection

First, check if PostgreSQL is running and properly configured:

```bash
node check-postgres-connection.js
```

This script will check if PostgreSQL is running and accessible, and provide instructions if it's not.

### 2. Start PostgreSQL and the Application

To start PostgreSQL in Docker and run the application with the Supabase to PostgreSQL adapter:

```bash
node run-postgres-app.js
```

This script will:
- Create a `.env.postgres` file with the necessary environment variables
- Copy the `.env.postgres` file to `.env`
- Check if Docker and Docker Compose are installed
- Start PostgreSQL in Docker using the `docker-compose.postgres.yml` file
- Wait for PostgreSQL to be ready
- Run the application with the Supabase to PostgreSQL adapter

### 3. Manual Setup (if needed)

If you prefer to set up PostgreSQL manually:

1. Install PostgreSQL:
   - Windows: Download and install from https://www.postgresql.org/download/windows/
   - Linux: `sudo apt-get install postgresql`
   - macOS: `brew install postgresql`

2. Start PostgreSQL:
   - Windows: Start the service in Services app
   - Linux: `sudo systemctl start postgresql`
   - macOS: `brew services start postgresql`

3. Create the database and tables:
   ```bash
   psql -U postgres -c "CREATE DATABASE agentview;"
   psql -U postgres -d agentview -f supabase-export/create_tables.sql
   psql -U postgres -d agentview -f supabase-export/create_auth_tables.sql
   psql -U postgres -d agentview -f supabase-export/insert_data.sql
   psql -U postgres -d agentview -f setup-db-permissions.sql
   ```

4. Set environment variables in `.env`:
   ```
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_DB=agentview
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   USE_POSTGRES=true
   VITE_USE_POSTGRES=true
   ```

5. Run the application:
   ```bash
   node run-fixed-postgres-docker.js
   ```

## How It Works

### Supabase PostgreSQL Adapter

The adapter in `src/lib/supabase-postgres-adapter.js` implements the Supabase client API interface but redirects all calls to our REST API. It provides:

- Mock data for tables that don't exist in our API
- Handling of all CRUD operations (Create, Read, Update, Delete)
- Implementation of the Supabase auth API
- Implementation of the Supabase storage API
- Handling of RPC (Remote Procedure Call) functions

### Environment Variables

The application checks for the following environment variables to determine whether to use Supabase or PostgreSQL:

- `USE_POSTGRES`: Set to `true` to use PostgreSQL instead of Supabase
- `VITE_USE_POSTGRES`: Same as `USE_POSTGRES`, but for the frontend

### PostgreSQL Connection

The PostgreSQL connection is configured using the following environment variables:

- `POSTGRES_HOST`: PostgreSQL host (default: `localhost`)
- `POSTGRES_PORT`: PostgreSQL port (default: `5432`)
- `POSTGRES_DB`: PostgreSQL database name (default: `agentview`)
- `POSTGRES_USER`: PostgreSQL username (default: `postgres`)
- `POSTGRES_PASSWORD`: PostgreSQL password (default: `postgres`)

## Troubleshooting

### PostgreSQL Connection Issues

If you're having issues connecting to PostgreSQL:

1. Check if PostgreSQL is running:
   ```bash
   node check-postgres-connection.js
   ```

2. Check the PostgreSQL logs:
   ```bash
   docker logs agentview-postgres
   ```

3. Check if the PostgreSQL port is accessible:
   ```bash
   # Windows
   netstat -an | findstr 5432
   
   # Linux/macOS
   netstat -an | grep 5432
   ```

4. Check if the PostgreSQL container is running:
   ```bash
   docker ps
   ```

### Application Issues

If the application is not working correctly:

1. Check if the environment variables are set correctly:
   ```bash
   cat .env
   ```

2. Check if the Supabase PostgreSQL adapter is being used:
   ```bash
   # Look for this message in the console
   Using PostgreSQL instead of Supabase
   ```

3. Check the application logs for errors.

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Supabase Documentation](https://supabase.io/docs)
- [PostgreSQL Migration Adapter Documentation](POSTGRES_MIGRATION_ADAPTER.md)
