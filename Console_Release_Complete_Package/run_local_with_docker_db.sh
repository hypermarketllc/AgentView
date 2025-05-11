#!/bin/bash

# Set environment variables for Docker PostgreSQL
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
export POSTGRES_DB=crm_db
export POSTGRES_USER=crm_user
export POSTGRES_PASSWORD=your_strong_password_here
export ERROR_LOGGING_ENABLED=true

# Stop and remove existing containers if they exist
echo "Stopping and removing existing containers if they exist..."
docker-compose -f docker-compose.postgres-only.yml down

# Start the PostgreSQL database
echo "Starting PostgreSQL database in Docker..."
docker-compose -f docker-compose.postgres-only.yml up -d

# Wait for the database to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 5

# Check if the database is running
echo "Checking database status..."
docker-compose -f docker-compose.postgres-only.yml ps

# Create system_errors table if it doesn't exist
echo "Creating system_errors table if it doesn't exist..."
node apply_system_errors_table.js

# Run the server
echo "Starting local server with Docker PostgreSQL..."
node run_server_with_error_logging_fixed.js
