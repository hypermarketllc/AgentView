#!/bin/bash
# Script to run the MyAgentView CRM application with Nginx using Docker

# Set script to exit on error
set -e

# Display banner
echo "====================================="
echo "  MyAgentView CRM - Nginx Deployment"
echo "====================================="
echo

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running. Please start Docker and try again."
  exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose > /dev/null 2>&1; then
  echo "Error: docker-compose is not installed. Please install it and try again."
  exit 1
fi

# Stop any existing containers
echo "Stopping any existing containers..."
docker-compose -f docker-compose.nginx.yml down

# Build and start the containers
echo "Building and starting containers..."
docker-compose -f docker-compose.nginx.yml up -d --build

# Wait for the application to start
echo "Waiting for the application to start..."
sleep 5

# Check if the application is running
if docker-compose -f docker-compose.nginx.yml ps | grep -q "crm-nginx.*Up"; then
  echo
  echo "====================================="
  echo "  MyAgentView CRM is now running!"
  echo "====================================="
  echo
  echo "Access the application at: http://localhost/crm"
  echo
  echo "To view logs, run:"
  echo "  docker-compose -f docker-compose.nginx.yml logs -f nginx"
  echo
  echo "To stop the application, run:"
  echo "  docker-compose -f docker-compose.nginx.yml down"
  echo
else
  echo
  echo "Error: The application failed to start. Check the logs with:"
  echo "  docker-compose -f docker-compose.nginx.yml logs"
  echo
  exit 1
fi