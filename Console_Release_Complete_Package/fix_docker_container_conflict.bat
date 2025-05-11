@echo off
REM Script to fix Docker container name conflict
REM This script checks if the container exists, stops and removes it if it does,
REM and then starts the docker-compose with the error-logging configuration

echo Checking for existing crm-db container...

REM Check if the container exists
docker ps -a --format "{{.Names}}" | findstr "crm-db" > nul
if %ERRORLEVEL% == 0 (
    echo Container crm-db exists. Stopping and removing it...
    
    REM Stop the container if it's running
    docker stop crm-db
    
    REM Remove the container
    docker rm crm-db
    
    echo Container crm-db has been removed.
) else (
    echo No existing crm-db container found.
)

echo Starting docker-compose with error-logging configuration...

REM Start the docker-compose with the error-logging configuration
docker-compose -f docker-compose.error-logging.yml up --build -d

echo Docker containers started successfully.
