@echo off
REM run-fixed-postgres-docker.bat
REM This script runs the server with MIME type fixes applied

echo 🔍 Checking for required files...

REM Check if fix-mime-types.mjs exists
if not exist fix-mime-types.mjs (
  echo ❌ fix-mime-types.mjs not found. Please ensure it exists before running this script.
  exit /b 1
)

REM Check if inject-mime-fix.js exists
if not exist inject-mime-fix.js (
  echo ❌ inject-mime-fix.js not found. Please ensure it exists before running this script.
  exit /b 1
)

REM Check if server-postgres-docker.js exists
if not exist server-postgres-docker.js (
  echo ❌ server-postgres-docker.js not found. Please ensure it exists before running this script.
  exit /b 1
)

echo ✅ All required files found
echo 🚀 Starting server with MIME type fixes...

REM Run the server with experimental modules flag
set NODE_OPTIONS=--experimental-modules --es-module-specifier-resolution=node
node server-postgres-docker.js
