#!/bin/bash
# run-postgres-check.sh
#
# A script to run the PostgreSQL checks on Unix-like systems.
# This will test the database connection and admin authentication.

echo "========================================="
echo "   PostgreSQL Check Script (Unix-like)   "
echo "========================================="
echo

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Warning: .env file not found. Using default values."
  echo "You may need to create a .env file with your PostgreSQL credentials."
  echo
else
  echo "Found .env file. Using environment variables from .env."
  echo
fi

# Parse command line arguments
RUN_ALL=false
RUN_CONNECTION=false
RUN_AUTH=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --all|-a)
      RUN_ALL=true
      shift
      ;;
    --connection|-c)
      RUN_CONNECTION=true
      shift
      ;;
    --auth|-u)
      RUN_AUTH=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--all|-a] [--connection|-c] [--auth|-u]"
      exit 1
      ;;
  esac
done

# Set up arguments
ARGS=""

if [ "$RUN_ALL" = true ]; then
  ARGS="--all"
else
  if [ "$RUN_CONNECTION" = true ]; then
    ARGS="$ARGS --connection"
  fi
  if [ "$RUN_AUTH" = true ]; then
    ARGS="$ARGS --auth"
  fi
fi

# Run the PostgreSQL check script
echo "Running PostgreSQL checks with Node.js..."
echo
node run-postgres-check.js $ARGS

echo
echo "PostgreSQL check completed."
echo "========================================="
echo
echo "If you encountered any issues, please check the following:"
echo "1. Make sure PostgreSQL is running"
echo "2. Check your database credentials in .env file"
echo "3. Ensure the database schema is properly set up"
echo "4. Refer to POSTGRES_MIGRATION_DOCUMENTATION.md for more information"
echo

# Make this script executable
chmod +x "$0"
