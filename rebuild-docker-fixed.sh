#!/bin/bash

# Stop and remove existing containers
echo "Stopping existing containers..."
docker-compose down

# Copy our fixed Dockerfile
echo "Copying fixed Dockerfile..."
cp Dockerfile.fixed Dockerfile

# Rebuild the Docker image
echo "Rebuilding Docker image with path-to-regexp fix..."
docker-compose build

# Start the containers
echo "Starting containers with fixed configuration..."
docker-compose up -d

# Show logs
echo "Showing container logs (press Ctrl+C to exit)..."
docker-compose logs -f
