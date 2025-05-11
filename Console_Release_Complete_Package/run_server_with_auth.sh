#!/bin/bash
# Script to run the server with authentication

# Set up colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting server with authentication...${NC}"

# Check if required npm packages are installed
echo -e "${YELLOW}Checking required npm packages...${NC}"
npm list express pg bcrypt jsonwebtoken cors dotenv > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo -e "${YELLOW}Installing required npm packages...${NC}"
  npm install express pg bcrypt jsonwebtoken cors dotenv
fi

# Check if PostgreSQL is running
echo -e "${YELLOW}Checking if PostgreSQL is running...${NC}"
if ! docker ps | grep -q "crm-db-local"; then
  echo -e "${YELLOW}PostgreSQL is not running. Starting PostgreSQL...${NC}"
  ./run_postgres_with_auth.sh
fi

# Start the server
echo -e "${GREEN}Starting server with authentication...${NC}"
node run_server_with_auth.js

echo -e "${GREEN}Server started successfully.${NC}"
