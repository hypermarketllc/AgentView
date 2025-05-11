#!/bin/bash

# run_docker_with_error_logging_fixed.sh
# Script to run the Docker container with error logging enabled

# Stop and remove existing containers if they exist
echo "Stopping and removing existing containers..."
docker-compose -f docker-compose.error-logging.fixed.yml down

# Build and start the containers
echo "Building and starting containers..."
docker-compose -f docker-compose.error-logging.fixed.yml up --build -d

# Check if containers are running
echo "Checking container status..."
docker ps | grep crm-app-with-error-logging
docker ps | grep crm-db
docker ps | grep crm-pgadmin

echo "Waiting for database to be ready..."
sleep 5

# Apply system_errors table to the database
echo "Applying system_errors table to the database..."
docker exec crm-app-with-error-logging node Console_Release_Complete_Package/apply_system_errors_table_docker.js

echo "Done! The application is now running with error logging enabled."
echo "You can access the application at http://localhost:3000"
echo "You can access pgAdmin at http://localhost:5050"
echo "  - Email: admin@example.com"
echo "  - Password: admin_password"
