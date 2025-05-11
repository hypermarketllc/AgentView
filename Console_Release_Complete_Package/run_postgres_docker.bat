@echo off
echo Stopping and removing existing containers if they exist...
docker-compose -f docker-compose.postgres-only.yml down

echo Starting PostgreSQL database in Docker...
docker-compose -f docker-compose.postgres-only.yml up -d

echo Waiting for PostgreSQL to be ready...
timeout /t 5 /nobreak > nul

echo Checking database status...
docker-compose -f docker-compose.postgres-only.yml ps

echo.
echo PostgreSQL database is now running in Docker.
echo You can now run the local frontend server with "node ../run-dev.js"
echo pgAdmin is available at http://localhost:5050
echo Database connection details:
echo   Host: localhost
echo   Port: 5432
echo   Database: crm_db
echo   User: crm_user
echo   Password: your_strong_password_here
echo.
