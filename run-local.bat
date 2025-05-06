@echo off
REM Script to run the MyAgentView CRM application locally using Docker Compose

echo =====================================
echo   MyAgentView CRM - Local Deployment
echo =====================================
echo.

REM Check if Docker is running
docker info > nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo Error: Docker is not running. Please start Docker and try again.
  exit /b 1
)

REM Build and start the containers
echo Building and starting containers...
docker-compose -f docker-compose.local.yml up -d --build

REM Wait for the application to start
echo Waiting for the application to start...
timeout /t 5 /nobreak > nul

REM Check if the application is running
docker-compose -f docker-compose.local.yml ps | findstr "crm-app-local.*Up" > nul
if %ERRORLEVEL% equ 0 (
  echo.
  echo =====================================
  echo   MyAgentView CRM is now running!
  echo =====================================
  echo.
  echo Access the application at: http://localhost:3000/crm
  echo.
  echo Default test account:
  echo   Email: agent@example.com
  echo   Password: Agent123!
  echo.
  echo To stop the application, run:
  echo   docker-compose -f docker-compose.local.yml down
  echo.
) else (
  echo.
  echo Error: The application failed to start. Check the logs with:
  echo   docker-compose -f docker-compose.local.yml logs
  echo.
  exit /b 1
)