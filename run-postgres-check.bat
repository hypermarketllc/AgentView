@echo off
REM run-postgres-check.bat
REM
REM A script to run the PostgreSQL checks on Windows.
REM This will test the database connection and admin authentication.

echo =========================================
echo    PostgreSQL Check Script (Windows)     
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

REM Parse command line arguments
set RUN_ALL=false
set RUN_CONNECTION=false
set RUN_AUTH=false

:parse_args
if "%~1"=="" goto run_checks
if /i "%~1"=="--all" set RUN_ALL=true
if /i "%~1"=="-a" set RUN_ALL=true
if /i "%~1"=="--connection" set RUN_CONNECTION=true
if /i "%~1"=="-c" set RUN_CONNECTION=true
if /i "%~1"=="--auth" set RUN_AUTH=true
if /i "%~1"=="-u" set RUN_AUTH=true
shift
goto parse_args

:run_checks
set ARGS=

if "%RUN_ALL%"=="true" (
  set ARGS=--all
) else (
  if "%RUN_CONNECTION%"=="true" set ARGS=%ARGS% --connection
  if "%RUN_AUTH%"=="true" set ARGS=%ARGS% --auth
)

REM Run the PostgreSQL check script
echo Running PostgreSQL checks with Node.js...
echo.
node run-postgres-check.js %ARGS%

echo.
echo PostgreSQL check completed.
echo =========================================
echo.
echo If you encountered any issues, please check the following:
echo 1. Make sure PostgreSQL is running
echo 2. Check your database credentials in .env file
echo 3. Ensure the database schema is properly set up
echo 4. Refer to POSTGRES_MIGRATION_DOCUMENTATION.md for more information
echo.

pause
