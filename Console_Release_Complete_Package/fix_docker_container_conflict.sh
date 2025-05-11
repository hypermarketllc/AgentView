#!/bin/bash

# Script to fix Docker container name conflict
# This script checks if the container exists, stops and removes it if it does,
# and then starts the docker-compose with the error-logging configuration

echo "Checking for existing crm-db container..."

# Check if the container exists
if docker ps -a --format '{{.Names}}' | grep -q "crm-db"; then
    echo "Container crm-db exists. Stopping and removing it..."
    
    # Stop the container if it's running
    docker stop crm-db
    
    # Remove the container
    docker rm crm-db
    
    echo "Container crm-db has been removed."
else
    echo "No existing crm-db container found."
fi

echo "Starting docker-compose with error-logging configuration..."

# Start the docker-compose with the error-logging configuration
docker-compose -f docker-compose.error-logging.yml up --build -d

echo "Docker containers started successfully."
