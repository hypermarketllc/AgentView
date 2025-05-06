#!/bin/bash
# Script to run the MyAgentView CRM application in development mode using Docker

# Set script to exit on error
set -e

# Display banner
echo "====================================="
echo "  MyAgentView CRM - Docker Development"
echo "====================================="
echo

# Check if Docker is installed
if ! command -v docker > /dev/null 2>&1; then
  echo "Error: Docker is not installed. Please install it and try again."
  exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose > /dev/null 2>&1; then
  echo "Error: Docker Compose is not installed. Please install it and try again."
  exit 1
fi

# Build and start the containers
echo "Building and starting the Docker containers..."
docker-compose -f docker-compose.dev.yml up --build -d

# Display information
echo
echo "Development server is running!"
echo "Access the application at: http://localhost:5173/crm"
echo
echo "To view logs, run: docker-compose -f docker-compose.dev.yml logs -f app"
echo "To stop the server, run: docker-compose -f docker-compose.dev.yml down"
echo