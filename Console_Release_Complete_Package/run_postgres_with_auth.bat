@echo off
REM Script to run PostgreSQL in Docker and apply the users table

echo Starting PostgreSQL in Docker...

REM Check if Docker is running
docker info > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Error: Docker is not running. Please start Docker and try again.
  exit /b 1
)

REM Check if the container is already running
docker ps | findstr "crm-db-local" > nul
if %ERRORLEVEL% EQU 0 (
  echo PostgreSQL container is already running.
) else (
  REM Start PostgreSQL using docker-compose
  echo Starting PostgreSQL container...
  docker-compose -f docker-compose.postgres-only.yml up -d
  
  REM Wait for PostgreSQL to start
  echo Waiting for PostgreSQL to start...
  timeout /t 5 /nobreak > nul
)

REM Install required npm packages
echo Installing required npm packages...
call npm install pg bcrypt dotenv

REM Apply the system_errors table
echo Applying system_errors table...
node apply_system_errors_table.js

REM Apply the users table
echo Applying users table...
node apply_users_table.js

echo PostgreSQL is now running with authentication tables.
echo You can now run the server with authentication support.
