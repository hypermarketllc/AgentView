@echo off
REM run-postgres-migration-check.bat
REM
REM A script to run the PostgreSQL migration checks on Windows.
REM This will test the database connection and admin authentication.

echo =========================================
echo    PostgreSQL Migration Check Script     
echo =========================================
echo.

REM Check if .env file exists
if not exist .env (
  echo Warning: .env file not found. Using default values.
  echo You may need to create a .env file with your PostgreSQL credentials.
  echo.
) else (
  echo Found .env file. Using environment variables from .env.
  echo.
)

REM Check if required packages are installed
echo Checking required packages...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo Error: Node.js is not installed. Please install Node.js to continue.
  exit /b 1
)

REM Check if required Node.js packages are installed
echo Checking required Node.js packages...
node -e "try { require('pg'); require('dotenv'); require('bcrypt'); require('jsonwebtoken'); } catch(e) { console.error(e.message); process.exit(1); }" >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo Installing required packages...
  call npm install pg dotenv bcrypt jsonwebtoken
  echo.
)

echo All required packages are installed.
echo.

REM Run the PostgreSQL connection check
echo Running PostgreSQL connection check...
echo ----------------------------------------
node check-postgres-connection.js
echo ----------------------------------------
echo.

REM Ask if user wants to continue with admin auth check
set /p CONTINUE="Do you want to run the admin authentication check? (y/n): "
if /i "%CONTINUE%"=="y" (
  REM Run the admin authentication check
  echo Running admin authentication check...
  echo ----------------------------------------
  node check-admin-auth.js
  echo ----------------------------------------
  echo.
) else (
  echo Skipping admin authentication check.
  echo.
)

echo PostgreSQL migration check completed.
echo =========================================
echo.
echo If you encountered any issues, please check the following:
echo 1. Make sure PostgreSQL is running
echo 2. Check your database credentials in .env file
echo 3. Ensure the database schema is properly set up
echo 4. Refer to POSTGRES_MIGRATION_DOCUMENTATION.md for more information
echo.

pause
