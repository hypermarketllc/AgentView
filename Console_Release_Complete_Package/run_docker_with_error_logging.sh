#!/bin/bash

# run_docker_with_error_logging.sh
# Script to run the Docker container with error logging and console system enabled

# Set error handling
set -e

# Print banner
echo "=========================================================="
echo "  Running Docker with Error Logging and Console System"
echo "=========================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker and try again."
  exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose > /dev/null 2>&1; then
  echo "❌ docker-compose is not installed. Please install docker-compose and try again."
  exit 1
fi

# Navigate to the package directory
cd "$(dirname "$0")"

# Check if the docker-compose file exists
if [ ! -f "docker-compose.error-logging.yml" ]; then
  echo "❌ docker-compose.error-logging.yml not found."
  exit 1
fi

# Check if the SQL file exists
if [ ! -f "sql/create_system_errors_table.sql" ]; then
  echo "❌ SQL file not found: sql/create_system_errors_table.sql"
  exit 1
fi

# Create necessary directories
echo "🔄 Creating necessary directories..."
mkdir -p logs
mkdir -p frontend/components
mkdir -p frontend/layouts

# Build and start the containers
echo "🔄 Building and starting containers..."
docker-compose -f docker-compose.error-logging.yml up --build -d

# Wait for the database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Apply the system_errors table
echo "🔄 Applying system_errors table..."
docker-compose -f docker-compose.error-logging.yml exec app node Console_Release_Complete_Package/apply_system_errors_table_docker.js

# Run the patch system
echo "🔄 Running patch system..."
docker-compose -f docker-compose.error-logging.yml exec app node -e "try { require('./tools/patch/runPatch').runAllPatches().then(result => console.log('Patch result:', result)); } catch(e) { console.error('Error running patches:', e); }"

# Print success message
echo "✅ Docker containers are running with error logging and console system enabled."
echo "📊 Access the application at http://localhost:3000"
echo "📊 Access the Console Dashboard at http://localhost:3000/console"
echo "📊 Access pgAdmin at http://localhost:5050"
echo "   - Email: admin@example.com"
echo "   - Password: admin_password"
echo ""
echo "📋 To view logs:"
echo "   docker-compose -f docker-compose.error-logging.yml logs -f app"
echo ""
echo "🔍 To check system status:"
echo "   curl http://localhost:3000/api/console/status"
echo ""
echo "🛑 To stop the containers:"
echo "   docker-compose -f docker-compose.error-logging.yml down"
