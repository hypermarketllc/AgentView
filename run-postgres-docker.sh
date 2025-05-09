#!/bin/bash

# Check if .env file exists, if not create from example
if [ ! -f .env ]; then
  if [ -f .env.postgres.example ]; then
    echo "Creating .env file from .env.postgres.example..."
    cp .env.postgres.example .env
  else
    echo "Warning: .env.postgres.example not found. Please create a .env file manually."
  fi
fi

# Build the frontend
echo "Building frontend..."
npm run build

# Set environment variables for PostgreSQL
export USE_POSTGRES=true
export VITE_USE_POSTGRES=true
export NODE_ENV=development

# Apply deep patch to path-to-regexp
echo "Applying deep patch to path-to-regexp library..."
node path-to-regexp-deep-patch.mjs

# Start the server
echo "Starting server with PostgreSQL..."
echo "Using path-to-regexp patch to handle invalid route patterns..."
node server-postgres-docker.js
