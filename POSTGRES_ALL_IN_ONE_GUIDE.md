# PostgreSQL All-in-One Runner Guide

This guide explains how to use the PostgreSQL All-in-One Runner script to easily migrate your application from Supabase to PostgreSQL.

## Overview

The `run-postgres-all` script is a comprehensive solution that handles everything needed to run your application with PostgreSQL:

1. **Environment Setup**: Creates and configures the necessary environment files
2. **PostgreSQL Management**: Starts PostgreSQL in Docker and ensures it's ready
3. **Database Setup**: Creates the database, imports schema and data if needed
4. **Application Execution**: Runs the application with the Supabase to PostgreSQL adapter
5. **Detailed Logging**: Provides comprehensive logs for troubleshooting

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [Docker](https://www.docker.com/products/docker-desktop)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Usage

### Windows

1. Open Command Prompt or PowerShell
2. Navigate to your project directory
3. Run the script:
   ```
   run-postgres-all.bat
   ```

### Linux/macOS

1. Open Terminal
2. Navigate to your project directory
3. Make the script executable (first time only):
   ```bash
   chmod +x run-postgres-all.sh
   ```
   or use the provided helper script:
   ```bash
   chmod +x make-scripts-executable.sh
   ./make-scripts-executable.sh
   ```
4. Run the script:
   ```bash
   ./run-postgres-all.sh
   ```

## What the Script Does

1. **Environment Setup**
   - Creates a `.env.postgres` file if it doesn't exist
   - Copies `.env.postgres` to `.env` to configure the application

2. **Docker Checks**
   - Verifies Docker and Docker Compose are installed
   - Provides helpful error messages if they're not

3. **PostgreSQL Setup**
   - Starts PostgreSQL in Docker using `docker-compose.postgres.yml`
   - Waits for PostgreSQL to be ready
   - Creates the database if it doesn't exist

4. **Database Initialization**
   - Checks if tables exist in the database
   - If not, imports schema and data from the Supabase export files
   - Sets up permissions

5. **Application Execution**
   - Runs the application with the Supabase to PostgreSQL adapter
   - Sets the necessary environment variables

6. **Logging**
   - Creates a timestamped log file for each run
   - Logs all operations, errors, and warnings
   - Provides detailed troubleshooting information

## Troubleshooting

If you encounter any issues, check the log file created in your project directory. It will have a name like `postgres-migration-2025-05-07T08-30-45-123Z.log`.

### Common Issues

1. **Docker not running**
   - Make sure Docker Desktop is running
   - Restart Docker if necessary

2. **Port conflicts**
   - If PostgreSQL fails to start, check if port 5432 is already in use
   - You can change the port in `.env.postgres` and `docker-compose.postgres.yml`

3. **Database import errors**
   - Check if the SQL files exist in the `supabase-export` directory
   - Verify the SQL files are valid

4. **Application errors**
   - Check the application logs for specific errors
   - Verify the Supabase to PostgreSQL adapter is properly configured

5. **PostgreSQL container not starting properly**
   - If the PostgreSQL container fails to start or become ready, you can use the cleanup scripts to remove the container and volume, then try again:
   
   ```bash
   # Windows
   cleanup-postgres-docker.bat
   
   # Linux/macOS
   ./cleanup-postgres-docker.sh
   ```
   
   - After cleaning up, run the all-in-one script again:
   
   ```bash
   # Windows
   run-postgres-all.bat
   
   # Linux/macOS
   ./run-postgres-all.sh
   ```

## Customization

You can customize the PostgreSQL configuration by editing the `.env.postgres` file:

```
# PostgreSQL Connection
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=agentview
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Use PostgreSQL instead of Supabase
USE_POSTGRES=true
VITE_USE_POSTGRES=true

# Server Configuration
PORT=3000
NODE_ENV=development
```

## Advanced Usage

If you need to run the script with custom options, you can use the Node.js script directly:

```bash
node run-postgres-all.mjs
```

## Conclusion

The PostgreSQL All-in-One Runner script simplifies the process of migrating from Supabase to PostgreSQL. It handles all the necessary setup and configuration, allowing you to focus on developing your application.

If you need to make changes to your application code, you can simply run the script again, and it will handle everything for you.
