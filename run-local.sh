#!/bin/bash
# Script to run the MyAgentView CRM application locally using Docker Compose

# Set script to exit on error
set -e

# Display banner
echo "====================================="
echo "  MyAgentView CRM - Local Deployment"
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

# Build and start the containers
echo "Building and starting containers..."
docker-compose -f docker-compose.local.yml up -d --build

# Wait for the application to start
echo "Waiting for the application to start..."
sleep 5

# Check if the application is running
if docker-compose -f docker-compose.local.yml ps | grep -q "crm-app-local.*Up"; then
  echo
  echo "====================================="
  echo "  MyAgentView CRM is now running!"
  echo "====================================="
  echo
  echo "Access the application at: http://localhost:3000/crm"
  echo
  echo "Default test account:"
  echo "  Email: agent@example.com"
  echo "  Password: Agent123!"
  echo
  echo "To stop the application, run:"
  echo "  docker-compose -f docker-compose.local.yml down"
  echo
else
  echo
  echo "Error: The application failed to start. Check the logs with:"
  echo "  docker-compose -f docker-compose.local.yml logs"
  echo
  exit 1
fi