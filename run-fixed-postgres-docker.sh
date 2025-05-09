#!/bin/bash

# run-fixed-postgres-docker.sh
# This script runs the server with MIME type fixes applied

# Make the script exit on error
set -e

echo "🔍 Checking for required files..."

# Check if fix-mime-types.mjs exists
if [ ! -f "fix-mime-types.mjs" ]; then
  echo "❌ fix-mime-types.mjs not found. Please ensure it exists before running this script."
  exit 1
fi

# Check if inject-mime-fix.js exists
if [ ! -f "inject-mime-fix.js" ]; then
  echo "❌ inject-mime-fix.js not found. Please ensure it exists before running this script."
  exit 1
fi

# Check if server-postgres-docker.js exists
if [ ! -f "server-postgres-docker.js" ]; then
  echo "❌ server-postgres-docker.js not found. Please ensure it exists before running this script."
  exit 1
fi

echo "✅ All required files found"
echo "🚀 Starting server with MIME type fixes..."

# Run the server with experimental modules flag
NODE_OPTIONS="--experimental-modules --es-module-specifier-resolution=node" node server-postgres-docker.js
