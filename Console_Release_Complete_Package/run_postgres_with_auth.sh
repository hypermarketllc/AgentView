#!/bin/bash
# Script to run PostgreSQL in Docker and apply the users table

# Set up colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting PostgreSQL in Docker...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}Error: Docker is not running. Please start Docker and try again.${NC}"
  exit 1
fi

# Check if the container is already running
if docker ps | grep -q "crm-db-local"; then
  echo -e "${GREEN}PostgreSQL container is already running.${NC}"
else
  # Start PostgreSQL using docker-compose
  echo -e "${YELLOW}Starting PostgreSQL container...${NC}"
  docker-compose -f docker-compose.postgres-only.yml up -d
  
  # Wait for PostgreSQL to start
  echo -e "${YELLOW}Waiting for PostgreSQL to start...${NC}"
  sleep 5
fi

# Install required npm packages
echo -e "${YELLOW}Installing required npm packages...${NC}"
npm install pg bcrypt dotenv

# Apply the system_errors table
echo -e "${YELLOW}Applying system_errors table...${NC}"
node apply_system_errors_table.js

# Apply the users table
echo -e "${YELLOW}Applying users table...${NC}"
node apply_users_table.js

echo -e "${GREEN}PostgreSQL is now running with authentication tables.${NC}"
echo -e "${GREEN}You can now run the server with authentication support.${NC}"
