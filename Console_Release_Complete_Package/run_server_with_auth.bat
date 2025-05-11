@echo off
REM Script to run the server with authentication

echo Starting server with authentication...

REM Check if required npm packages are installed
echo Checking required npm packages...
call npm list express pg bcrypt jsonwebtoken cors dotenv > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Installing required npm packages...
  call npm install express pg bcrypt jsonwebtoken cors dotenv
)

REM Check if PostgreSQL is running
echo Checking if PostgreSQL is running...
docker ps | findstr "crm-db-local" > nul
if %ERRORLEVEL% NEQ 0 (
  echo PostgreSQL is not running. Starting PostgreSQL...
  call run_postgres_with_auth.bat
)

REM Start the server
echo Starting server with authentication...
node run_server_with_auth.mjs

echo Server started successfully.
