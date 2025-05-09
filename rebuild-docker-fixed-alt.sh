#!/bin/bash

# Stop specific containers
echo "Stopping specific containers..."
docker stop crm-app crm-db
docker rm crm-app crm-db

# Copy our fixed Dockerfile
echo "Copying fixed Dockerfile..."
cp Dockerfile.fixed Dockerfile

# Rebuild the Docker image
echo "Rebuilding Docker image with path-to-regexp fix..."
docker-compose build app

# Start the containers
echo "Creating and starting containers with fixed configuration..."
docker-compose up -d

# Show logs
echo "Showing container logs (press Ctrl+C to exit)..."
docker-compose logs -f
