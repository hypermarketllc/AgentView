# Local Deployment with Docker PostgreSQL

This guide explains how to run the application with a local frontend and PostgreSQL in Docker.

## Overview

This setup uses:
- PostgreSQL database running in Docker
- Frontend and backend running locally
- Error logging to the PostgreSQL database

## Prerequisites

- Docker and Docker Compose installed
- Node.js 16 or higher
- npm or yarn

## Setup Instructions

### 1. Start PostgreSQL in Docker

You can start only the PostgreSQL database in Docker using:

```bash
# On Linux/macOS
./run_postgres_docker.sh

# On Windows
run_postgres_docker.bat
```

This will:
- Start a PostgreSQL container with the name `crm-db-local`
- Start a pgAdmin container for database management
- Configure the database with the following settings:
  - Host: localhost
  - Port: 5432
  - Database: crm_db
  - User: crm_user
  - Password: your_strong_password_here

### 2. Run the Local Server with Docker PostgreSQL

To start the local server that connects to the Docker PostgreSQL database:

```bash
# On Linux/macOS
./run_local_with_docker_db.sh

# On Windows
run_local_with_docker_db.bat
```

This will:
- Start the PostgreSQL database in Docker if it's not already running
- Create the system_errors table if it doesn't exist
- Start the local server that connects to the Docker PostgreSQL database

### 3. Access the Application

- Main application: http://localhost:3000
- pgAdmin: http://localhost:5050
  - Email: admin@example.com
  - Password: admin_password

## Authentication

The current authentication system uses hardcoded credentials:

- Agent:
  - Email: agent@example.com
  - Password: Agent123!
  
- Admin:
  - Email: admin@americancoveragecenter.com
  - Password: Agent123!

### Planned Authentication Improvements

We plan to implement a more robust authentication system that:
1. Stores user credentials in the PostgreSQL database
2. Uses JWT tokens for authentication
3. Implements proper password hashing
4. Adds user management features

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:

1. Check if the PostgreSQL container is running:
   ```bash
   docker ps
   ```

2. If the container is not running, start it:
   ```bash
   docker-compose -f docker-compose.postgres-only.yml up -d
   ```

3. Check the database logs:
   ```bash
   docker logs crm-db-local
   ```

### Server Issues

If the server fails to start:

1. Check the server logs for errors
2. Ensure the system_errors table was created successfully
3. Verify the environment variables are set correctly

## File Structure

- `docker-compose.postgres-only.yml`: Docker Compose file for PostgreSQL only
- `run_postgres_docker.sh/bat`: Scripts to start PostgreSQL in Docker
- `run_local_with_docker_db.sh/bat`: Scripts to run the local server with Docker PostgreSQL
- `apply_system_errors_table.js`: Script to create the system_errors table
- `run_server_with_error_logging_fixed.js`: Main server file
