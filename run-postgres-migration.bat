@echo off
REM PostgreSQL Migration Script for Windows
REM This script migrates the application from Supabase to PostgreSQL

echo Starting PostgreSQL migration...

REM Set default values
set POSTGRES_HOST=localhost
set POSTGRES_PORT=5432
set POSTGRES_DB=crm_db
set POSTGRES_USER=crm_user
set POSTGRES_PASSWORD=your_strong_password_here

REM Load environment variables from .env if it exists
if exist .env (
  for /f "tokens=*" %%a in (.env) do (
    set %%a
  )
)

REM Load environment variables from .env.local if it exists
if exist .env.local (
  for /f "tokens=*" %%a in (.env.local) do (
    set %%a
  )
)

echo Host: %POSTGRES_HOST%
echo Port: %POSTGRES_PORT%
echo Database: %POSTGRES_DB%
echo User: %POSTGRES_USER%

REM Check if PostgreSQL is running
echo Checking PostgreSQL connection...
pg_isready -h %POSTGRES_HOST% -p %POSTGRES_PORT%
if %ERRORLEVEL% neq 0 (
  echo PostgreSQL is not running. Please start PostgreSQL first.
  exit /b 1
)

REM Create database and user if they don't exist
echo Creating database and user if they don't exist...

REM Check if database exists
psql -h %POSTGRES_HOST% -p %POSTGRES_PORT% -U postgres -c "SELECT 1 FROM pg_database WHERE datname = '%POSTGRES_DB%'"
if %ERRORLEVEL% neq 0 (
  echo Creating database %POSTGRES_DB%...
  psql -h %POSTGRES_HOST% -p %POSTGRES_PORT% -U postgres -c "CREATE DATABASE %POSTGRES_DB%"
)

REM Check if user exists
psql -h %POSTGRES_HOST% -p %POSTGRES_PORT% -U postgres -c "SELECT 1 FROM pg_roles WHERE rolname = '%POSTGRES_USER%'"
if %ERRORLEVEL% neq 0 (
  echo Creating user %POSTGRES_USER%...
  psql -h %POSTGRES_HOST% -p %POSTGRES_PORT% -U postgres -c "CREATE USER %POSTGRES_USER% WITH ENCRYPTED PASSWORD '%POSTGRES_PASSWORD%'"
  psql -h %POSTGRES_HOST% -p %POSTGRES_PORT% -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE %POSTGRES_DB% TO %POSTGRES_USER%"
)

REM Run schema creation scripts
echo Creating database schema...
psql -h %POSTGRES_HOST% -p %POSTGRES_PORT% -U %POSTGRES_USER% -d %POSTGRES_DB% -f supabase-export/create_tables.sql
psql -h %POSTGRES_HOST% -p %POSTGRES_PORT% -U %POSTGRES_USER% -d %POSTGRES_DB% -f supabase-export/create_auth_tables.sql

REM Set up permissions
echo Setting up database permissions...
psql -h %POSTGRES_HOST% -p %POSTGRES_PORT% -U %POSTGRES_USER% -d %POSTGRES_DB% -f setup-db-permissions.sql

REM Import data from Supabase export
echo Importing data from Supabase export...
psql -h %POSTGRES_HOST% -p %POSTGRES_PORT% -U %POSTGRES_USER% -d %POSTGRES_DB% -f supabase-export/insert_data.sql

REM Run complete migration script
echo Running complete migration script...
psql -h %POSTGRES_HOST% -p %POSTGRES_PORT% -U %POSTGRES_USER% -d %POSTGRES_DB% -f complete-postgres-migration.sql

echo Migration completed successfully!
echo You can now run the application with PostgreSQL using:
echo npm run dev
