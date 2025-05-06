#!/bin/bash
# Script to run the MyAgentView CRM application directly without Docker

# Set script to exit on error
set -e

# Display banner
echo "====================================="
echo "  MyAgentView CRM - Direct Deployment"
echo "====================================="
echo

# Check if Node.js is installed
if ! command -v node > /dev/null 2>&1; then
  echo "Error: Node.js is not installed. Please install it and try again."
  exit 1
fi

# Check if npm is installed
if ! command -v npm > /dev/null 2>&1; then
  echo "Error: npm is not installed. Please install it and try again."
  exit 1
fi

# Load environment variables from .env.local
if [ -f .env.local ]; then
  echo "Loading environment variables from .env.local..."
  export $(grep -v '^#' .env.local | xargs)
else
  echo "Warning: .env.local file not found. Using default environment variables."
fi

# Check if Supabase environment variables are set
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo "Error: Supabase environment variables are not set."
  echo "Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local file."
  exit 1
fi

# Run the application
echo "Starting the application..."
node run-dev.js