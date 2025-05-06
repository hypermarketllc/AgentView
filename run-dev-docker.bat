@echo off
REM Script to run the MyAgentView CRM application in development mode using Docker

echo =====================================
echo   MyAgentView CRM - Docker Development
echo =====================================
echo.

REM Check if Docker is installed
where docker >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo Error: Docker is not installed. Please install it and try again.
  exit /b 1
)

REM Check if Docker Compose is installed
where docker-compose >nul 2>&1
if %ERRORLEVEL% neq 0 (
  echo Error: Docker Compose is not installed. Please install it and try again.
  exit /b 1
)

REM Build and start the containers
echo Building and starting the Docker containers...
docker-compose -f docker-compose.dev.yml up --build -d

REM Display information
echo.
echo Development server is running!
echo Access the application at: http://localhost:5173/crm
echo.
echo To view logs, run: docker-compose -f docker-compose.dev.yml logs -f app
echo To stop the server, run: docker-compose -f docker-compose.dev.yml down
echo.