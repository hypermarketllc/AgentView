#!/bin/bash
# run-postgres-migration-check.sh
#
# A script to run the PostgreSQL migration checks.
# This will test the database connection and admin authentication.

# Set text colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}   PostgreSQL Migration Check Script     ${NC}"
echo -e "${BLUE}=========================================${NC}"
echo

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${YELLOW}Warning: .env file not found. Using default values.${NC}"
  echo -e "${YELLOW}You may need to create a .env file with your PostgreSQL credentials.${NC}"
  echo
else
  echo -e "${GREEN}Found .env file. Using environment variables from .env.${NC}"
  echo
fi

# Check if required packages are installed
echo -e "${BLUE}Checking required packages...${NC}"
if ! command -v node &> /dev/null; then
  echo -e "${RED}Error: Node.js is not installed. Please install Node.js to continue.${NC}"
  exit 1
fi

# Check if required Node.js packages are installed
echo -e "${BLUE}Checking required Node.js packages...${NC}"
if ! node -e "try { require('pg'); require('dotenv'); require('bcrypt'); require('jsonwebtoken'); } catch(e) { console.error(e.message); process.exit(1); }"; then
  echo -e "${YELLOW}Installing required packages...${NC}"
  npm install pg dotenv bcrypt jsonwebtoken
  echo
fi

echo -e "${GREEN}All required packages are installed.${NC}"
echo

# Run the PostgreSQL connection check
echo -e "${BLUE}Running PostgreSQL connection check...${NC}"
echo -e "${BLUE}----------------------------------------${NC}"
node check-postgres-connection.js
echo -e "${BLUE}----------------------------------------${NC}"
echo

# Ask if user wants to continue with admin auth check
read -p "Do you want to run the admin authentication check? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  # Run the admin authentication check
  echo -e "${BLUE}Running admin authentication check...${NC}"
  echo -e "${BLUE}----------------------------------------${NC}"
  node check-admin-auth.js
  echo -e "${BLUE}----------------------------------------${NC}"
  echo
else
  echo -e "${YELLOW}Skipping admin authentication check.${NC}"
  echo
fi

echo -e "${GREEN}PostgreSQL migration check completed.${NC}"
echo -e "${BLUE}=========================================${NC}"
echo
echo -e "If you encountered any issues, please check the following:"
echo -e "1. Make sure PostgreSQL is running"
echo -e "2. Check your database credentials in .env file"
echo -e "3. Ensure the database schema is properly set up"
echo -e "4. Refer to POSTGRES_MIGRATION_DOCUMENTATION.md for more information"
echo
