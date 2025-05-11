@echo off
REM Set environment variables for Docker PostgreSQL
set POSTGRES_HOST=localhost
set POSTGRES_PORT=5432
set POSTGRES_DB=crm_db
set POSTGRES_USER=crm_user
set POSTGRES_PASSWORD=your_strong_password_here
set ERROR_LOGGING_ENABLED=true

echo Stopping and removing existing containers if they exist...
docker-compose -f docker-compose.postgres-only.yml down

echo Starting PostgreSQL database in Docker...
docker-compose -f docker-compose.postgres-only.yml up -d

echo Waiting for PostgreSQL to be ready...
timeout /t 5 /nobreak > nul

echo Checking database status...
docker-compose -f docker-compose.postgres-only.yml ps



echo.
echo Starting local server with Docker PostgreSQL...
node run_server_with_error_logging_fixed.mjs
